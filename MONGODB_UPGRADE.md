# MongoDB 3.x → 6.x 升级说明

## 主要变化

### 1. 连接字符串格式

#### ❌ 旧格式（错误）
```javascript
// 缺少数据库名前的斜杠
const url = `mongodb://${USER}:${PWD}@${IP}:${PORT}${DB}`;
// 结果：mongodb://zzp:pwd@47.117.90.95:27017silencegarden ← 错误！
```

#### ✅ 新格式（正确）
```javascript
// 数据库名前必须有斜杠
const url = `mongodb://${USER}:${PWD}@${IP}:${PORT}/${DB}`;
// 结果：mongodb://zzp:pwd@47.117.90.95:27017/silencegarden ← 正确！
```

---

### 2. 连接 API 变化

#### ❌ MongoDB 3.x 旧写法
```javascript
MongoClient.connect(url, function(err, db) {
    if (!err) {
        const dbo = db.db('dbname');
        // 使用 dbo
    }
});
```

#### ✅ MongoDB 6.x 新写法
```javascript
// 方式 1：async/await（推荐）
const client = new MongoClient(url);
await client.connect();
const db = client.db('dbname');

// 方式 2：Promise
const client = new MongoClient(url);
client.connect()
    .then(() => {
        const db = client.db('dbname');
    })
    .catch(err => console.error(err));
```

---

### 3. 连接池配置变化

#### ❌ 旧代码
```javascript
const pool = generic.createPool({
    'create': function (callback) {
        const db = new Promise(function(resolve, reject) {
            MongoClient.connect(url, function(err, db) {
                if (!err) {
                    resolve(db);  // 返回 db 对象
                } else {
                    reject();
                }
            });
        });
        return db;
    },
    'destroy': function (db) {
        db.close();
    }
});
```

#### ✅ 新代码
```javascript
const pool = generic.createPool({
    'create': async function () {
        const client = new MongoClient(url);
        await client.connect();
        return client;  // 返回 client 对象
    },
    'destroy': function (client) {
        return client.close();
    }
});
```

---

### 4. 使用数据库的方式

#### ❌ 旧方式
```javascript
pool.acquire().then(function(db) {
    var dbo = db.db("silencegarden");
    dbo.collection("poetry").find().toArray(function(err, result) {
        // ...
        pool.release(db);
    });
});
```

#### ✅ 新方式（保持不变）
```javascript
pool.acquire().then(function(client) {
    var dbo = client.db("silencegarden");
    dbo.collection("poetry").find().toArray(function(err, result) {
        // ...
        pool.release(client);
    });
});
```

**注意：** 虽然变量名从 `db` 改成了 `client`，但使用方式基本相同。

---

## 完整示例对比

### MongoDB 3.x 代码
```javascript
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb://user:pwd@ip:port`;  // 没有数据库名

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    const dbo = db.db("mydb");
    dbo.collection("users").find({}).toArray(function(err, result) {
        console.log(result);
        db.close();
    });
});
```

### MongoDB 6.x 代码
```javascript
import { MongoClient } from 'mongodb';
const url = `mongodb://user:pwd@ip:port/mydb`;  // 包含数据库名

const client = new MongoClient(url);
await client.connect();
const db = client.db("mydb");
const result = await db.collection("users").find({}).toArray();
console.log(result);
await client.close();
```

---

## 常见错误

### 错误 1：URL 格式错误
```
MongoRuntimeError: Unable to parse 47.117.90.95:27017silencegarden with URL
```
**原因：** 数据库名前缺少 `/`  
**解决：** 改为 `mongodb://user:pwd@ip:port/dbname`

### 错误 2：回调函数返回值错误
```
TypeError: Cannot read property 'db' of undefined
```
**原因：** MongoDB 6.x 回调函数返回的是 `client` 而不是 `db`  
**解决：** 使用 `client.db('dbname')` 获取数据库对象

### 错误 3：连接选项过时
```
Warning: useNewUrlParser is deprecated
```
**原因：** MongoDB 6.x 不再需要这些选项  
**解决：** 删除 `useNewUrlParser`、`useUnifiedTopology` 等选项

---

## 迁移检查清单

- [x] 连接字符串添加 `/数据库名`
- [x] 使用 `new MongoClient(url)` 而不是 `MongoClient.connect()`
- [x] 使用 `await client.connect()` 连接
- [x] 回调函数返回 `client` 而不是 `db`
- [x] 使用 `client.close()` 关闭连接
- [x] 移除过时的连接选项
- [x] 更新连接池的 create 和 destroy 方法

---

## 连接字符串格式参考

### 基本格式
```
mongodb://[username:password@]host[:port][/database][?options]
```

### 示例

#### 本地无密码
```javascript
mongodb://localhost:27017/mydb
```

#### 远程有密码
```javascript
mongodb://user:password@47.117.90.95:27017/silencegarden
```

#### 副本集
```javascript
mongodb://user:password@host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0
```

#### MongoDB Atlas
```javascript
mongodb+srv://user:password@cluster.mongodb.net/mydb
```

---

## 性能优化建议

### 1. 使用连接池（已实现）
```javascript
const pool = generic.createPool({
    max: 100,    // 最大连接数
    min: 5,      // 最小连接数
    // ...
});
```

### 2. 复用连接
```javascript
// ✅ 好的做法
const client = await pool.acquire();
// 执行多个操作
await db.collection('a').find();
await db.collection('b').find();
pool.release(client);

// ❌ 不好的做法
const client1 = await pool.acquire();
await db.collection('a').find();
pool.release(client1);

const client2 = await pool.acquire();
await db.collection('b').find();
pool.release(client2);
```

### 3. 使用索引
```javascript
// 为常用查询字段创建索引
await db.collection('poetry').createIndex({ title: 1 });
await db.collection('article').createIndex({ tags: 1 });
```

---

## 参考资料

- [MongoDB Node.js Driver 6.x 文档](https://www.mongodb.com/docs/drivers/node/current/)
- [从 3.x 迁移到 6.x](https://www.mongodb.com/docs/drivers/node/current/upgrade/)
- [连接字符串格式](https://www.mongodb.com/docs/manual/reference/connection-string/)

