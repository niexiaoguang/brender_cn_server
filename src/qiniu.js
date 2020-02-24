const qiniu = require('qiniu');

const accessKey = 'SGruygxQyj9pyA4v0x1wqAjtLlzov1IoaA3m0F2N';
const secretKey = 'd8ldTmV3_XX-9Aysd8ruh0EUPWjv8jIpGgORVvUk';

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

const bucket = 'brender';
const options = {
    scope: bucket,
};
const putPolicy = new qiniu.rs.PutPolicy(options);



const get_upload_token = () => {
    var uploadToken = putPolicy.uploadToken(mac);
    return uploadToken;
}



exports.get_upload_token = get_upload_token;