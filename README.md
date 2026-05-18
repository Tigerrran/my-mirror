# 镜我 / Mirror Self

一个带薄后端的前端网页项目。

目前功能分为三部分：
- 前端页面：`home.html`、`start.html`、`index.html`
- 薄后端：`server.js`

后端只负责两件事：
- 托管静态页面
- 代理第三方 AI API，避免把密钥暴露在前端

## 项目流程

1. **情绪漂流** (`home.html`) - 选择此刻的情绪状态
2. **原始镜像** (`start.html`) - 输入情绪描述，生成心理肖像
3. **内在剧场** (`index.html`) - 描述内在冲突，分析子人格

## 项目结构

```text
my-mirror/
├── home.html          # 情绪选择首页
├── start.html         # 原始镜像生成页面
├── index.html         # 内在剧场页面
├── server.js
├── package.json
├── .env.example
└── README.md
```

## 为什么不能直接双击 HTML 或在 VS Code 里点 F5

这个项目现在不是纯静态网页了。

前端代码里调用的是这些本地接口：
- `/api/generate-visual-prompt`
- `/api/generate-portrait`
- `/api/analyze-theater`
- `/api/summarize-theater`

这些接口需要由 `server.js` 提供。

如果你只是：
- 直接双击 `start.html`
- 或者用 VS Code 的静态预览方式打开 HTML

页面虽然能显示，但后端没有启动，所以：
- `/api/...` 根本不存在
- API 请求会失败

所以正确打开方式不是“直接打开 HTML 文件”，而是“先启动 Node 服务，再访问浏览器地址”。

## 运行步骤

### 1. 进入项目目录

```bash
cd /Users/tiger/Desktop/毕设/AIcoding/my-mirror
```

### 2. 配置环境变量

在项目根目录新建 `.env` 文件，内容参考 `.env.example`：

```env
DEEPSEEK_API_KEY=你的DeepSeek密钥
SILICONFLOW_API_KEY=你的SiliconFlow密钥
PORT=3000
```

### 3. 启动项目

```bash
npm start
```

如果启动成功，终端会输出类似：

```text
Server running at http://localhost:3000
```

### 4. 在浏览器打开

打开：

- [http://localhost:3000](http://localhost:3000)

也可以直接打开：

- [http://localhost:3000/start.html](http://localhost:3000/start.html)
- [http://localhost:3000/index.html](http://localhost:3000/index.html)

## 目前后端提供的接口

- `GET /health`
- `POST /api/generate-visual-prompt`
- `POST /api/generate-portrait`
- `POST /api/analyze-theater`
- `POST /api/summarize-theater`

你可以先访问：

- [http://localhost:3000/health](http://localhost:3000/health)

如果返回 `ok: true`，说明服务正常启动了。

## 文件是否已经真实保存

是的，改动已经直接保存到了项目目录里，包括：

- `server.js`
- `package.json`
- `.env.example`
- `start.html`
- `index.html`
- `README.md`

这些不是临时内容，换编辑器打开也能看到。

## 换电脑还能不能用

可以。

这套代码没有依赖你当前电脑的绝对路径来运行，核心依赖是：
- Node.js
- 项目目录本身
- `.env` 里的 API key
- 浏览器访问 `localhost:3000`

换电脑时只需要：

1. 安装 Node.js
2. 拷贝整个项目目录
3. 在新电脑重新创建 `.env`
4. 运行 `npm start`

## 注意事项

- 不要把 `.env` 上传到 GitHub 或发给别人
- 如果旧的 API key 曾经出现在前端源码里，并且项目发给过别人，建议去平台后台更换新 key
- 如果页面打不开，先检查 `npm start` 是否还在运行

## 常见问题

### 1. 页面能打开，但点按钮没反应

先看终端里启动的 Node 服务是否还在。

再访问：

- [http://localhost:3000/health](http://localhost:3000/health)

如果这个地址都打不开，说明后端没启动。

### 2. VS Code 里按 F5 为什么不行

因为 F5 往往只是启动一个前端预览或静态服务器，它不会自动运行 `server.js`。

而你这个项目已经依赖本地后端接口了，所以必须先单独执行：

```bash
npm start
```

然后再用浏览器打开 `http://localhost:3000`。
