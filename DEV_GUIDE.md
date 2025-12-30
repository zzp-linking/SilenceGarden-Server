# 开发指南

## 🚀 启动项目

### 开发模式（推荐）
```bash
pnpm dev
```
使用 nodemon，文件变化自动重启，Ctrl+C 正确关闭。

### 备用开发模式
```bash
pnpm run dev:watch
```
使用 Node.js 原生 `--watch`，但 Windows 上可能有 Ctrl+C 关闭不完全的问题。

---

## ❌ 端口被占用问题

### 现象
```
Error: listen EADDRINUSE: address already in use :::4000
```

### 原因
- Node.js `--watch` 模式在 Windows 上使用 Ctrl+C 有时不能完全终止进程
- 后台进程仍在占用 4000 端口

### 解决方案

#### 方法 1：使用快捷命令（推荐）
```bash
pnpm run kill
```
自动关闭占用 4000 端口的进程。

#### 方法 2：手动查找并关闭
```bash
# 1. 查找占用端口的进程
netstat -ano | findstr :4000

# 输出示例：
# TCP    0.0.0.0:4000    0.0.0.0:0    LISTENING    12345
#                                                    ↑ PID

# 2. 关闭进程
taskkill /F /PID 12345
```

#### 方法 3：使用 nodemon（推荐）
```bash
# 改用 nodemon，Ctrl+C 能正确关闭
pnpm dev
```

---

## 📝 NPM 脚本说明

| 命令 | 说明 | 使用场景 |
|------|------|---------|
| `pnpm dev` | 开发模式（nodemon） | ✅ 日常开发（推荐） |
| `pnpm run dev:watch` | 开发模式（Node.js --watch） | 备用方案 |
| `pnpm build` | 构建生产版本 | 部署前构建 |
| `pnpm start` | 运行生产版本 | 运行打包后的代码 |
| `pnpm run kill` | 关闭 4000 端口 | 端口被占用时 |

---

## 🔧 nodemon vs Node.js --watch

### nodemon（当前使用）

**优点：**
- ✅ Windows 兼容性好
- ✅ Ctrl+C 能正确关闭进程
- ✅ 配置灵活（nodemon.json）
- ✅ 稳定可靠

**缺点：**
- 需要额外安装依赖

### Node.js --watch

**优点：**
- ✅ Node.js 原生支持
- ✅ 无需额外依赖
- ✅ 启动速度快

**缺点：**
- ❌ Windows 上 Ctrl+C 可能关闭不完全
- ❌ 配置选项较少

---

## 🛠️ 常见问题

### 1. 端口被占用
```bash
pnpm run kill
```

### 2. nodemon 未安装
```bash
pnpm install
```

### 3. 修改端口
编辑 `src/index.js`：
```javascript
var server = app.listen(4001, function () {  // 改成其他端口
```

### 4. 查看所有 Node 进程
```bash
tasklist | findstr node
```

### 5. 关闭所有 Node 进程（谨慎使用）
```bash
taskkill /F /IM node.exe
```

---

## 📋 开发流程

### 日常开发
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 修改代码，自动重启

# 3. 按 Ctrl+C 停止

# 4. 如果端口被占用
pnpm run kill

# 5. 重新启动
pnpm dev
```

### 部署前
```bash
# 1. 构建
pnpm build

# 2. 测试生产版本
pnpm start

# 3. 上传到服务器
# - dist/app.js
# - package.json
# - pnpm-lock.yaml
```

---

## ⚙️ nodemon 配置说明

配置文件：`nodemon.json`

```json
{
  "watch": ["src"],              // 监听 src 目录
  "ext": "js,json",              // 监听 .js 和 .json 文件
  "ignore": ["node_modules", "dist"],  // 忽略这些目录
  "exec": "node src/index.js",   // 执行命令
  "signal": "SIGTERM",           // 使用 SIGTERM 信号关闭
  "env": {
    "NODE_ENV": "development"    // 环境变量
  }
}
```

### 自定义配置

#### 监听更多文件类型
```json
{
  "ext": "js,json,html,css"
}
```

#### 延迟重启
```json
{
  "delay": 1000  // 1秒后重启
}
```

#### 详细日志
```json
{
  "verbose": true
}
```

---

## 🎯 推荐工作流程

### 方式 1：使用 nodemon（推荐）
```bash
# 启动
pnpm dev

# 修改代码，自动重启

# Ctrl+C 停止（正常关闭）
```

### 方式 2：使用 Node.js --watch
```bash
# 启动
pnpm run dev:watch

# 修改代码，自动重启

# Ctrl+C 停止
# 如果端口被占用：
pnpm run kill
```

---

## 💡 最佳实践

1. **日常开发使用 nodemon**
   ```bash
   pnpm dev
   ```

2. **遇到端口占用立即处理**
   ```bash
   pnpm run kill
   ```

3. **定期清理进程**
   ```bash
   # 查看 Node 进程
   tasklist | findstr node
   
   # 如果有多余的进程，关闭它们
   taskkill /F /PID <进程ID>
   ```

4. **使用 Git 管理代码**
   - 提交前先测试
   - 不要提交 node_modules
   - 提交 pnpm-lock.yaml

5. **部署前测试生产版本**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 🔍 调试技巧

### 查看详细日志
```bash
# nodemon 详细模式
nodemon --verbose src/index.js

# Node.js 调试模式
node --inspect src/index.js
```

### 使用 Chrome DevTools 调试
```bash
node --inspect-brk src/index.js
# 打开 chrome://inspect
```

### 查看环境变量
```bash
# Windows
set

# 查看 NODE_ENV
echo %NODE_ENV%
```

---

## 📚 参考资料

- [nodemon 文档](https://nodemon.io/)
- [Node.js --watch 文档](https://nodejs.org/docs/latest/api/cli.html#--watch)
- [kill-port 工具](https://www.npmjs.com/package/kill-port)

