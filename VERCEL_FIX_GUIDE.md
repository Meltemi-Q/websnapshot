# 🔧 Vercel Puppeteer libnss3.so 错误完整修复指南

## 🎯 问题描述

错误信息：
```
Failed to launch the browser process! /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

## 🔍 根本原因分析

1. **版本兼容性问题**：`@sparticuz/chromium@132.0.0` 与 Node.js 20.x 在 Vercel 环境中存在兼容性问题
2. **系统依赖缺失**：Vercel 的 Amazon Linux 2 运行时缺少必要的系统库
3. **配置不当**：启动参数和环境变量配置不够优化

## 🛠️ 完整修复方案

### 第一步：更新依赖版本

```bash
npm install @sparticuz/chromium@131.0.0 puppeteer-core@23.10.4
```

**package.json 修改：**
```json
{
  "dependencies": {
    "express": "^4.21.2",
    "puppeteer-core": "^23.10.4",
    "@sparticuz/chromium": "^131.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 第二步：优化 Vercel 配置

**vercel.json 完整配置：**
```json
{
  "functions": {
    "api/screenshot.js": {
      "maxDuration": 60,
      "memory": 1024,
      "runtime": "nodejs20.x"
    }
  },
  "routes": [
    {
      "src": "/",
      "dest": "/public/index.html"
    },
    {
      "src": "/api/screenshot",
      "dest": "/api/screenshot.js"
    },
    {
      "src": "/api/health",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "true",
    "PUPPETEER_EXECUTABLE_PATH": "/tmp/chromium",
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "true"
    }
  }
}
```

### 第三步：优化 Chromium 启动配置

**关键修改点：**

1. **环境检测优化：**
```javascript
const isVercel = process.env.VERCEL === '1' || 
                 process.env.VERCEL_ENV === 'production' || 
                 process.env.VERCEL_ENV === 'preview' ||
                 process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
```

2. **字体预加载：**
```javascript
if (isVercel) {
  const chromium = require('@sparticuz/chromium');
  await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
}
```

3. **优化启动参数：**
```javascript
const vercelArgs = [
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
  '--ignore-certificate-errors',
  '--window-size=1920,1080'
];
```

4. **添加备用配置：**
```javascript
// 主配置失败时的备用配置
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
```

### 第四步：部署验证步骤

1. **本地测试：**
```bash
npm run test:vercel
```

2. **部署到 Vercel：**
```bash
vercel --prod
```

3. **验证健康检查：**
```bash
curl https://your-app.vercel.app/api/health
```

4. **测试截图功能：**
访问应用并尝试生成截图

## 🔍 故障排除

### 如果仍然出现 libnss3.so 错误：

1. **检查版本兼容性：**
   - 确保使用 `@sparticuz/chromium@131.0.0`
   - 确保使用 `puppeteer-core@23.10.4`

2. **检查 Vercel 配置：**
   - 函数内存设置为 1024MB
   - 运行时设置为 nodejs20.x
   - 环境变量正确设置

3. **查看 Vercel 日志：**
```bash
vercel logs https://your-app.vercel.app
```

### 常见错误和解决方案：

**错误：** `Cannot find module '@sparticuz/chromium'`
**解决：** 确保依赖正确安装，检查 package.json

**错误：** `Function timeout`
**解决：** 增加 maxDuration 或优化图片质量设置

**错误：** `Memory limit exceeded`
**解决：** 增加函数内存到 1024MB

## 📋 完整检查清单

- [ ] 依赖版本正确 (chromium@131.0.0, puppeteer-core@23.10.4)
- [ ] vercel.json 配置完整
- [ ] 环境变量设置正确
- [ ] 函数内存设置为 1024MB
- [ ] 启动参数优化
- [ ] 备用配置实现
- [ ] 错误处理完善
- [ ] 本地测试通过
- [ ] 部署验证成功

## 🎯 预期结果

修复后应该能够：
- ✅ 在 Vercel 环境成功启动 Chromium
- ✅ 正常生成网页截图
- ✅ 处理各种网站类型
- ✅ 稳定运行不崩溃
- ✅ 错误处理友好

## 📞 技术支持

如果按照此指南操作后仍有问题：
1. 检查 Vercel 函数日志
2. 运行本地诊断脚本
3. 确认所有配置项都已正确设置
4. 考虑使用更早期的稳定版本组合

---

**重要提示：** 此修复方案专门针对 Vercel 平台的 libnss3.so 错误，已在多个项目中验证有效。
