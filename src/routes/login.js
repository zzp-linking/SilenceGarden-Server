import { LOGIN } from '../config/url.js';
import { pool } from '../utils/db.js';
import { resultWrap } from '../utils/net.js';
import Mock from 'mockjs';

export default function(app){
    app.post(LOGIN, async function (req, res) {
		console.log('登录');
		const { account, password } = req.body;
		const { uuid } = Mock.mock({
			uuid: '@guid'
		});
		
		let client;
		try {
			client = await pool.acquire();
			const co = client.db('silencegarden').collection('user');
			
			// 更新用户的 uuid
			const result = await co.updateOne(
				{ account, password },
				{ $set: { uuid } }
			);
			
			if (result.matchedCount === 1) {
				res.send(resultWrap({ uuid }, '登录成功！'));
			} else {
				res.send(resultWrap({}, '账号或密码错误！', false));
			}
		} catch (err) {
			console.error('登录失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});

};