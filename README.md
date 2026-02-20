# tieba-toolbox (eztb)

<p align="center">
  <img src="https://h-r2.kairi.cc/github/eztb.png" alt="eztb icon" width="128" />
</p>

<p align="center">
  开源的百度贴吧工具箱，聚焦查询、分析、导出三类核心能力。
</p>

## 功能展示

![feature showcase](https://h-r2.kairi.cc/github/eztb-feat.png)

## UI 截图

![ui screenshot](https://h-r2.kairi.cc/github/ui-screenshot.png)

## 项目结构

本仓库是一个 monorepo，`apps/api` 和 `packages/sdk` 为 Git Submodule：

```text
tieba-toolbox
├─ apps/
│  ├─ web/        # 前端应用（React + Vite + TanStack）
│  └─ api/        # API 服务（Hono + Effect）[submodule]
├─ packages/
│  └─ sdk/        # tieba.js SDK [submodule]
└─ .github/workflows/
   └─ web-cf-pages.yml  # 网页端部署流水线
```

## 技术栈

- **前端**：React 19、Vite、TanStack Router、TanStack Query
- **UI 组件**：Primer React（GitHub 出品）
- **图标**：Primer Octicons
- **图表**：VChart
- **服务端**：Hono、Effect
- **工程化**：Bun、Turborepo、Biome、TypeScript

## 快速开始

### 1) 克隆仓库（含子模块）

```bash
git clone --recursive https://github.com/Dilettante258/tieba-toolbox.git
cd tieba-toolbox
```

如果你已经克隆过：

```bash
git submodule sync --recursive
git submodule update --init --recursive
```

### 2) 安装依赖

```bash
bun install
```

### 3) 开发模式

启动全部工作区：

```bash
bun run dev
```

分别启动：

```bash
# Web
bun run --cwd apps/web dev

# API
bun run --cwd apps/api dev
```

> `apps/api` 需要 `BDUSS` 等环境变量，详见 `apps/api/README.md`。

## 构建与检查

```bash
bun run build
bun run typecheck
bun run lint
```

## 部署

- 网页端通过 GitHub Actions 工作流 `.github/workflows/web-cf-pages.yml` 自动部署到 Cloudflare Pages。
- 默认在 `v3` 分支推送时触发。

## 相关链接

- 主仓库（Web）：https://github.com/Dilettante258/tieba-toolbox
- API 仓库：https://github.com/Dilettante258/Tieba-API-SCF
- SDK 仓库：https://github.com/Dilettante258/tieba.js
- SDK 文档：http://sdk.eztb.org/
