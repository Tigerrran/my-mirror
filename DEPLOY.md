# Vercel 部署说明

## 前置条件

1. 注册 [Vercel](https://vercel.com) 账号
2. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```
3. 准备好 API 密钥（DeepSeek 和 SiliconFlow）

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `SILICONFLOW_API_KEY` - SiliconFlow API 密钥

### 3. 部署命令

```bash
vercel
```

按照提示完成部署：
- 选择或创建团队
- 选择项目根目录
- 确认配置信息

### 4. 生产环境部署

```bash
vercel --prod
```

## 或通过 GitHub 部署

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 添加环境变量
4. 自动部署完成

## 注意事项

- 静态文件（HTML、CSS、JS 等）会自动托管
- API 路由会作为 Serverless Functions 部署
- 免费额度：100GB 带宽/月，适合个人使用