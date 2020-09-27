const axios = require('axios');

const {
    get_access_token
} = require('./access_token.js');


async function init_menu() {
	try {
		var menuParams = {
					     "button":[
					     {    
					          "type":"click",
					          "name":"我的项目",
					          "key":"V1001_MY_PROJ"
					      },
					      {
					      	"type":"view",
					      	"name":"关于",
					      	"url":"https://mp.weixin.qq.com/s/xHZIfo0IPaok_Qfs6M-zKg"
					      }]
					 };


		var access_token = await get_access_token();
		var result = await axios({
			method:'POST',
			url:'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + access_token,
			data:menuParams
		})

		if(!result.data.errcode){
			console.log('create menu sucess! ' + result.data);
		}else{
			console.log('create menu failed ' + result.data);
		}

	} catch (e){
		console.log(e);
	}
}
exports.init_menu = init_menu;