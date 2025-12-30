import poetry from './poetry.js';
import violin from './violin.js';
import article from './article.js';
import login from './login.js';
import { resultWrap } from '../utils/net.js';
import { authVali } from '../utils/auth.js';
import { BASEURL, AUTH } from '../config/url.js';

export default function(app){
	// 认证拦截器（处理所有需要登录的接口）
	app.all(BASEURL + AUTH + '/*', async function (req, res, next) {
		const url = req.originalUrl;
		console.log('🔐 拦截器触发 →', url);
		
		try {
			// 开发环境跳过认证（方便测试）
			const isDev = process.env.NODE_ENV !== 'production';
			if (isDev) {
				console.log('⚠️  开发模式：跳过认证检查');
				next();
				return;
			}
			
			// 生产环境：验证 uuid
			const uuid = req.cookies.uuid;
			
			if (!uuid) {
				console.log('❌ 认证失败：未提供 uuid');
				res.send(resultWrap({}, '您还未登录，请先登录', 101));
				return;
			}
			
			console.log('🔍 正在验证 uuid:', uuid.substring(0, 8) + '...');
			const isValid = await authVali(uuid);
			
			if (isValid) {
				console.log('✅ 认证通过，继续处理请求');
				next();
			} else {
				console.log('❌ 认证失败：uuid 无效或已过期');
				res.send(resultWrap({}, '登录已过期，请重新登录', 101));
			}
		} catch (err) {
			console.error('❌ 认证拦截器异常:', err);
			res.send(resultWrap({}, '系统异常，请稍后再试', false));
		}
	});
	
	// 注册路由
	poetry(app);  
	violin(app);
	article(app);
	login(app);
}