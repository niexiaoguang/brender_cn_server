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
				
			}catch (e) {
				console.log(e);
			}
		})();
	});
}
exports.handle_wechat_service_req = handle_wechat_service_req;