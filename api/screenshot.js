const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// 检测运行环境
const isDev = process.env.NODE_ENV !== 'production';
const isVercel = process.env.VERCEL === '1' ||
                 process.env.VERCEL_ENV === 'production' ||
                 process.env.VERCEL_ENV === 'preview' ||
                 process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

// 获取 Chrome 可执行文件路径
async function getChromePath() {
  if (isVercel) {
    // Vercel 环境使用 @sparticuz/chromium
    const chromium = require('@sparticuz/chromium');
    return await chromium.executablePath();
  }
  
  // 本地开发环境的 Chrome 路径
  const os = require('os');
  const platform = os.platform();
  
  const possiblePaths = [];
  
  if (platform === 'win32') {
    possiblePaths.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
      'C:\\Program Files\\Chromium\\Application\\chromium.exe',
      'C:\\Program Files (x86)\\Chromium\\Application\\chromium.exe'
    );
  } else if (platform === 'darwin') {
    possiblePaths.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    possiblePaths.push(
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    );
  }
  
  // 查找第一个存在的路径
  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  // 如果都找不到，返回第一个默认路径
  return possiblePaths[0];
}

// URL 格式化函数 - 支持不加 http 前缀
function formatUrl(url) {
  if (!url) return null;
  
  // 移除首尾空格
  url = url.trim();
  
  // 如果已经有协议，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 默认添加 https://
  return 'https://' + url;
}

// 设备配置
const deviceProfiles = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};

// 质量配置
const qualitySettings = {
  high: 100,
  medium: 80,
  low: 60
};

// Vercel serverless 函数导出
module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { url: rawUrl, device = 'desktop', quality = 'medium' } = req.body;
  
  // 格式化URL
  const url = formatUrl(rawUrl);
  
  if (!url) {
    return res.status(400).json({ error: '请提供有效的URL' });
  }
  
  // 验证URL格式
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: '无效的URL格式' });
  }
  
  // 验证设备类型
  if (!deviceProfiles[device]) {
    return res.status(400).json({ error: '无效的设备类型' });
  }
  
  // 验证质量设置
  if (!qualitySettings[quality]) {
    return res.status(400).json({ error: '无效的质量设置' });
  }
  
  let browser;
  
  try {
    console.log(`开始处理截图请求: ${url}, 设备: ${device}, 质量: ${quality}`);
    console.log(`运行环境: isDev=${isDev}, isVercel=${isVercel}`);
    
    // 浏览器启动配置
    let launchOptions;
    
    if (isVercel) {
      // Vercel 环境配置
      const chromium = require('@sparticuz/chromium');

      // 强制设置 Chromium 配置以避免依赖问题
      await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

      // 为 Vercel 环境优化的启动参数 - 专门解决 libnss3.so 问题
      const vercelArgs = [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-web-security',
        '--disable-features=TranslateUI,VizDisplayCompositor,AudioServiceOutOfProcess,AudioServiceSandbox',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-ipc-flooding-protection',
        '--disable-hang-monitor',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-sync',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-ssl-errors-spki-list',
        '--window-size=1920,1080'
      ];

      launchOptions = {
        args: vercelArgs,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        timeout: 60000,
        ignoreDefaultArgs: ['--disable-extensions'],
      };
      console.log('使用 Vercel @sparticuz/chromium 131.0.0 稳定配置');
    } else {
      // 本地开发环境
      const chromePath = await getChromePath();

      launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--disable-features=TranslateUI,VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--window-size=1920,1080'
        ],
        executablePath: chromePath,
        timeout: 30000,
      };

      console.log(`使用本地 Chrome: ${chromePath}`);

      // 检查 Chrome 是否存在
      if (!fs.existsSync(chromePath)) {
        const errorMsg = `Chrome 可执行文件不存在: ${chromePath}\n\n请确保已安装 Chrome 浏览器，或设置正确的 Chrome 路径。\n\n常见安装路径：\n- Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n- macOS: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome\n- Linux: /usr/bin/google-chrome`;
        throw new Error(errorMsg);
      }
    }
    
    // 启动浏览器
    console.log('正在启动浏览器...');
    console.log('启动参数:', JSON.stringify(launchOptions, null, 2));

    try {
      browser = await puppeteer.launch(launchOptions);
      console.log('浏览器启动成功');
    } catch (launchError) {
      console.error('浏览器启动失败:', launchError.message);
      console.error('完整错误:', launchError);

      // 如果是 Vercel 环境，尝试使用备用配置
      if (isVercel) {
        console.log('尝试使用备用 Vercel 配置...');
        try {
          const chromium = require('@sparticuz/chromium');

          // 备用配置 - 最小化参数
          const fallbackOptions = {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--single-process',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor'
            ],
            executablePath: await chromium.executablePath(),
            headless: true,
            timeout: 30000,
          };

          console.log('使用备用配置启动浏览器...');
          browser = await puppeteer.launch(fallbackOptions);
          console.log('备用配置启动成功');
        } catch (fallbackError) {
          console.error('备用配置也失败:', fallbackError.message);
          throw new Error(`Vercel 环境浏览器启动失败: ${launchError.message}\n\n备用方案也失败: ${fallbackError.message}\n\n这通常是由于：\n1. @sparticuz/chromium 版本与 Node.js 20.x 不兼容\n2. 系统依赖库缺失 (libnss3.so)\n3. Vercel 函数内存不足\n\n建议：\n- 检查依赖版本兼容性\n- 增加函数内存到 1024MB\n- 查看 Vercel 函数日志获取详细信息`);
        }
      } else {
        throw new Error(`本地环境浏览器启动失败: ${launchError.message}\n\n请确保：\n1. Chrome 浏览器已正确安装\n2. Chrome 可执行文件路径正确\n3. 系统权限允许启动 Chrome`);
      }
    }

    const page = await browser.newPage();
    
    // 设置用户代理 - 模拟真实浏览器
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    // 设置设备尺寸
    await page.setViewport({
      width: deviceProfiles[device].width,
      height: deviceProfiles[device].height,
      deviceScaleFactor: 1
    });
    
    // 改进的资源拦截 - 只拦截明确不需要的资源
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      
      // 拦截广告和跟踪脚本
      if (url.includes('google-analytics') || 
          url.includes('googletagmanager') || 
          url.includes('facebook.com/tr') ||
          url.includes('doubleclick.net') ||
          resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // 导航到目标URL
    console.log(`正在访问: ${url}`);
    try {
      await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });
      console.log('页面加载完成');
    } catch (gotoError) {
      console.error('页面加载失败:', gotoError.message);

      // 尝试使用更宽松的等待条件
      try {
        console.log('尝试使用宽松模式重新加载页面...');
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        console.log('宽松模式页面加载完成');
      } catch (retryError) {
        throw new Error(`无法加载页面 ${url}: ${retryError.message}\n\n可能的原因：\n1. 网站响应缓慢或不可访问\n2. 网络连接问题\n3. 网站阻止了自动化访问\n\n请检查网址是否正确且可访问。`);
      }
    }
    
    // 等待现代框架加载完成
    try {
      // 等待 React 应用加载
      await page.waitForFunction(
        () => {
          // 检查是否有 React 组件
          return !document.querySelector('[data-reactroot]') || 
                 document.querySelector('[data-reactroot]').children.length > 0 ||
                 document.readyState === 'complete';
        },
        { timeout: 10000 }
      );
    } catch (e) {
      // 如果等待超时，继续执行
      console.log('React 等待超时，继续截图');
    }
    
    // 等待额外时间确保所有内容加载
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 滚动到底部确保懒加载内容加载
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });
    
    // 再等待一下确保内容稳定
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 获取页面实际高度
    const dimensions = await page.evaluate(() => {
      return {
        width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        height: Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        )
      };
    });
    
    console.log(`页面尺寸: ${dimensions.width}x${dimensions.height}`);
    
    // 设置视口为实际页面大小
    await page.setViewport({
      width: deviceProfiles[device].width,
      height: Math.max(dimensions.height, deviceProfiles[device].height),
      deviceScaleFactor: 1
    });
    
    // 截取整个页面
    console.log('正在生成截图...');
    let screenshot;
    try {
      screenshot = await page.screenshot({
        type: 'jpeg',
        quality: qualitySettings[quality],
        fullPage: true
      });
      console.log(`截图生成成功，大小: ${Math.round(screenshot.length / 1024)}KB`);
    } catch (screenshotError) {
      console.error('截图生成失败:', screenshotError.message);

      // 尝试使用固定尺寸截图作为备选方案
      try {
        console.log('尝试使用固定尺寸截图...');
        screenshot = await page.screenshot({
          type: 'jpeg',
          quality: qualitySettings[quality],
          fullPage: false,
          clip: {
            x: 0,
            y: 0,
            width: deviceProfiles[device].width,
            height: deviceProfiles[device].height
          }
        });
        console.log(`备选截图生成成功，大小: ${Math.round(screenshot.length / 1024)}KB`);
      } catch (fallbackError) {
        throw new Error(`截图生成失败: ${fallbackError.message}\n\n可能的原因：\n1. 页面内容过大或复杂\n2. 内存不足\n3. 页面渲染异常\n\n建议尝试降低图片质量或使用不同的设备类型。`);
      }
    }

    // 将截图转换为Base64
    const base64Image = screenshot.toString('base64');
    const dataURI = `data:image/jpeg;base64,${base64Image}`;
    
    // 返回结果
    res.json({
      success: true,
      image: dataURI,
      device,
      quality,
      url: url,
      dimensions: {
        width: deviceProfiles[device].width,
        height: dimensions.height
      }
    });
    
  } catch (error) {
    console.error('截图生成错误:', error);
    console.error('错误堆栈:', error.stack);
    
    res.status(500).json({ 
      error: '截图生成失败',
      details: error.message,
      url: url,
      stack: isDev ? error.stack : undefined
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('浏览器已关闭');
      } catch (e) {
        console.error('关闭浏览器时出错:', e.message);
      }
    }
  }
};