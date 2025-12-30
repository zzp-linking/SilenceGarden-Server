import { GET_MELODY, GET_MELODY_CATALOG, GET_MELODY_RANDOM } from '../config/url.js';
import { serverRestful } from '../utils/net.js';
import { resultWrap } from '../utils/net.js';
import { pool } from '../utils/db.js';
import Mock from 'mockjs';

export default function (app) {
	
	// 获取曲子目录
	app.get(GET_MELODY_CATALOG, async function (req, res) {
		console.log("获取曲子目录:");

		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const result = await dbo.collection("music")
				.find()
				.project({ _id: 1, name: 1, album: 1, tag: 1, disk_img: 1 })
				.toArray();
			
			console.log('查询结果:', result);
			res.send(resultWrap(result));
		} catch (err) {
			console.error('获取曲子目录失败:', err);
			res.send(resultWrap({}, '查询不知道怎么就中断了o(╥﹏╥)o', false));
		} finally {
			if (client) {
				pool.release(client);
				console.log('已释放连接');
			}
		}
	});

	// 随机播放
	app.get(serverRestful(GET_MELODY_RANDOM), async function (req, res) {
		let id;
		try {
			id = req.params.id;
			console.log("获取曲子(随机):"+ id);
		} catch (e) {
			res.send(resultWrap({}, '不要乱查询凸(艹皿艹 )', false));
			return;
		}

		if (!id) {
			res.send(resultWrap({}, '不要乱查询凸(艹皿艹 )', false));
			return;
		}

		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const list = await dbo.collection("music").find().toArray();
			
			const current_violin = list.filter((item) => item._id.toString() === id);
			
			if (current_violin.length === 1) {
				const index = list.indexOf(current_violin[0]);
				list.splice(index, 1);
				
				const obj = Mock.mock({
					[`target|0-${list.length - 1}`]: 0
				});
				
				console.log('随机播放：', obj);
				const result = list[obj.target];
				res.send(resultWrap(result));
			} else {
				res.send(resultWrap({}, '没有该数据╮(╯﹏╰）╭', false));
			}
		} catch (err) {
			console.error('随机播放失败:', err);
			res.send(resultWrap({}, '查询不知道怎么就中断了o(╥﹏╥)o', false));
		} finally {
			if (client) {
				pool.release(client);
				console.log('finally release');
			}
		}
	});

	// 获取指定曲子
	app.get(serverRestful(GET_MELODY), async function (req, res) {
		let id;
		try {
			id = req.params.id;
			console.log("获取曲子:"+ id);
		} catch (e) {
			res.send(resultWrap({}, '不要乱查询凸(艹皿艹 )', false));
			return;
		}

		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const result = await dbo.collection("music").find().toArray();
			
			const current = result.filter((item) => item._id.toString() === id)[0];

			if (current) {
				const index = result.indexOf(current);
				const last = index === 0 ? '' : result[index - 1]._id;
				const next = index === result.length - 1 ? '' : result[index + 1]._id;
				res.send(resultWrap({ melody: current, last, next }));
			} else {
				res.send(resultWrap({}, '根本不存在的曲子o(╥﹏╥)o', false));
			}
		} catch (err) {
			console.error('获取曲子失败:', err);
			res.send(resultWrap({}, '查询不知道怎么就中断了o(╥﹏╥)o', false));
		} finally {
			if (client) {
				pool.release(client);
				console.log('finally release');
			}
		}
	});

};
