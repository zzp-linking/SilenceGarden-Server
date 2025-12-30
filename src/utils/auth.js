import { pool } from './db.js';

// 根据uuid，临时密钥访问, 用于权限管理
export const authVali = async (uuid) => {
	let client;
	try {
		client = await pool.acquire();
		const co = client.db('silencegarden').collection('user');
		const result = await co.find({ uuid }).project({ _id: 0 }).toArray();
		
		console.log('🔐 认证验证:', uuid, '结果:', result.length > 0);
		return result.length > 0;
	} catch (err) {
		console.error('❌ 认证验证失败:', err);
		return false;
	} finally {
		if (client) pool.release(client);
	}
}

// 根据用户名和密码验证
export const userVali = async (account, password) => {
	let client;
	try {
		client = await pool.acquire();
		const co = client.db('silencegarden').collection('user');
		const result = await co.find({ account, password }).project({ _id: 0 }).toArray();
		
		console.log('🔐 用户验证:', account, '结果:', result.length > 0);
		return result.length > 0;
	} catch (err) {
		console.error('❌ 用户验证失败:', err);
		return false;
	} finally {
		if (client) pool.release(client);
	}
}