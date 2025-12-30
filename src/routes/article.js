import { GET_ARTICLE_DETAILS, GET_ARTICLE_CATALOG, ARTICLE_SAVE,
		 ARTICLE_IMAGE_UPLOAD, GET_REVISE_ARTICLE_DETAILS  } from '../config/url.js';
import { ARTICLE_UPLOAD_FOLDER } from '../config/config.js';
import { pool } from '../utils/db.js';
import { resultWrap, serverRestful } from '../utils/net.js';
import formidable from 'formidable';
import Mock from 'mockjs';
import { ObjectId } from 'mongodb';

export default function (app) {

	// 新增文章和修改文章
	app.post(ARTICLE_SAVE, async function (req, res) {
		console.log('文章保存：');
		const { id, title, tags, markdown, html } = req.body;
		
		let client;
		try {
			client = await pool.acquire();
			const dbo = client.db("silencegarden");
			const collection = dbo.collection("article");
			
			if (id) {
				// 更新文章
				await collection.updateOne(
					{ _id: new ObjectId(id) },
					{ $set: { title, tags, markdown, html } }
				);
				res.send(resultWrap({}));
			} else {
				// 新增文章
				const result = await collection.insertOne({
					title,
					tags,
					markdown,
					html,
					time: new Date()
				});
				res.send(resultWrap({ id: result.insertedId }));
			}
			console.log('插入、更新文档完成');
		} catch (err) {
			console.error('文章保存失败:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		} finally {
			if (client) pool.release(client);
		}
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
