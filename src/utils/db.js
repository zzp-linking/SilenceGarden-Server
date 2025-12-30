import { MongoClient } from 'mongodb';
import { MONGODB_USER, MONGODB_PWD, MONGODB_IP, MONGODB_PORT, MONGODB_DB } from '../config/config.js';
import generic from 'generic-pool';
import { resultWrap } from '../utils/net.js';

// MongoDB 6.x 连接字符串格式：mongodb://用户名:密码@IP:端口/数据库名
const url = `mongodb://${MONGODB_USER}:${MONGODB_PWD}@${MONGODB_IP}:${MONGODB_PORT}/${MONGODB_DB}?authSource=admin`;

const pool = generic.createPool({
    'name': 'mongodb-pool',
    'max': 50,              // 减少最大连接数
    'min': 2,               // 减少最小连接数
    'idleTimeoutMillis': 60000,  // 增加空闲超时到60秒
    'acquireTimeoutMillis': 10000, // 获取连接超时10秒
    'evictionRunIntervalMillis': 10000, // 每10秒清理一次
    'testOnBorrow': true,   // 借用时测试连接
    'log': false,
    
    // 创建连接
    'create': async function () {
        try {
            const client = new MongoClient(url, {
                maxPoolSize: 10,        // MongoDB 客户端自己的连接池
                minPoolSize: 2,
                maxIdleTimeMS: 60000,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 60000,  // 增加到60秒
                connectTimeoutMS: 10000,
                heartbeatFrequencyMS: 10000,
                retryWrites: true,       // 启用重试写入
                w: 'majority',           // 写关注级别
            });
            
            await client.connect();
            
            // 验证连接
            const result = await client.db(MONGODB_DB).command({ ping: 1 });
            if (result.ok !== 1) {
                throw new Error('Ping failed');
            }
            
            console.log('✅ MongoDB 连接池创建新连接');
            return client;
        } catch (err) {
            console.error('❌ MongoDB 连接失败:', err.message);
            throw err;
        }
    },
    
    // 验证连接是否有效（借用时调用）
    'validate': async function (client) {
        try {
            // 使用 ping 命令快速验证
            const result = await Promise.race([
                client.db(MONGODB_DB).command({ ping: 1 }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Validation timeout')), 3000)
                )
            ]);
            return result.ok === 1;
        } catch (err) {
            console.warn('⚠️  连接验证失败，将创建新连接:', err.message);
            return false;
        }
    },
    
    // 销毁连接
    'destroy': async function (client) {
        try {
            await client.close(true); // 强制关闭
            console.log('🔓 连接已销毁');
        } catch (err) {
            console.error('关闭连接失败:', err.message);
        }
    }
});

const dbOperate = (cb) => {
    const result = new Promise(function (resolve, reject) {
        cb(resolve, reject)
    })  
    return result
}

const singleFilter = (result) => {
    return result.length > 0 ? resultWrap(result[0]) : resultWrap({}, '查询失败，无该记录(╥╯^╰╥)！', false)
}

export { pool, dbOperate, singleFilter }