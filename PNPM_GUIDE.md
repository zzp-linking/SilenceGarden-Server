# pnpm 使用指南

## 为什么使用 pnpm？

pnpm 相比 npm 和 yarn 的优势：

- ⚡ **速度快**：比 npm 快 2-3 倍
- 💾 **节省磁盘空间**：使用硬链接，相同的包只存储一次
- 🔒 **更严格**：避免幽灵依赖问题
- 🎯 **完全兼容**：支持所有 npm 命令

---

## 安装 pnpm

### 全局安装 pnpm

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 PowerShell（Windows）
iwr https://get.pnpm.io/install.ps1 -useb | iex

# 验证安装
pnpm --version
```

---

## 常用命令对照表

| 操作 | npm | pnpm |
|------|-----|------|
| 安装所有依赖 | `npm install` | `pnpm install` 或 `pnpm i` |
| 安装生产依赖 | `npm install --production` | `pnpm install --prod` |
| 添加依赖 | `npm install express` | `pnpm add express` |
| 添加开发依赖 | `npm install -D esbuild` | `pnpm add -D esbuild` |
| 删除依赖 | `npm uninstall express` | `pnpm remove express` |
| 更新依赖 | `npm update` | `pnpm update` |
| 运行脚本 | `npm run dev` | `pnpm dev` 或 `pnpm run dev` |
| 清理缓存 | `npm cache clean` | `pnpm store prune` |

---

## 项目使用方法

### 1. 首次安装依赖

```bash
pnpm install
```

或简写：
```bash
pnpm i
```

### 2. 运行开发服务器

```bash
# pnpm 可以省略 run
pnpm dev

# 或
pnpm run dev
```

### 3. 构建项目

```bash
pnpm build
```

### 4. 运行生产版本

```bash
pnpm start
```

---

## 添加/删除依赖

### 添加生产依赖

```bash
pnpm add express
pnpm add mongodb
```

### 添加开发依赖

```bash
pnpm add -D esbuild
pnpm add -D mockjs
```

### 删除依赖

```bash
pnpm remove express
```

### 更新依赖

```bash
# 更新所有依赖到最新版本
pnpm update

# 更新特定依赖
pnpm update express

# 交互式更新（推荐）
pnpm update -i
```

---

## 项目配置说明

### .npmrc 配置文件

项目中的 `.npmrc` 文件配置了 pnpm 的行为：

```ini
# 提升依赖到 node_modules 根目录（兼容性更好）
shamefully-hoist=true

# 不严格检查 peer dependencies（避免警告）
strict-peer-dependencies=false
```

**为什么需要这些配置？**

- `shamefully-hoist=true`：让 pnpm 的行为更接近 npm，避免某些工具找不到依赖
- `strict-peer-dependencies=false`：避免因为 peer dependencies 版本不匹配导致安装失败

---

## 服务器部署

### 方式 1：使用 pnpm（推荐）

```bash
# 服务器上也安装 pnpm
npm install -g pnpm

# 安装生产依赖
pnpm install --prod

# 启动服务
pm2 start dist/app.js --name silencegarden-server
```

### 方式 2：使用 npm（兼容方式）

如果服务器上没有 pnpm，可以在本地生成 `package-lock.json`：

```bash
# 本地生成 npm lock 文件
npm install

# 上传到服务器后使用 npm
npm install --production
```

---

## pnpm 独有功能

### 1. 查看依赖树

```bash
pnpm list
pnpm list --depth=1
```

### 2. 检查过时的依赖

```bash
pnpm outdated
```

### 3. 清理存储空间

```bash
# 清理未使用的包
pnpm store prune
```

### 4. 查看存储位置

```bash
pnpm store path
```

---

## 磁盘空间对比

假设你有 10 个项目都使用 express：

| 包管理器 | 磁盘占用 |
|---------|---------|
| npm | express × 10 = ~5MB × 10 = 50MB |
| yarn | express × 10 = ~5MB × 10 = 50MB |
| pnpm | express × 1 = ~5MB（硬链接） |

**pnpm 节省 90% 的磁盘空间！**

---

## 速度对比

安装 express + mongodb + 其他依赖：

| 包管理器 | 首次安装 | 有缓存 |
|---------|---------|--------|
| npm | ~15s | ~8s |
| yarn | ~12s | ~6s |
| pnpm | ~8s | ~3s |

**pnpm 快 2-3 倍！**

---

## 常见问题

### 1. pnpm 和 npm 可以混用吗？

**不建议混用**。选择一个包管理器后，整个项目都使用它：

- 如果使用 pnpm，删除 `package-lock.json`
- 如果使用 npm，删除 `pnpm-lock.yaml`

### 2. 如何迁移现有项目？

```bash
# 1. 删除旧的依赖
rm -rf node_modules package-lock.json

# 2. 使用 pnpm 安装
pnpm install
```

### 3. CI/CD 中使用 pnpm

```yaml
# GitHub Actions 示例
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

---

## 推荐的工作流程

### 日常开发

```bash
# 1. 安装依赖
pnpm install

# 2. 开发
pnpm dev

# 3. 添加新依赖
pnpm add express

# 4. 构建
pnpm build
```

### 部署到服务器

```bash
# 1. 本地构建
pnpm build

# 2. 上传文件
scp dist/app.js server:/path/
scp package.json server:/path/
scp pnpm-lock.yaml server:/path/

# 3. 服务器上安装依赖
pnpm install --prod

# 4. 启动服务
pm2 start dist/app.js
```

---

## 总结

✅ **使用 pnpm 的理由：**
- 速度快 2-3 倍
- 节省 90% 磁盘空间
- 避免幽灵依赖
- 完全兼容 npm

✅ **本项目已配置：**
- `.npmrc` - pnpm 配置
- `.gitignore` - 忽略 lock 文件
- 所有依赖都可以用 pnpm 安装

🚀 **开始使用：**
```bash
pnpm install
pnpm dev
```

