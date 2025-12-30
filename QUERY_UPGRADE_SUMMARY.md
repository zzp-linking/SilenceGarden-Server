# MongoDB 查询语句升级总结

## ✅ 已完成的文件更新

所有 `src/routes/` 目录下的文件已全部更新为 MongoDB 6.x 兼容的 async/await 风格。

### 更新的文件列表
1. ✅ `src/routes/poetry.js` - 诗词路由
2. ✅ `src/routes/violin.js` - 音乐路由
3. ✅ `src/routes/article.js` - 文章路由
4. ✅ `src/routes/login.js` - 登录路由

---

## 🔄 主要变更

### 1. 回调函数 → async/await

#### ❌ 旧代码（回调地狱）
```javascript
app.get('/api/data', function (req, res) {
    pool.acquire().then(function(db) {
        var dbo = db.db("silencegarden");
        dbo.collection("poetry").find().toArray(function(err, result) {
            if (err) {
                res.send(resultWrap({}, '失败', false));
            } else {
                res.send(resultWrap(result));
            }
            pool.release(db);
        });
    }).catch(function(err) {
        res.send(resultWrap({}, '异常', false));
    });
});
```

#### ✅ 新代码（async/await）
```javascript
app.get('/api/data', async function (req, res) {
    let client;
    try {
        client = await pool.acquire();
        const dbo = client.db("silencegarden");
        const result = await dbo.collection("poetry").find().toArray();
        res.send(resultWrap(result));
    } catch (err) {
        console.error('查询失败:', err);
        res.send(resultWrap({}, '系统异常', false));
    } finally {
        if (client) pool.release(client);
    }
});
```

---

### 2. 过时的 MongoDB API 更新

#### `update()` → `updateOne()` / `updateMany()`

```javascript
// ❌ 旧代码（已弃用）
collection.update({ _id: id }, { $set: { title } }, callback);

// ✅ 新代码
await collection.updateOne({ _id: id }, { $set: { title } });
```

#### `insert()` → `insertOne()` / `insertMany()`

```javascript
// ❌ 旧代码（已弃用）
collection.insert({ title, content }, callback);

// ✅ 新代码
const result = await collection.insertOne({ title, content });
console.log('插入的ID:', result.insertedId);
```

#### `ObjectId()` 构造函数

```javascript
// ❌ 旧代码
const id = ObjectId(idString);

// ✅ 新代码
const id = new ObjectId(idString);
```

---

### 3. 连接池使用方式

#### 变量命名更新

```javascript
// ❌ 旧代码
pool.acquire().then(function(db) {
    var dbo = db.db("silencegarden");
    // ...
    pool.release(db);
});

// ✅ 新代码
const client = await pool.acquire();
const dbo = client.db("silencegarden");
// ...
pool.release(client);
```

**注意：** 虽然变量名从 `db` 改为 `client`，但 `client.db()` 的使用方式相同。

---

### 4. 错误处理改进

#### 统一的 try-catch-finally 模式

```javascript
let client;
try {
    client = await pool.acquire();
    // 数据库操作
} catch (err) {
    console.error('操作失败:', err);
    res.send(resultWrap({}, '系统异常', false));
} finally {
    if (client) pool.release(client);  // 确保连接释放
}
```

---

### 5. MongoDB 6.x 查询结果变化

#### `updateOne()` 返回值

```javascript
// MongoDB 3.x
result.result.n  // 匹配的文档数

// MongoDB 6.x
result.matchedCount   // 匹配的文档数
result.modifiedCount  // 修改的文档数
```

#### `insertOne()` 返回值

```javascript
// MongoDB 3.x
result.result.n      // 插入的文档数
result.ops[0]        // 插入的文档

// MongoDB 6.x
result.insertedId    // 插入的文档ID
result.acknowledged  // 是否确认
```

---

### 6. Formidable 3.x API 变化

#### 文件上传处理

```javascript
// ❌ 旧代码（Formidable 1.x）
const form = new formidable.IncomingForm();
form.parse(req, function(err, fields, files) {
    const image = files.image.name;
    // ...
});

// ✅ 新代码（Formidable 3.x）
const form = formidable({
    uploadDir: UPLOAD_FOLDER,
    keepExtensions: true
});

const [fields, files] = await form.parse(req);
const imageFile = files.image[0];  // 注意：files.image 现在是数组
const imageName = imageFile.newFilename;
```

---

## 📋 详细变更清单

### poetry.js
- ✅ 3个路由全部更新为 async/await
- ✅ 移除回调函数嵌套
- ✅ 统一错误处理
- ✅ 添加详细日志

### violin.js
- ✅ 3个路由全部更新
- ✅ 简化 Promise 包装
- ✅ 优化随机播放逻辑
- ✅ 移除注释的旧代码

### article.js
- ✅ 4个路由 + 1个文件上传全部更新
- ✅ `update()` → `updateOne()`
- ✅ `insert()` → `insertOne()`
- ✅ `ObjectId()` → `new ObjectId()`
- ✅ Formidable 1.x → 3.x API
- ✅ aggregate 查询更新为 async/await
- ✅ 移除 assert 依赖

### login.js
- ✅ 登录路由更新为 async/await
- ✅ `result.result.n` → `result.matchedCount`
- ✅ 统一错误处理

---

## 🎯 性能优化

### 1. 连接池管理
```javascript
// 确保连接始终被释放
finally {
    if (client) pool.release(client);
}
```

### 2. 错误日志
```javascript
catch (err) {
    console.error('具体操作失败:', err);  // 添加详细日志
    res.send(resultWrap({}, '系统异常', false));
}
```

### 3. 提前返回
```javascript
if (!id) {
    res.send({});
    return;  // 提前返回，避免不必要的数据库查询
}
```

---

## 🔍 测试建议

### 1. 基本查询测试
```bash
# 获取诗词目录
curl http://localhost:4000/api/poetry_catalog

# 获取特定诗词
curl http://localhost:4000/api/poem/静夜思

# 模糊搜索
curl http://localhost:4000/api/poetry_catalog/vague/月
```

### 2. 文章操作测试
```bash
# 获取文章目录
curl http://localhost:4000/api/article/catalog

# 获取文章详情
curl http://localhost:4000/api/article/details/123456789012345678901234
```

### 3. 登录测试
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"account":"test","password":"123456"}'
```

---

## ⚠️ 注意事项

### 1. ObjectId 格式
```javascript
// 确保 ID 是有效的 24 位十六进制字符串
try {
    const id = new ObjectId(req.params.id);
} catch (err) {
    res.send(resultWrap({}, 'ID 格式错误', false));
    return;
}
```

### 2. 文件上传
```javascript
// Formidable 3.x 中 files.image 是数组
const imageFile = files.image ? files.image[0] : null;
if (!imageFile) {
    res.send(resultWrap({}, '没有上传文件', false));
    return;
}
```

### 3. 连接释放
```javascript
// 必须在 finally 中释放连接
finally {
    if (client) pool.release(client);
}
```

---

## 📚 参考文档

- [MongoDB Node.js Driver 6.x 文档](https://www.mongodb.com/docs/drivers/node/current/)
- [Formidable 3.x 文档](https://github.com/node-formidable/formidable)
- [async/await 最佳实践](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)

---

## 🎉 升级完成

所有查询语句已升级为 MongoDB 6.x 兼容的现代化代码：
- ✅ 使用 async/await 替代回调函数
- ✅ 更新过时的 MongoDB API
- ✅ 统一错误处理模式
- ✅ 确保连接池正确释放
- ✅ 添加详细的错误日志
- ✅ 更新 Formidable API

现在你的代码更加：
- 🚀 现代化
- 📖 易读
- 🐛 易调试
- 🔒 安全
- ⚡ 高效

