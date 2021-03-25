const fs = require('fs'),
		axios = require('axios'),
		conf = require('../ssl/wechat_config_lohogame.json'),
		tokenTemp = require('./token_temp.json')



function get_access_token_lohogame() {
	var currentTime = new Date().getTime();

	var params = {
		grant_type:'client_credential',
		appid:conf.appId,
		secret:conf.appSecret
	}


	return new Promise(function (resolve,reject) {
		if (tokenTemp.access_token === '' || tokenTemp.expired_time < currentTime) {
			axios({
				method:'GET',
				url:'https://api.weixin.qq.com/cgi-bin/token',
				params:params
			})
			.then(function (res) {
				if (!res.data.errcode) {
					tokenTemp.access_token = res.data.access_token;
					tokenTemp.expired_time = new Date().getTime() + (parseInt(res.data.expires_in) - 500) * 1000;

					console.log('handle tokenn');
					console.log(res.data);
					console.log(tokenTemp);
					fs.writeFileSync('./token_temp.json',JSON.stringify(tokenTemp));

					resolve(res.data.access_token);
				} else{
					reject(res.data);
				}

			})
			.catch(function (e) {
				reject(e);
			})
		}
		else{
			resolve(tokenTemp.access_token);
		}
	});
}


exports.get_access_token_lohogame = get_access_token_lohogame;