import { GET_POEM, GET_POETRY_CATALOG, GET_POETRY_CATALOG_VAGUE } from '../config/url.js';
import { resultWrap, serverRestful } from '../utils/net.js';
import { pool } from '../utils/db.js';

export default function (app) {
	

	// 根据id获取诗词内容
	app.get(serverRestful(GET_POEM), async function (req, res) {
		const title = req.params.title;
		console.log("获取诗词:"+ title);
		
		if (!title) {
			res.send({});
			return;
		}
		
		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const result = await dbo.collection("poetry").find({ "title": title }).toArray();
			
			console.log(result);
			if (result.length > 0) {
				res.send(resultWrap(result[0]));
			} else {
				res.send(resultWrap({}, '该文章未收录！'));
			}
		} catch (err) {
			console.error('查询诗词失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});

	// 获取所有诗词目录
	app.get(GET_POETRY_CATALOG, async function (req, res) {
		console.log("获取目录:");
		
		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const result = await dbo.collection("poetry")
				.find()
				.project({ _id: 0, title: 1, poetry: 1, tag: 1 })
				.toArray();
			
			console.log(result);
			if (result.length > 0) {
				res.send(resultWrap(result));
			} else {
				res.send(resultWrap({}, '当前无记录！'));
			}
		} catch (err) {
			console.error('获取目录失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});
	
	// 根据关键词查相关诗词目录
	app.get(serverRestful(GET_POETRY_CATALOG_VAGUE), async function (req, res) {
		const keyword = req.params.keyword.toString();
		console.log("获取诗词关键字:"+ keyword);

		let client;
		try {
			client = await pool.acquire();
			const co = client.db('silencegarden').collection('poetry');
			const result = await co.find({ 
				$or: [ 
					{ title: { $regex: keyword } }, 
					{ author: { $regex: keyword } }, 
					{ tag: { $regex: keyword } },
					{ poetry: { $regex: keyword } },
					{ content: { $regex: keyword } },
					{ content: { $elemMatch: { $elemMatch: { $regex: keyword } } } }
				]
			}).project({ _id: 0, title: 1, poetry: 1, tag: 1 }).toArray();
			
			console.log('查询结果:', result);
			if (result.length > 0) {
				res.send(resultWrap(result));
			} else {
				res.send(resultWrap({}, '当前无记录！'));
			}
		} catch (err) {
			console.error('模糊查询失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});

};
