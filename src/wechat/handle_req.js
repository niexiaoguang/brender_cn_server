const axios = require('axios');

const {
    get_access_token
} = require('./access_token.js');

const xmlTools = require('../utils/xmltool.js');

function handle_wechat_service_req(req,res) {
	var buff = '';
	req.on('data',function (data) {
		buff += data;
	});

	req.on('end',function () {
		console.log('wechat server req got : ');
		// console.log(buff);


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





						break;
				}

			}catch (e) {
				console.log(e);
			}
		})();
	});
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


exports.handle_wechat_service_req = handle_wechat_service_req;