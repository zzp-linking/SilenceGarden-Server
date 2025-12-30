import { MongoClient } from 'mongodb';
import { MONGODB_USER, MONGODB_PWD, MONGODB_IP, MONGODB_PORT, MONGODB_DB } from '../config/config.js';
import generic from 'generic-pool';
import { resultWrap } from '../utils/net.js';

// MongoDB 6.x 连接字符串格式：mongodb://用户名:密码@IP:端口/数据库名
const url = `mongodb://${MONGODB_USER}:${MONGODB_PWD}@${MONGODB_IP}:${MONGODB_PORT}/${MONGODB_DB}?authSource=admin`;

const pool = generic.createPool({
    'name': 'mongodb-pool',   // 连接池名称
    'max': 100,             // 最大连接数           
    'min': 5,               // 最小连接数  
    'idleTimeoutMillis': 30 * 1000,// 空闲等待时间
    'log': false,           // 是否console.log输出日志
    // 创建连接方法
    'create': async function () {
        try {
            // MongoDB 6.x 使用新的连接方式
            const client = new MongoClient(url);
            await client.connect();
            console.log('✅ MongoDB 连接成功');
            return client;
        } catch (err) {
            console.error('❌ MongoDB 连接失败:', err);
            throw err;
        }
    },
    // 销毁方法
    'destroy': function (client) {
        return client.close();
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