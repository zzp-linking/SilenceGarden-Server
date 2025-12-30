import { REGISTER } from '../config/url.js';
import { uuid } from '../utils/uuid.js';
import { mockWrap } from '../utils/net.js';

export default function(app){
    app.post(REGISTER, function (req, res) {
		
		console.log(uuid())
		
		const {account, password, phoneCode, picCode, inviteCode} = req.body
	
		let datas;
		if (!account) {
			res.send(mockWrap({ code: 100, msg: '账号不能为空' }));
		} else if (!password) {
			res.send(mockWrap({ code: 100, msg: '密码不能为空' }));
		} else if (!phoneCode) {
			res.send(mockWrap({ code: 100, msg: '验证码不能为空' }));
		} else if (!picCode) {
			res.send(mockWrap({ code: 100, msg: '图形验证码不能为空' }));
		} else {
			res.send(mockWrap({ 
				code: 200,
				token: uuid(),
				user: {
					name: account,
					img: 'http://i0.hdslb.com/bfs/bangumi/75b5469a3931652fbeaab17d993e2c93b5915286.jpg@72w_72h.jpg'
				}
			}, '恭喜您注册成功，即将自动登录！'));
		}
	})
};