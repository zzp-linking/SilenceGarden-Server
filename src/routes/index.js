import poetry from './poetry.js';
import violin from './violin.js';
import article from './article.js';
import login from './login.js';
import { resultWrap } from '../utils/net.js';
import { authVali } from '../utils/auth.js';
import { BASEURL, AUTH } from '../config/url.js';

export default function(app){
	app.all(BASEURL + AUTH + '/*', async function (req, res , next) {
		var url = req.originalUrl;
		console.log('拦截器————————————————————————————', url)
		const uuid = req.cookies.uuid
		if (uuid) {
			var user_vali = await authVali(uuid)
			if (user_vali) {
				next();
			} else {
				res.send(resultWrap({}, '您还未登录', 101))
			}
		} else {
			res.send(resultWrap({}, '您还未登录', 101))
		}
		
		
	});
    poetry(app);  
    violin(app);
    article(app);
    login(app);
}