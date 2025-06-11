// 简化的Vercel环境测试
console.log('=== 简化 Vercel 测试 ===');
console.log(`Node.js 版本: ${process.version}`);

// 模拟 Vercel 环境
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

async function testBasic() {
  try {
    console.log('\n1. 测试 @sparticuz/chromium 包加载...');
    const chromium = require('@sparticuz/chromium');
    console.log('✓ @sparticuz/chromium 包加载成功');
    
    console.log('\n2. 测试 puppeteer-core 包加载...');
    const puppeteer = require('puppeteer-core');
    console.log('✓ puppeteer-core 包加载成功');
    
    console.log('\n3. 测试 Chromium 可执行路径...');
    const executablePath = await chromium.executablePath();
    console.log(`✓ Chromium 可执行路径: ${executablePath}`);
    
    console.log('\n4. 测试基本启动配置...');
    const launchOptions = {
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
    };
    
    console.log('启动配置:', JSON.stringify(launchOptions, null, 2));
    
    console.log('\n✅ 基本测试通过！');
    return true;
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

testBasic().then(success => {
  if (success) {
    console.log('\n🎉 简化测试完成，基本配置正确！');
    process.exit(0);
  } else {
    console.log('\n💥 测试失败，需要检查配置');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 未处理的错误:', error);
  process.exit(1);
});
