# KVideo

![KVideo Banner](public/icon.png)

> 一个基于 Next.js 16 构建的现代化视频聚合播放平台。采用独特的 "Liquid Glass" 设计语言，提供流畅的视觉体验和强大的视频搜索功能。

**🌐 在线体验：[https://kvideo.vercel.app/](https://kvideo.vercel.app/)**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

## 📖 项目简介

**KVideo** 是一个高性能、现代化的视频聚合与播放应用，专注于提供极致的用户体验和视觉设计。本项目利用 Next.js 16 的最新特性，结合 React 19 和 Tailwind CSS v4，打造了一个既美观又强大的视频浏览平台。

### 核心设计理念：Liquid Glass（液态玻璃）

项目的视觉设计基于 **"Liquid Glass"** 设计系统，这是一套融合了以下特性的现代化 UI 设计语言：

- **玻璃拟态效果**：通过 `backdrop-filter` 实现的磨砂半透明效果，让 UI 元素如同真实的玻璃材质
- **通用柔和度**：统一使用 `rounded-2xl` 和 `rounded-full` 两种圆角半径，创造和谐的视觉体验
- **光影交互**：悬停和聚焦状态下的内发光效果，模拟光线被"捕获"的物理现象
- **流畅动画**：基于物理的 `cubic-bezier` 曲线，实现自然的加速和减速过渡
- **深度层级**：清晰的 z-axis 层次结构，增强空间感和交互反馈

## ✨ 核心功能

### 🎥 智能视频播放

- **HLS 流媒体支持**：原生支持 HLS (.m3u8) 格式，提供流畅的视频播放体验
- **智能缓存机制**：Service Worker 驱动的智能缓存系统，自动预加载和缓存视频片段
- **后台下载**：利用观看历史，在后台自动下载历史视频，确保离线也能观看
- **播放控制**：完整的播放控制功能，包括进度条、音量控制、播放速度调节、全屏模式等
- **移动端优化**：专门为移动设备优化的播放器界面和手势控制

### 🔍 多源并行搜索

- **聚合搜索引擎**：同时在多个视频源中并行搜索，大幅提升搜索速度
- **自定义视频源**：支持添加、编辑和管理自定义视频源
- **智能解析**：统一的解析器系统，自动处理不同源的数据格式
- **搜索历史**：自动保存搜索历史，支持快速重新搜索
- **结果排序**：支持按评分、时间、相关性等多种方式排序搜索结果

### 🎬 豆瓣集成

- **详细影视信息**：自动获取豆瓣评分、演员阵容、剧情简介等详细信息
- **推荐系统**：基于豆瓣数据的相关推荐
- **专业评价**：展示豆瓣用户评价和专业影评

### 💾 观看历史管理

- **自动记录**：自动记录观看进度和历史
- **断点续播**：从上次观看位置继续播放
- **历史管理**：支持删除单条历史或清空全部历史
- **隐私保护**：所有数据存储在本地，不上传到服务器

### 📱 响应式设计

- **全端适配**：完美支持桌面、平板和移动设备
- **移动优先**：专门的移动端组件和交互设计
- **触摸优化**：针对触摸屏优化的手势和交互

### 🌙 主题系统

- **深色/浅色模式**：支持系统级主题切换
- **动态主题**：基于 CSS Variables 的动态主题系统
- **无缝过渡**：主题切换时的平滑过渡动画

### ⌨️ 无障碍设计

- **键盘导航**：完整的键盘快捷键支持
- **ARIA 标签**：符合 WCAG 2.2 标准的无障碍实现
- **语义化 HTML**：使用语义化标签提升可访问性
- **高对比度**：确保 4.5:1 的文字对比度

## 🔒 隐藏模式

本项目包含一个隐藏的"成人模式"，仅通过特定操作激活：

1. 在首页点击"管理标签"
2. 在输入框中输入 **"色情"** 并添加
3. 点击新添加的 **"色情"** 标签
4. 系统将自动跳转至隐藏模式页面

> **注意**：隐藏模式下的内容源与主页完全隔离，互不干扰。

## 🛠 技术栈

### 前端核心

| 技术 | 版本 | 用途 |
|------|------|------|
| **[Next.js](https://nextjs.org/)** | 16.0.3 | React 框架，使用 App Router |
| **[React](https://react.dev/)** | 19.2.0 | UI 组件库 |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.x | 类型安全的 JavaScript |
| **[Tailwind CSS](https://tailwindcss.com/)** | 4.x | 实用优先的 CSS 框架 |
| **[Zustand](https://github.com/pmndrs/zustand)** | 5.0.2 | 轻量级状态管理 |

### 开发工具

- **ESLint 9**：代码质量检查
- **PostCSS 8**：CSS 处理器
- **Vercel Analytics**：性能监控和分析

### 架构特点

- **App Router**：Next.js 13+ 的新路由系统，支持服务端组件和流式渲染
- **API Routes**：内置 API 端点，处理豆瓣数据和视频源代理
- **Service Worker**：离线缓存和智能预加载
- **Server Components**：优化首屏加载性能
- **Client Components**：复杂交互和状态管理

## 🚀 快速部署

### 在线体验

访问 **[https://kvideo.vercel.app/](https://kvideo.vercel.app/)** 立即体验，无需安装！

### 部署到自己的服务器





#### 选项 1：Vercel 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ricylee/KVideo)

1. 点击上方按钮
2. 连接你的 GitHub 账号
3. Vercel 会自动检测 Next.js 项目并部署
4. 几分钟后即可访问你自己的 KVideo 实例

#### 选项 2：Docker 部署

**从 Docker Hub 拉取（最简单）：**

```bash
# 拉取最新版本
docker pull kuekhaoyang/kvideo:latest
docker run -d -p 3000:3000 --name kvideo kuekhaoyang/kvideo:latest
```

应用将在 `http://localhost:3000` 启动。

> **✨ 多架构支持**：镜像支持 2 种主流平台架构：
> - `linux/amd64` - Intel/AMD 64位（大多数服务器、PC、Intel Mac）
> - `linux/arm64` - ARM 64位（Apple Silicon Mac、AWS Graviton、树莓派 4/5）

**自己构建镜像：**

```bash
git clone https://github.com/KuekHaoYang/KVideo.git
cd KVideo
docker build -t kvideo .
docker run -d -p 3000:3000 --name kvideo kvideo
```

**使用 Docker Compose：**

```bash
docker-compose up -d
```

#### 选项 3：传统 Node.js 部署

```bash
# 1. 克隆仓库
git clone https://github.com/KuekHaoYang/KVideo.git
cd KVideo

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 启动生产服务器
npm start
```

应用将在 `http://localhost:3000` 启动。

## 🔄 如何更新

### Vercel 部署

Vercel 会自动检测 GitHub 仓库的更新并重新部署，无需手动操作。

### Docker 部署

当有新版本发布时：

```bash
# 停止并删除旧容器
docker stop kvideo
docker rm kvideo

# 拉取最新镜像
docker pull kuekhaoyang/kvideo:latest

# 运行新容器
docker run -d -p 3000:3000 --name kvideo kuekhaoyang/kvideo:latest
```

### Node.js 部署

```bash
cd KVideo
git pull origin main
npm install
npm run build
npm start
```

> **🔄 自动化部署**：本项目使用 GitHub Actions 自动构建和发布 Docker 镜像。每次代码推送到 main 分支时，会自动构建多架构镜像并推送到 Docker Hub。

## 🤝 贡献代码

我们非常欢迎各种形式的贡献！无论是报告 Bug、提出新功能建议、改进文档，还是提交代码，你的每一份贡献都让这个项目变得更好。

**想要参与开发？请查看 [贡献指南](CONTRIBUTING.md) 了解详细的开发规范和流程。**

快速开始：
1. **报告 Bug**：[提交 Issue](https://github.com/KuekHaoYang/KVideo/issues)
2. **功能建议**：在 Issues 中提出你的想法
3. **代码贡献**：Fork → Branch → PR
4. **文档改进**：直接提交 PR

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [React](https://react.dev/) - UI 库

## 📞 联系方式

- **作者**：[KuekHaoYang](https://github.com/KuekHaoYang)
- **项目主页**：[https://github.com/KuekHaoYang/KVideo](https://github.com/KuekHaoYang/KVideo)
- **问题反馈**：[GitHub Issues](https://github.com/KuekHaoYang/KVideo/issues)





---

<div align="center">
  Made with ❤️ by <a href="https://github.com/KuekHaoYang">KuekHaoYang</a>
  <br>
  如果这个项目对你有帮助，请考虑给一个 ⭐️
</div>
