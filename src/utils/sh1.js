const md5 = require("blueimp-md5");

const make_uuid_by_openid = (data) => {
    return md5(data).substring(8,24);


}


exports.make_uuid_by_openid = make_uuid_by_openid;