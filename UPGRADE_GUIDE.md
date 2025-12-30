# 项目升级指南

## 升级概述

本次升级将项目从旧的 Node.js + Babel + Webpack 4 架构升级到现代化的 Node.js 22+ + ESM + esbuild 架构。

## 主要变更

### 1. 移除 Babel
- ✅ **原因**：Node.js 22+ 原生支持所有 ES6+ 语法
- ✅ **变更**：移除所有 babel 相关依赖和配置文件
- ✅ **影响**：代码直接运行，无需转译，开发体验更好

### 2. 使用 ESM 模块系统
- ✅ **原因**：Node.js 22+ 完全支持 ESM，这是现代 JavaScript 标准
- ✅ **变更**：在 `package.json` 中添加 `"type": "module"`
- ✅ **影响**：使用 `import/export` 而不是 `require/module.exports`

### 3. Webpack 4 → esbuild
- ✅ **原因**：esbuild 打包速度快 100 倍，更适合 Node.js 后端项目
- ✅ **变更**：使用 `esbuild.config.js` 替换 `webpack.config.js`
- ✅ **优势**：
  - 打包速度极快（毫秒级）
  - 配置简单
  - 原生支持 ESM
  - 内置压缩和 tree-shaking

### 4. 依赖升级

#### 生产依赖
| 包名 | 旧版本 | 新版本 | 说明 |
|------|--------|--------|------|
| express | 4.15.4 | 4.21.2 | 安全更新和性能优化 |
| mongodb | 3.0.5 | 6.12.0 | 重大升级，API 有变化 |
| body-parser | 1.17.2 | 1.20.3 | 安全更新 |
| cookie-parser | 1.4.3 | 1.4.7 | 安全更新 |
| formidable | 1.2.1 | 3.5.2 | 重大升级，API 有变化 |
| generic-pool | 3.4.2 | 3.9.0 | 性能优化 |

#### 开发依赖
| 包名 | 旧版本 | 新版本 | 说明 |
|------|--------|--------|------|
| nodemon | 1.17.3 | 3.1.9 | 更好的热重载 |
| mockjs | 1.0.1-beta3 | 1.1.0 | 稳定版本 |
| esbuild | - | 0.24.2 | 新增：替代 webpack |

## 安装步骤

### 1. 清理旧依赖
```bash
rm -rf node_modules package-lock.json
```

### 2. 安装新依赖
```bash
npm install
```

### 3. 更新代码（如需要）

#### MongoDB 6.x API 变化
如果你的代码中使用了 MongoDB，需要注意以下变化：

**旧代码：**
```javascript
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(url, (err, client) => {
  const db = client.db('dbname');
});
```

**新代码：**
```javascript
import { MongoClient } from 'mongodb';
const client = new MongoClient(url);
await client.connect();
const db = client.db('dbname');
```

#### Formidable 3.x API 变化
**旧代码：**
```javascript
const formidable = require('formidable');
const form = new formidable.IncomingForm();
form.parse(req, (err, fields, files) => {});
```

**新代码：**
```javascript
import formidable from 'formidable';
const form = formidable({});
const [fields, files] = await form.parse(req);
```

## 新的 NPM 脚本

```json
{
  "dev": "nodemon src/index.js",           // 开发模式，自动重启
  "start": "node dist/app.js",             // 生产模式，运行打包后的代码
  "build": "node esbuild.config.js"        // 打包构建
}
```

## 使用方法

### 开发环境
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 运行生产版本
```bash
npm start
```

## 性能对比

| 指标 | 旧版本 (Webpack 4) | 新版本 (esbuild) |
|------|-------------------|------------------|
| 首次构建 | ~5-10 秒 | ~100-300 毫秒 |
| 增量构建 | ~2-5 秒 | ~50-100 毫秒 |
| 包大小 | 较大 | 更小（tree-shaking） |

## 注意事项

1. **ESM 模块系统**：所有 `require` 需要改为 `import`，`module.exports` 改为 `export`
2. **MongoDB 驱动**：从 3.x 升级到 6.x，API 有较大变化，需要测试
3. **Formidable**：从 1.x 升级到 3.x，API 改为 Promise 风格
4. **__dirname 和 __filename**：ESM 中需要使用：
   ```javascript
   import { fileURLToPath } from 'url';
   import { dirname } from 'path';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   ```

## 回滚方案

如果升级后遇到问题，可以通过 git 回滚：
```bash
git checkout HEAD -- package.json
git checkout HEAD -- webpack.config.js
git checkout HEAD -- .babelrc
npm install
```

## 后续优化建议

1. 考虑使用 TypeScript 增强类型安全
2. 添加 ESLint 和 Prettier 统一代码风格
3. 添加单元测试和集成测试
4. 使用 PM2 进行生产环境进程管理
5. 考虑使用 Docker 容器化部署

