import { GET_ARTICLE_DETAILS, GET_ARTICLE_CATALOG, ARTICLE_SAVE,
		 ARTICLE_IMAGE_UPLOAD, GET_REVISE_ARTICLE_DETAILS  } from '../config/url.js';
import { ARTICLE_UPLOAD_FOLDER } from '../config/config.js';
import { pool } from '../utils/db.js';
import { resultWrap, serverRestful } from '../utils/net.js';
import formidable from 'formidable';
import Mock from 'mockjs';
import { ObjectId } from 'mongodb';

export default function (app) {

	// 新增文章和修改文章（带重试机制）
	app.post(ARTICLE_SAVE, async function (req, res) {
		console.log('📝 文章保存开始：');
		const { id, title, tags, markdown, html } = req.body;
		console.log(`  - 操作类型: ${id ? '更新' : '新增'}`);
		console.log(`  - 标题: ${title}`);
		console.log(`  - 内容大小: markdown=${markdown?.length || 0} bytes, html=${html?.length || 0} bytes`);
		
		// 重试逻辑
		const maxRetries = 3;
		let lastError;
		
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			let client;
			try {
				console.log(`🔌 [尝试 ${attempt}/${maxRetries}] 正在获取数据库连接...`);
				client = await pool.acquire();
				console.log('✅ 连接获取成功');
				
				// 先测试连接
				await client.db("silencegarden").command({ ping: 1 });
				console.log('✅ 连接验证通过');
				
				const dbo = client.db("silencegarden");
				const collection = dbo.collection("article");
				
				if (id) {
					// 更新文章
					console.log(`📝 正在更新文章 ID: ${id}`);
					const result = await collection.updateOne(
						{ _id: new ObjectId(id) },
						{ $set: { title, tags, markdown, html, updateTime: new Date() } }
					);
					console.log(`✅ 更新完成: 匹配=${result.matchedCount}, 修改=${result.modifiedCount}`);
					res.send(resultWrap({ updated: true, matchedCount: result.matchedCount }));
				} else {
					// 新增文章
					console.log('📝 正在插入新文章...');
					const result = await collection.insertOne({
						title,
						tags,
						markdown,
						html,
						time: new Date()
					});
					console.log(`✅ 插入完成，新文章 ID: ${result.insertedId}`);
					res.send(resultWrap({ id: result.insertedId }));
				}
				
				// 成功则返回
				return;
				
			} catch (err) {
				lastError = err;
				console.error(`❌ [尝试 ${attempt}/${maxRetries}] 文章保存失败！`);
				console.error('错误类型:', err.name);
				console.error('错误消息:', err.message);
				console.error('错误代码:', err.code);
				
				// 如果是最后一次尝试或不可重试的错误，直接失败
				if (attempt === maxRetries || 
				    err.message.includes('not authorized') ||
				    err.message.includes('duplicate key')) {
					console.error('完整错误:', err);
					break;
				}
				
				// 否则等待后重试
				console.log(`⏳ 等待 ${attempt} 秒后重试...`);
				await new Promise(resolve => setTimeout(resolve, attempt * 1000));
				
			} finally {
				if (client) {
					console.log('🔓 释放数据库连接');
					try {
						pool.release(client);
					} catch (e) {
						console.error('释放连接失败:', e.message);
					}
				}
			}
		}
		
		// 所有重试都失败
		console.error('❌ 所有重试均失败');
		let errorMsg = '系统异常，请稍后再试';
		if (lastError.message.includes('not authorized')) {
			errorMsg = '没有写入权限';
		} else if (lastError.code === 'ECONNREFUSED') {
			errorMsg = '数据库连接失败';
		} else if (lastError.name === 'MongoNetworkError') {
			errorMsg = '网络连接失败，请检查网络';
		} else if (lastError.name === 'MongoServerError') {
			errorMsg = '数据库服务器错误: ' + lastError.message;
		}
		
		res.send(resultWrap({}, errorMsg, false));
	});

	// 获取文章目录
	app.get(GET_ARTICLE_CATALOG, async function (req, res) {
		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const result = await dbo.collection("article")
				.find()
				.project({ _id: 1, title: 1, tags: 1 })
				.toArray();
			
			if (result.length > 0) {
				res.send(resultWrap(result));
			} else {
				res.send(resultWrap({}, '当前无记录！'));
			}
		} catch (err) {
			console.error('获取文章目录失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});

	// 获取需要修改的文章详情
	app.get(serverRestful(GET_REVISE_ARTICLE_DETAILS), async function (req, res) {
		const id = req.params.id;
		
		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const result = await dbo.collection("article")
				.find({ _id: new ObjectId(id) })
				.project({ _id: 0, title: 1, tags: 1, markdown: 1 })
				.toArray();
			
			if (result.length > 0) {
				res.send(resultWrap(result[0]));
			} else {
				res.send(resultWrap({}, '该文章未收录！'));
			}
		} catch (err) {
			console.error('获取文章详情失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});

	// 阅读文章获取详情
	app.get(serverRestful(GET_ARTICLE_DETAILS), async function (req, res) {
		const id = req.params.id;
		console.log("获取文章:"+ id);
		
		if (!id) {
			res.send({});
			return;
		}
		
		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			
			console.log('聚合开始--------------------------------');
			const result = await dbo.collection("article").aggregate([
				{ $match: { '_id': new ObjectId(id) } },
				{
					$project: {
						time: {
							$dateToString: {
								format: "%Y-%m-%d %H:%M:%S",
								date: "$time",
								timezone: "+08"
							}
						},
						title: 1,
						tags: 1,
						html: 1
					}
				}
			]).toArray();
			
			console.log('聚合结束================================');
			
			if (result.length > 0) {
				res.send(resultWrap(result[0]));
			} else {
				res.send(resultWrap({}, '该文章未收录！'));
			}
		} catch (err) {
			console.error('获取文章详情失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
	});

	// 图片上传 (Formidable 3.x 新 API)
	app.post(ARTICLE_IMAGE_UPLOAD, async function (req, res) {
		const form = formidable({
			encoding: 'utf-8',
			uploadDir: ARTICLE_UPLOAD_FOLDER,
			keepExtensions: true,
			maxFieldsSize: 20 * 1024 * 1024,
			hashAlgorithm: 'md5'
		});
		
		// 验证参数合法及更改文件名
		form.on('fileBegin', function(name, file) {
			try {
				if (name !== 'image') {
					throw new Error('参数不正确');
				}
				const arr = file.originalFilename.split('.');
				const file_type = arr.pop();
				const newName = (arr.join('.') + '-' + Mock.mock('@guid').split('-')[0].toLowerCase() + '.' + file_type).replace(/\s/g, '');
				file.filepath = ARTICLE_UPLOAD_FOLDER + '/' + newName;
				file.newFilename = newName;
			} catch (e) {
				console.error('文件名处理失败:', e);
			}
		});
		
		try {
			// Formidable 3.x 使用 Promise
			const [fields, files] = await form.parse(req);
			
			const imageFile = files.image ? files.image[0] : null;
			if (!imageFile) {
				res.send(resultWrap({}, '没有上传文件', false));
				return;
			}
			
			const imageName = imageFile.newFilename;
			const insert_obj = { image: imageName, time: new Date() };
			
			console.log('上传记录保存：', imageName);
			
			let client;
			try {
				client = await pool.acquire();
				const dbo = client.db("silencegarden");
				const collection = dbo.collection("article_image");
				await collection.insertOne(insert_obj);
				res.send(resultWrap({ image: imageName }));
			} catch (err) {
				console.error('保存上传记录失败:', err);
				res.send(resultWrap({}, '系统异常，请稍后再试', false));
			} finally {
				if (client) pool.release(client);
			}
		} catch (err) {
			console.error('文件上传失败:', err);
			res.send(resultWrap({}, '只支持png和jpg格式图片', false));
		}
	});

}
