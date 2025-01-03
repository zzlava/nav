# 网站导航

一个现代化的网站导航工具，帮助整理和分享有价值的网站资源。

## 功能特性

### 前台功能
- 🎯 分类浏览：支持多种分类（社交、技术、新闻、工具等）
- 🌓 深色模式：支持浅色/深色主题切换
- 📱 响应式设计：完美适配各种设备屏幕
- 🔍 智能分类：自动分析网站内容并归类
- 🖼️ 网站预览：自动生成网站预览截图
- 🚀 快速访问：一键跳转目标网站

### 后台功能
- 🔐 安全认证：基本认证保护管理界面
- 📥 批量导入：支持批量添加网站
- 🤖 智能分析：自动提取网站标题和描述
- 🗑️ 资源管理：支持删除和清理功能

## 技术栈

- 🎯 Next.js 14 - React框架
- 💾 Sanity - 内容管理系统
- 🎨 Tailwind CSS - 样式框架
- 🤖 Google Gemini - AI分析
- 📸 Playwright - 网站截图
- 🌓 next-themes - 主题切换
- 🔐 Basic Auth - 认证保护

## 本地开发

1. 克隆项目
```bash
git clone [repository-url]
cd [project-name]
```

2. 安装依赖
```bash
npm install
# 或
pnpm install
```

3. 配置环境变量
创建 `.env.local` 文件并添加以下配置：
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token
ADMIN_PASSWORD=your-admin-password
GEMINI_API_KEY=your-gemini-api-key
```

4. 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
```

## 部署

项目可以轻松部署到 Vercel：

1. Fork 本项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 完成部署

## 使用说明

### 前台使用
1. 访问首页可以浏览所有网站
2. 使用左侧分类栏筛选不同类别的网站
3. 点击卡片直接访问目标网站
4. 点击右上角图标切换主题

### 后台管理
1. 访问 `/admin` 路径进入管理界面
2. 输入管理员密码登录
3. 在文本框中每行输入一个网址
4. 点击"批量添加"按钮导入网站

## 贡献指南

欢迎提交 Pull Request 或创建 Issue。

## 许可证

MIT License 