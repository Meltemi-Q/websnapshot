# WebSnap 部署指南

## 🚀 快速部署到 Vercel

### 1. 准备工作
- 确保代码已推送到 GitHub 仓库
- 拥有 Vercel 账户

### 2. 一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo-name)

### 3. 手动部署步骤

1. **登录 Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **部署项目**
   ```bash
   vercel --prod
   ```

3. **配置环境变量**（可选）
   - `NODE_ENV=production`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

### 4. 验证部署
访问部署后的 URL，检查：
- 主页是否正常加载
- `/api/health` 端点是否返回正常状态
- 截图功能是否工作

## 🔧 本地开发环境设置

### 1. 系统要求
- Node.js 18.x 或更高版本
- Chrome 浏览器

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm start
# 或指定端口
PORT=3001 npm start
```

### 4. 测试功能
```bash
npm run test
```

## 🐛 常见部署问题

### Vercel 部署失败

**问题**: `Failed to launch the browser process`
**解决方案**:
1. 检查 `@sparticuz/chromium` 版本是否最新
2. 确保 Vercel 函数内存设置为 1024MB
3. 查看 Vercel 函数日志获取详细错误

**问题**: 函数超时
**解决方案**:
1. 增加 `maxDuration` 设置
2. 优化图片质量设置
3. 使用较小的设备尺寸

### 本地开发问题

**问题**: Chrome 未找到
**解决方案**:
1. 安装 Chrome 浏览器
2. 检查 Chrome 安装路径
3. 运行 `npm run test` 诊断

**问题**: 权限错误
**解决方案**:
```bash
# Linux/macOS
sudo chmod +x /usr/bin/google-chrome

# 或使用 --no-sandbox 参数（已在代码中包含）
```

## 📊 性能优化

### Vercel 环境
- 使用 1024MB 内存配置
- 启用函数缓存
- 优化图片质量设置

### 本地环境
- 关闭不必要的 Chrome 扩展
- 使用 SSD 存储
- 确保足够的系统内存

## 🔍 监控和日志

### Vercel 日志
```bash
vercel logs [deployment-url]
```

### 本地调试
```bash
DEBUG=puppeteer:* npm start
```

### 健康检查
```bash
curl https://your-app.vercel.app/api/health
```

## 🔒 安全考虑

1. **输入验证**: 已实现 URL 格式验证
2. **资源限制**: 设置了超时和内存限制
3. **CORS 配置**: 根据需要调整 CORS 设置
4. **错误处理**: 避免泄露敏感信息

## 📈 扩展建议

### 功能扩展
- 添加用户认证
- 实现截图缓存
- 支持批量截图
- 添加水印功能

### 性能扩展
- 使用 CDN 加速
- 实现负载均衡
- 添加数据库存储
- 使用队列处理

## 🆘 获取帮助

如果遇到问题：
1. 查看 [故障排除文档](README.md#故障排除)
2. 运行诊断脚本: `npm run test`
3. 检查 GitHub Issues
4. 提交新的 Issue 报告问题

---

**注意**: 本项目针对 Vercel 平台优化，其他平台可能需要额外配置。
