const express = require('express');
const path = require('path');
const screenshotHandler = require('./api/screenshot');

const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.post('/api/screenshot', screenshotHandler);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development',
    isVercel: process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production'
  });
});

// 根路径返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 