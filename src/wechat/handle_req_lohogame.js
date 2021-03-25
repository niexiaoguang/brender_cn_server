const axios = require('axios');

const {
    get_access_token_lohogame
} = require('./access_token_lohogame.js');

const xmlTools = require('../utils/xmltool.js');

function handle_wechat_service_req_lohogame(req,res) {
	var buff = '';
	req.on('data',function (data) {
		buff += data;
	});

	req.on('end',function () {
		console.log('lohogame wechat server req got : ');
		console.log(buff);


		(async function () {
			try {
				var result = await xmlTools.toJson(buff);

				console.log(result);

				switch (result.xml.MsgType){
					case 'event':

						switch (result.xml.EventKey) {
							case 'V1001_MY_PROJ':
								resProjLinkByUser(res,result);
								break;

						}






					case 'text':
						replyAuto(res,result);
						break;
				}

			}catch (e) {
				console.log(e);
			}
		})();
	});
}

function replyAuto(res,result) {
	console.log('reply Auto');
	var user = result.xml.FromUserName;
	var resMsg = {
		xml:{
			ToUserName:result.xml.FromUserName,
			FromUserName:result.xml.ToUserName,
			CreateTime:new Date().getTime(),
			MsgType:'text',
			Content:'game start! ' + user
		}

	}


	var resMsgXml = xmlTools.toXml(resMsg);
	console.log(resMsgXml);
	res.send(resMsgXml);

}


function resProjLinkByUser(res,result) {
	console.log('res proj link by user');
	var user = result.xml.FromUserName;
	var resMsg = {
		xml:{
			ToUserName:result.xml.FromUserName,
			FromUserName:result.xml.ToUserName,
			CreateTime:new Date().getTime(),
			MsgType:'text',
			Content:'hello ' + user
		}

	}


	var resMsgXml = xmlTools.toXml(resMsg);
	console.log(resMsgXml);
	res.send(resMsgXml);
}


exports.handle_wechat_service_req_lohogame = handle_wechat_service_req_lohogame;