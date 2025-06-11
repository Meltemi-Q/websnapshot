# WebSnap - 网址转长图工具

一个现代化的网页截图工具，支持任何网址转换为高质量的长截图。专为 Vercel 部署优化，同时支持本地开发。

## ✨ 功能特点

- 🖼️ **完整网页截图** - 支持长页面完整截图
- 🌐 **智能URL处理** - 自动添加协议前缀，支持不带http的输入
- 📱 **多设备支持** - 桌面(1440×900)、平板(768×1024)、手机(375×667)
- 🎨 **可调图片质量** - 高质量、中等质量、低质量选项
- ⚛️ **现代框架支持** - 优化React等SPA应用截图
- ⚡ **性能优化** - 智能资源拦截，避免大面积空白
- 🚀 **Vercel就绪** - 完美支持Vercel免费计划部署
- 🎯 **现代UI** - 简洁美观的用户界面

## 🎮 在线体验

访问部署后的应用即可立即使用：
- 输入网址（支持 `example.com` 或 `https://example.com`）
- 选择设备类型和图片质量
- 点击生成截图

## 🛠️ 本地开发

### 环境要求
- Node.js 18.x 或更高版本
- 系统已安装 Chrome 浏览器

### 快速开始

1. **克隆项目**
```bash
git clone <your-repo-url>
cd screen
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm start
# 或
npm run dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:3000`

## 🚀 Vercel 部署

### 一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### 手动部署
1. Fork 此仓库到你的 GitHub 账户
2. 在 Vercel 中导入项目
3. 部署完成后即可使用

### 环境配置
无需额外环境变量配置，开箱即用。

## 📡 API 接口

### 截图接口
```
POST /api/screenshot
```

**请求体：**
```json
{
  "url": "example.com",          // 网址（自动添加https://）
  "device": "desktop",           // 设备类型：desktop|tablet|mobile
  "quality": "medium"            // 图片质量：high|medium|low
}
```

**响应：**
```json
{
  "success": true,
  "image": "data:image/jpeg;base64,/9j/4AAQ...",  // Base64图片数据
  "device": "desktop",
  "quality": "medium", 
  "url": "https://example.com",
  "dimensions": {
    "width": 1440,
    "height": 900
  }
}
```

## 🏗️ 技术栈

- **运行时**: Node.js 18.x
- **Web框架**: Express.js
- **截图引擎**: Puppeteer Core + Chromium
- **前端**: 原生 HTML/CSS/JavaScript
- **部署平台**: Vercel Serverless Functions

## 📋 项目结构

```
screen/
├── api/
│   └── screenshot.js       # Serverless API函数
├── public/
│   └── index.html         # 前端页面
├── server.js              # 本地开发服务器
├── package.json           # 依赖配置
├── vercel.json           # Vercel部署配置
└── .gitignore            # Git忽略文件
```

## 🔧 配置说明

### 设备配置
```javascript
const deviceProfiles = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};
```

### 质量配置
```javascript
const qualitySettings = {
  high: 100,    // 高质量
  medium: 80,   // 中等质量
  low: 60       // 低质量
};
```

## 🚨 注意事项

- Vercel 免费计划有 10 秒函数执行时间限制
- 某些复杂页面可能需要更长加载时间
- 建议在 Vercel 部署时使用较低的图片质量以提升速度
- 本地开发需要系统安装 Chrome 浏览器

## 🔧 故障排除

### 常见问题解决方案

#### 1. Puppeteer 依赖错误
如果遇到 `libnss3.so` 或其他系统库缺失错误：

**Vercel 环境：**
- 确保使用最新版本的 `@sparticuz/chromium`
- 检查 Vercel 函数内存设置（建议 1024MB）
- 查看 Vercel 函数日志获取详细错误信息

**本地环境：**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2

# CentOS/RHEL
sudo yum install -y nss atk at-spi2-atk libdrm libxkbcommon libXcomposite libXdamage libXrandr libgbm libXss alsa-lib
```

#### 2. Chrome 浏览器未找到
运行测试脚本检查 Chrome 安装：
```bash
npm run test
```

如果 Chrome 未安装：
- **Windows**: 从 [Chrome 官网](https://www.google.com/chrome/) 下载安装
- **macOS**: `brew install --cask google-chrome`
- **Linux**: `sudo apt-get install google-chrome-stable`

#### 3. 内存不足错误
- 降低图片质量设置
- 使用较小的设备尺寸
- 在 Vercel 中增加函数内存限制

#### 4. 网页加载超时
- 检查目标网站是否可访问
- 某些网站可能阻止自动化访问
- 尝试使用不同的网址进行测试

### 测试和诊断

运行内置测试脚本：
```bash
npm run test
```

检查健康状态：
```bash
curl http://localhost:3000/api/health
```

### 日志调试

启用详细日志：
```bash
DEBUG=puppeteer:* npm start
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License