import { pool } from './db.js';


// 根据uuid，临时密钥访问, 用于权限管理
export const authVali = async (uuid) => {
	// 从连接池拿到连接
	const resourcePromise = pool.acquire();
	return await resourcePromise.then(async function(db) {
		const co = db.db('silencegarden').collection('user')
		const vali = await new Promise((resolve,reject) => {
			co.find({ uuid }, { id_: false }).toArray(function (err, result){
				console.log('auth vali', result)
				if (err) {
					reject('权限不足')
				} else {
					resolve(result.length > 0)
				}

			})
		})
		pool.release(db);
		return vali
	})
}


// 根据用户名和密码验证
export const userVali = async (account, password) => {
	// 从连接池拿到连接
	const resourcePromise = pool.acquire();
	return await resourcePromise.then(async function(db) {
		const co = db.db('silencegarden').collection('user')
		const vali = await new Promise((resolve,reject) => {
			co.find({ account, password }, { id_: false }).toArray(function (err, result){
				console.log('auth vali', result)
				if (err) {
					reject('无此用户')
				} else {
					resolve(result.length > 0)
				}

			})
		})
		pool.release(db);
		return vali
	})
}