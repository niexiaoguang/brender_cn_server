const xml2js = require('xml2js');

module.exports = {
	toJson:function (xml) {
		return new Promise(function (resolve,reject) {
			var xmlParser = new xml2js.Parser({
				explicitArray:false,
				ignoreAttrs:true
			});

			xmlParser.parseString(xml,function (err,data) {
				if(err) return reject(err);
				resolve(data);
			});
		});
	},

	toXml:function (strObj) {
		var builder = new xml2js.Builder();
		return builder.buildObject(strObj);
	}
}