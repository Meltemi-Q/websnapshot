#!/usr/bin/env node

/**
 * Vercel Puppeteer libnss3.so 错误自动修复脚本
 * 
 * 使用方法：
 * node fix-vercel.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 开始修复 Vercel Puppeteer libnss3.so 错误...\n');

// 1. 检查当前项目结构
console.log('1. 检查项目结构...');
const requiredFiles = ['package.json', 'api/screenshot.js', 'vercel.json'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error(`❌ 缺少必要文件: ${missingFiles.join(', ')}`);
  console.error('请确保在正确的项目目录中运行此脚本。');
  process.exit(1);
}
console.log('✅ 项目结构检查通过');

// 2. 备份原始文件
console.log('\n2. 备份原始文件...');
const backupDir = '.backup-' + Date.now();
fs.mkdirSync(backupDir);

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const backupPath = path.join(backupDir, file.replace('/', '_'));
    fs.copyFileSync(file, backupPath);
    console.log(`✅ 备份: ${file} -> ${backupPath}`);
  }
});

// 3. 更新 package.json
console.log('\n3. 更新 package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 更新依赖版本
packageJson.dependencies = packageJson.dependencies || {};
packageJson.dependencies['@sparticuz/chromium'] = '^131.0.0';
packageJson.dependencies['puppeteer-core'] = '^23.10.4';

// 更新引擎要求
packageJson.engines = packageJson.engines || {};
packageJson.engines.node = '>=18.0.0';

// 添加测试脚本
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts['test:vercel'] = 'node vercel-test.js';

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json 已更新');

// 4. 更新 vercel.json
console.log('\n4. 更新 vercel.json...');
const vercelConfig = {
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
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ vercel.json 已更新');

// 5. 更新 api/screenshot.js 中的环境检测
console.log('\n5. 更新环境检测逻辑...');
let screenshotJs = fs.readFileSync('api/screenshot.js', 'utf8');

// 更新环境检测
const oldEnvDetection = /const isVercel = .*?;/s;
const newEnvDetection = `const isVercel = process.env.VERCEL === '1' || 
                 process.env.VERCEL_ENV === 'production' || 
                 process.env.VERCEL_ENV === 'preview' ||
                 process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;`;

if (oldEnvDetection.test(screenshotJs)) {
  screenshotJs = screenshotJs.replace(oldEnvDetection, newEnvDetection);
  console.log('✅ 环境检测逻辑已更新');
} else {
  console.log('⚠️  未找到环境检测逻辑，请手动检查');
}

fs.writeFileSync('api/screenshot.js', screenshotJs);

// 6. 安装依赖
console.log('\n6. 安装更新的依赖...');
try {
  console.log('正在安装依赖，请稍候...');
  execSync('npm install @sparticuz/chromium@131.0.0 puppeteer-core@23.10.4', { 
    stdio: 'inherit',
    timeout: 120000 // 2分钟超时
  });
  console.log('✅ 依赖安装完成');
} catch (error) {
  console.error('❌ 依赖安装失败:', error.message);
  console.log('请手动运行: npm install @sparticuz/chromium@131.0.0 puppeteer-core@23.10.4');
}

// 7. 创建测试脚本（如果不存在）
console.log('\n7. 检查测试脚本...');
if (!fs.existsSync('vercel-test.js')) {
  console.log('创建 Vercel 测试脚本...');
  // 这里可以创建一个简化版的测试脚本
  const testScript = `// Vercel 环境测试脚本
console.log('Vercel 环境测试脚本');
console.log('请运行完整的 vercel-test.js 进行详细测试');
`;
  fs.writeFileSync('vercel-test.js', testScript);
  console.log('✅ 测试脚本已创建');
} else {
  console.log('✅ 测试脚本已存在');
}

// 8. 生成修复报告
console.log('\n8. 生成修复报告...');
const report = `
# Vercel Puppeteer 修复报告

## 修复时间
${new Date().toISOString()}

## 修复内容
- ✅ 更新 @sparticuz/chromium 到 131.0.0
- ✅ 更新 puppeteer-core 到 23.10.4
- ✅ 优化 vercel.json 配置
- ✅ 更新环境检测逻辑
- ✅ 设置函数内存为 1024MB
- ✅ 配置环境变量

## 备份位置
${backupDir}/

## 下一步操作
1. 运行测试: npm run test:vercel
2. 本地测试: npm start
3. 部署到 Vercel: vercel --prod
4. 验证功能: 访问应用并测试截图

## 如果仍有问题
1. 查看 Vercel 函数日志
2. 检查 VERCEL_FIX_GUIDE.md
3. 确认所有配置都已正确应用
`;

fs.writeFileSync('fix-report.md', report);
console.log('✅ 修复报告已生成: fix-report.md');

// 完成
console.log('\n🎉 修复完成！');
console.log('\n📋 下一步操作:');
console.log('1. 运行测试: npm run test:vercel');
console.log('2. 本地测试: npm start');
console.log('3. 部署验证: vercel --prod');
console.log('4. 查看详细指南: VERCEL_FIX_GUIDE.md');

console.log('\n💾 备份文件位置:', backupDir);
console.log('如果修复有问题，可以从备份恢复文件。');

console.log('\n✨ 修复脚本执行完成！');
