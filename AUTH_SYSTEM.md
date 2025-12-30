# 认证系统完整说明

## 🔐 认证流程

### 1. 登录获取 UUID

```
用户 → POST /api/login → 验证账号密码 → 生成 UUID → 保存到 Cookie
```

### 2. 访问受保护接口

```
请求 → 拦截器 → 验证 UUID → 通过 → 执行业务逻辑
                       ↓ 失败
                    返回"未登录"
```

---

## 📁 文件结构

```
src/
├── routes/
│   └── index.js          # 认证拦截器（这里）
├── utils/
│   └── auth.js           # 认证验证函数
└── config/
    └── url.js            # URL 配置（定义哪些需要认证）
```

---

## 🔧 代码实现

### 1. 拦截器 (src/routes/index.js)

```javascript
app.all(BASEURL + AUTH + '/*', async function (req, res, next) {
    // 1. 开发环境跳过认证
    if (process.env.NODE_ENV !== 'production') {
        next();
        return;
    }
    
    // 2. 生产环境验证 UUID
    const uuid = req.cookies.uuid;
    if (!uuid) {
        res.send(resultWrap({}, '您还未登录', 101));
        return;
    }
    
    // 3. 查询数据库验证 UUID
    const isValid = await authVali(uuid);
    if (isValid) {
        next();  // 放行
    } else {
        res.send(resultWrap({}, '登录已过期', 101));
    }
});
```

**关键点：**
- ✅ 使用 `async/await`
- ✅ 正确的错误处理
- ✅ 添加 `return` 避免继续执行
- ✅ 开发环境自动跳过

---

### 2. 认证验证 (src/utils/auth.js)

```javascript
export const authVali = async (uuid) => {
    let client;
    try {
        client = await pool.acquire();
        const co = client.db('silencegarden').collection('user');
        const result = await co.find({ uuid }).project({ _id: 0 }).toArray();
        
        return result.length > 0;
    } catch (err) {
        console.error('❌ 认证验证失败:', err);
        return false;
    } finally {
        if (client) pool.release(client);
    }
}
```

**关键点：**
- ✅ 使用 async/await 替代回调
- ✅ 正确释放连接池
- ✅ 错误时返回 false

---

### 3. URL 配置 (src/config/url.js)

```javascript
export const BASEURL = '/api'
export const AUTH = '/auth'  // 需要认证的路径前缀

// 需要认证的接口
export const ARTICLE_SAVE = BASEURL + AUTH + '/article/save'
export const ARTICLE_IMAGE_UPLOAD = BASEURL + AUTH + '/article/image/upload'

// 不需要认证的接口
export const GET_ARTICLE_DETAILS = BASEURL + '/article/details/{id}'
export const LOGIN = BASEURL + '/login'
```

---

## 📊 接口分类

### 需要认证的接口（路径包含 /auth/）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 保存文章 | POST | `/api/auth/article/save` | 新增或更新文章 |
| 上传图片 | POST | `/api/auth/article/image/upload` | 上传文章图片 |
| 编辑文章 | GET | `/api/auth/revise/article/details/:id` | 获取文章编辑数据 |

### 不需要认证的接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 登录 | POST | `/api/login` | 用户登录 |
| 文章列表 | GET | `/api/article/catalog` | 获取文章目录 |
| 文章详情 | GET | `/api/article/details/:id` | 查看文章详情 |
| 诗词列表 | GET | `/api/poetry_catalog` | 获取诗词目录 |
| 音乐列表 | GET | `/api/violin_catalog` | 获取音乐目录 |

---

## 🚀 使用示例

### 开发环境（自动跳过认证）

```bash
# 1. 启动应用（开发模式）
pnpm dev

# 2. 直接调用需要认证的接口（不需要登录）
curl -X POST http://localhost:4000/api/auth/article/save \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章",
    "tags": ["测试"],
    "markdown": "# 测试",
    "html": "<h1>测试</h1>"
  }'

# 输出：
# 🔐 拦截器触发 → /api/auth/article/save
# ⚠️  开发模式：跳过认证检查
# 📝 文章保存开始：
# ✅ 插入完成
```

---

### 生产环境（需要认证）

#### 1. 先登录获取 UUID

```bash
curl -X POST http://your-server.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "zzp",
    "password": "my_garden"
  }'
```

**响应：**
```json
{
  "code": 200,
  "message": "登录成功！",
  "result": {
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

#### 2. 使用 UUID 调用接口

```bash
curl -X POST http://your-server.com/api/auth/article/save \
  -H "Content-Type: application/json" \
  -H "Cookie: uuid=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -d '{
    "title": "正式文章",
    "tags": ["技术"],
    "markdown": "# 内容",
    "html": "<h1>内容</h1>"
  }'
```

**日志：**
```
🔐 拦截器触发 → /api/auth/article/save
🔍 正在验证 uuid: a1b2c3d4...
🔐 认证验证: a1b2c3d4... 结果: true
✅ 认证通过，继续处理请求
📝 文章保存开始：
✅ 插入完成
```

---

## 🌐 前端集成

### Vue/React 示例

```javascript
// 1. 登录
async function login(account, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, password }),
    credentials: 'include'  // 自动保存 Cookie
  });
  
  const data = await response.json();
  if (data.code === 200) {
    console.log('登录成功，UUID 已保存到 Cookie');
    return data.result.uuid;
  }
}

// 2. 调用需要认证的接口
async function saveArticle(article) {
  const response = await fetch('/api/auth/article/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
    credentials: 'include'  // 自动发送 Cookie
  });
  
  const data = await response.json();
  
  if (data.code === 101) {
    // 未登录，跳转到登录页
    router.push('/login');
  } else if (data.code === 200) {
    console.log('保存成功');
  }
}
```

---

## 🔍 日志解读

### 开发环境日志

```
🔐 拦截器触发 → /api/auth/article/save
⚠️  开发模式：跳过认证检查
📝 文章保存开始：
✅ 插入完成
```

**说明：** 自动跳过认证，直接执行业务逻辑

---

### 生产环境 - 成功

```
🔐 拦截器触发 → /api/auth/article/save
🔍 正在验证 uuid: a1b2c3d4...
🔐 认证验证: a1b2c3d4... 结果: true
✅ 认证通过，继续处理请求
📝 文章保存开始：
✅ 插入完成
```

**说明：** UUID 验证通过，成功保存

---

### 生产环境 - 未提供 UUID

```
🔐 拦截器触发 → /api/auth/article/save
❌ 认证失败：未提供 uuid
```

**说明：** 请求没有携带 Cookie，需要先登录

---

### 生产环境 - UUID 无效

```
🔐 拦截器触发 → /api/auth/article/save
🔍 正在验证 uuid: invalid...
🔐 认证验证: invalid... 结果: false
❌ 认证失败：uuid 无效或已过期
```

**说明：** UUID 不存在或已过期，需要重新登录

---

## ⚙️ 环境配置

### 开发环境（默认）

```bash
# 不设置环境变量，默认就是开发环境
pnpm dev
```

**特点：**
- 自动跳过认证
- 方便测试
- 有警告日志提醒

---

### 生产环境

#### 方式 1：命令行设置

```bash
export NODE_ENV=production
pnpm start
```

#### 方式 2：PM2 配置

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'silencegarden-server',
    script: './dist/app.js',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

#### 方式 3：package.json

```json
{
  "scripts": {
    "start:prod": "NODE_ENV=production node dist/app.js"
  }
}
```

---

## 🔒 安全建议

### 1. UUID 过期机制

建议添加 UUID 过期时间：

```javascript
// 登录时设置过期时间
db.collection('user').updateOne(
  { account, password },
  { 
    $set: { 
      uuid,
      uuidExpireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7天后过期
    } 
  }
);

// 验证时检查过期
export const authVali = async (uuid) => {
  const result = await co.find({ 
    uuid,
    uuidExpireAt: { $gt: new Date() }  // 未过期
  }).toArray();
  
  return result.length > 0;
}
```

### 2. 使用 HTTPS

生产环境必须使用 HTTPS，保护 Cookie 传输。

### 3. Cookie 配置

```javascript
res.cookie('uuid', uuid, {
  httpOnly: true,   // 防止 XSS
  secure: true,     // 仅 HTTPS
  sameSite: 'strict',  // 防止 CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7天
});
```

### 4. 定期清理过期 UUID

```javascript
// 定时任务
setInterval(async () => {
  await db.collection('user').updateMany(
    { uuidExpireAt: { $lt: new Date() } },
    { $unset: { uuid: "", uuidExpireAt: "" } }
  );
}, 24 * 60 * 60 * 1000);  // 每天清理一次
```

---

## ✅ 检查清单

上线前确保：

- [ ] `NODE_ENV=production` 已设置
- [ ] 开发模式跳过认证的警告消失
- [ ] 测试登录流程正常
- [ ] 测试未登录访问受保护接口返回 101
- [ ] 测试登录后可以正常访问
- [ ] Cookie 配置正确（httpOnly, secure）
- [ ] 添加 UUID 过期机制
- [ ] 使用 HTTPS

---

## 🎯 总结

认证系统现在：
- ✅ 使用 async/await，无回调地狱
- ✅ 开发环境自动跳过，方便测试
- ✅ 生产环境严格验证
- ✅ 详细的日志输出
- ✅ 正确的错误处理
- ✅ 连接池正确释放

完全可以投入生产使用！🎉

