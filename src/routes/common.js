import { SMSCODE, PHONECODEVALI, RESETPWD } from '../config/url.js';
import { mockWrap } from '../utils/net.js';

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}


export default function(app){
    app.post(SMSCODE, function (req, res) {

		const {account, state} = req.body

		console.log('account:')
		console.log(account)

		let datas 

		const randomResult = getRandomIntInclusive(0, 1)
		console.log(randomResult)

		if (randomResult) {
			datas = {
				code: 200,
				msg: '短信发送成功！'
			}
		} else {
			datas = {
				code: 100,
				msg: '该手机号码已被注册！'
			}
		}
	  	res.send(mockWrap(datas));
	})

	app.post(PHONECODEVALI, function (req, res) {

		const {account, phoneCode} = req.body
		
	  	res.send(mockWrap({code: 200}));
	})

	app.post(RESETPWD, function (req, res) {

		const {account, phoneCode, password} = req.body
		
		if (!account || !phoneCode || !password) {
			res.send(mockWrap({code: 100, msg: '参数不合法'}));
		} else {
			res.send(mockWrap({code: 200}));
		}
	  	
	})
};