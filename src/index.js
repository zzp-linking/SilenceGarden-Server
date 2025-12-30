import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';

var app = express();

app.use(bodyParser.json({limit: '1mb'}));  //body-parser 解析json格式数据
app.use(bodyParser.urlencoded({            //此项必须在 bodyParser.json 下面,为参数编码
  extended: true
}));
app.use(cookieParser())

/*
 *拦截器写法1	
 */
/*app.use(function (req, res, next) {
    var url = req.originalUrl;
    console.log('拦截器_________________________', url)
    next();
});*/

/*app.get('/Zbasic/login.do', function (req, res) {
	
	var a = {
		name: 'zzp',
		age: 16
	}
	
  res.send(a);
});

app.post('/Zbasic/login.do', function (req, res) {
	var a = {
		name: 'zzp',
		age: 16,
		methods: 'POST'
	}
	
	const {account, password} = req.body
	console.log(account + ': ' + password)
	console.log(JSON.stringify(req.body))

  	res.send(a);
})*/

routes(app);


var server = app.listen(4000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
