// Vercel 环境专用测试脚本
const puppeteer = require('puppeteer-core');

// 模拟 Vercel 环境变量
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

console.log('=== Vercel 环境 Chromium 兼容性测试 ===');
console.log(`Node.js 版本: ${process.version}`);
console.log(`平台: ${process.platform} ${process.arch}`);

async function testVercelChromium() {
  console.log('\n1. 测试 @sparticuz/chromium 包加载...');
  
  let chromium;
  try {
    chromium = require('@sparticuz/chromium');
    console.log('✓ @sparticuz/chromium 包加载成功');
  } catch (error) {
    console.error('✗ @sparticuz/chromium 包加载失败:', error.message);
    return false;
  }

  console.log('\n2. 测试 Chromium 可执行路径...');
  let executablePath;
  try {
    executablePath = await chromium.executablePath();
    console.log(`✓ Chromium 可执行路径: ${executablePath}`);
  } catch (error) {
    console.error('✗ 获取 Chromium 可执行路径失败:', error.message);
    return false;
  }

  console.log('\n3. 测试字体加载...');
  try {
    await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
    console.log('✓ 字体加载成功');
  } catch (error) {
    console.log('⚠ 字体加载失败 (非关键):', error.message);
  }

  console.log('\n4. 测试浏览器启动 (主配置)...');
  let browser;
  try {
    const launchOptions = {
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess,AudioServiceSandbox',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      timeout: 60000,
    };

    console.log('启动参数:', JSON.stringify(launchOptions, null, 2));
    
    browser = await puppeteer.launch(launchOptions);
    console.log('✓ 浏览器启动成功 (主配置)');
    
    await browser.close();
    console.log('✓ 浏览器关闭成功');
    
  } catch (error) {
    console.error('✗ 主配置启动失败:', error.message);
    
    console.log('\n5. 测试浏览器启动 (备用配置)...');
    try {
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
        executablePath: executablePath,
        headless: true,
        timeout: 30000,
      };

      browser = await puppeteer.launch(fallbackOptions);
      console.log('✓ 浏览器启动成功 (备用配置)');
      
      await browser.close();
      console.log('✓ 浏览器关闭成功');
      
    } catch (fallbackError) {
      console.error('✗ 备用配置也失败:', fallbackError.message);
      console.error('完整错误信息:', fallbackError);
      return false;
    }
  }

  console.log('\n6. 测试截图功能...');
  try {
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: executablePath,
      headless: true,
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test Page</h1></body></html>');
    
    const screenshot = await page.screenshot({ 
      type: 'jpeg', 
      quality: 80 
    });
    
    console.log(`✓ 截图生成成功，大小: ${Math.round(screenshot.length / 1024)}KB`);
    
    await browser.close();
    
  } catch (error) {
    console.error('✗ 截图测试失败:', error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // 忽略关闭错误
      }
    }
    return false;
  }

  return true;
}

async function main() {
  try {
    const success = await testVercelChromium();
    
    if (success) {
      console.log('\n✅ 所有测试通过！Vercel 环境配置正确。');
      console.log('\n📋 部署建议:');
      console.log('1. 确保 vercel.json 中设置了 1024MB 内存');
      console.log('2. 使用 @sparticuz/chromium@131.0.0 版本');
      console.log('3. 使用 puppeteer-core@23.10.4 版本');
      console.log('4. 设置适当的环境变量');
      process.exit(0);
    } else {
      console.log('\n❌ 测试失败！需要检查配置。');
      console.log('\n🔧 故障排除建议:');
      console.log('1. 检查 @sparticuz/chromium 版本兼容性');
      console.log('2. 确认 Node.js 版本为 20.x');
      console.log('3. 检查 Vercel 函数内存设置');
      console.log('4. 查看详细错误日志');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 测试过程中发生未处理的错误:', error);
    process.exit(1);
  }
}

// 仅在直接运行时执行
if (require.main === module) {
  main();
}

module.exports = { testVercelChromium };
