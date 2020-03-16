const md5 = require("blueimp-md5");

const make_uuid_by_openid = (raw) => {
    return md5(raw).substring(8,24);


}


const sha1 = (str) => {
    var md5sum = crypto.createHash("sha1");
    md5sum.update(str);
    str = md5sum.digest("hex");
    return str;
}

exports.make_uuid_by_openid = make_uuid_by_openid;
exports.sha1 = sha1;