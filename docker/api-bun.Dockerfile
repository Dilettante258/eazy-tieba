# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.9-alpine AS deps
WORKDIR /app

# 仅先复制清单文件，提升依赖安装层缓存命中率
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/db/package.json packages/db/package.json

RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY apps/api apps/api
COPY packages/sdk packages/sdk
COPY packages/db packages/db

# SDK 依赖 dist 产物，先构建 SDK，再构建 API
RUN bun run --cwd packages/sdk build
RUN bun run --cwd apps/api build

FROM oven/bun:1.3.9-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/api/out /app/out

EXPOSE 8000

CMD ["bun", "/app/out/index.js"]
