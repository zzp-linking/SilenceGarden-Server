export const resultWrap = (datas, msg = '成功', type = 200 ) => {
	return {
		code: type,
		message: msg,
		result: Array.isArray(datas) ? { list: datas } : datas
	}
}

export const mockWrap = (datas) => {
	return datas;
}

export const onanaly = (obj) => {
	if (!obj.token) {
		return {}
	} else {
		return obj.datas
	}
}



export const objAnaly = (obj) => {
	if (Array.isArray(obj)) {
		for (let i of obj) {
			objAnaly(i)
		}
	} else if (typeof obj === 'string' || typeof obj === 'boolean' || typeof obj === 'number'){
		console.log(obj + '    +' )
	}else if (typeof obj === 'object'){
		for (let i in obj) {
			if (Array.isArray(obj[i])) {
				console.log('array: ' + i)
				for (let j of obj[i]) {
					objAnaly(j)
				}
			} else if (typeof obj[i] === 'string' || typeof obj[i] === 'boolean' || typeof obj[i] === 'number') {
				console.log(i + ': ' + obj[i])
			} else if (typeof obj[i] === 'object'){
				for (let j of obj[i]) {
					objAnaly(j)
				}
			}
			
		}
	}
}

export const serverRestful = (url) => {
	return url.replace(/{/g, ':').replace(/}/g, '')
}