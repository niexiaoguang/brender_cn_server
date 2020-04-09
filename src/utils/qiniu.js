const qiniu = require('qiniu');

const {
    logger
} = require('./logger.js'); // require module as logger not the object inside which required by {logger}

const myconfig = require('../config.js');
// console.log(config.httpReqAttrAbspath);
const accessKey = 'SGruygxQyj9pyA4v0x1wqAjtLlzov1IoaA3m0F2N';
const secretKey = 'd8ldTmV3_XX-9Aysd8ruh0EUPWjv8jIpGgORVvUk';

const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

const bucket_pri = 'brender';
const options_pri = {
    scope: bucket_pri,
};

const bucket_pub = 'brender-pub';
const options_pub = {
    scope: bucket_pub,
};

const {
    hashhash
} = require('./crypt.js');


const handle_pre_upload = (uuid, hash, res) => {
    var hash = hashhash(hash); // conver hash TODO
    var key = uuid + '-' + hash; // hanlde hash to file key name TODO
    var bucket = 'brender-pub'; // TODO
    var config = new qiniu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);


    bucketManager.stat(bucket, key, function(err, respBody, respInfo) {
        if (err) {

            logger.error(err);
            //   return 'error';

            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
            res.send(JSON.stringify(resp)); // handle error TODO


            //throw err;
        } else {
            if (respInfo.statusCode == 200) {
                logger.info([key, respBody.hash]);
                // logger.info(respBody.fsize);
                // logger.info(respBody.mimeType);
                // logger.info(respBody.putTime);
                // logger.info(respBody.type);

                // return respBody.hash;
                if (respBody.hash === hash) {
                    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

                    var uploadToken = putPolicy.uploadToken(mac);
                    var resp = {};
                    resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                    resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                    resp[myconfig.httpReqAttrUuid] = uuid;
                    resp[myconfig.httpRespAttrHash] = hash;
                    resp[myconfig.httpRespAttrToken] = uploadToken;
                    res.send(JSON.stringify(resp));


                } else {

                    var resp = {};
                    resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
                    resp[myconfig.httpRespAttrInfo] = myconfig.ErrorQiniuTokanRead;
                    res.send(JSON.stringify(resp));

                }

            } else {
                logger.error(respInfo.statusCode);
                logger.error(respBody.error);
                // return 'error';
                var resp = {};


                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                resp[myconfig.httpReqAttrUuid] = uuid;
                resp[myconfig.httpReqAttrHash] = hash;
                resp[myconfig.httpRespAttrToken] = myconfig.httpRespNo;
                res.send(JSON.stringify(resp));
            }
        }
    });
}

// handle result TODO
const handle_write_data_info_file_pub = (data, res) => {

    // var uploadToken;
    // if (bucket === bucket_pri) {
    //     uploadToken = get_upload_token_pri();
    // } else if (bucket === bucket_pub) {
    //     uploadToken = get_download_token_pub();
    // } else {
    //     res.send('error');
    // }

    // only for bub for test TODO
    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

    var uploadToken = putPolicy.uploadToken(mac);

    var config = new qiniu.conf.Config();
    var formUploader = new qiniu.form_up.FormUploader(config);
    var putExtra = new qiniu.form_up.PutExtra();

    var key = 'testwriteintofiles.json';
    data = JSON.stringify(data);

    formUploader.put(uploadToken, key, data, putExtra, function(respErr,
        respBody, respInfo) {
        if (respErr) {
            throw respErr;
            res.send('error');

        }
        if (respInfo.statusCode == 200) {
            logger.info(respBody);
            var resp = respBody;
            res.send(JSON.stringify(resp));

        } else {
            logger.info(respInfo.statusCode);
            logger.info(respBody);
            res.send('error');

        }
    });
}


const handle_get_batch_file_hash = (bucket, keys, res) => {

    var statOperations = [];

    for (let index = 0; index < keys.length; index++) {
        const element = keys[index];
        statOperations.push(qiniu.rs.statOp(bucket, element));

    }

    var config = new qiniu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);

    var resp = [];
    bucketManager.batch(statOperations, function(err, respBody, respInfo) {
        if (err) {
            logger.error(err);
            res.send('error');
            //throw err;
        } else {

            // 200 is success, 298 is part success
            logger.info(respInfo);
            if (parseInt(respInfo.statusCode / 100) == 2) {
                respBody.forEach(function(item) {
                    if (item.code == 200) {
                        logger.info(item.data.fsize + "\t" + item.data.hash + "\t" +
                            item.data.mimeType + "\t" + item.data.putTime + "\t" +
                            item.data.type);

                        resp.push(item.data.hash);


                    } else {
                        logger.info(item.code + "\t" + item.data.error);
                    }
                });

                res.send(JSON.stringify(resp));

            } else {
                logger.error(respInfo.statusCode);
                logger.error(respBody);
                res.send('error');
            }
        }
    });

}

const handle_get_file_hash = (bucket, key, res) => {

    var config = new qiniu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);


    bucketManager.stat(bucket, key, function(err, respBody, respInfo) {
        if (err) {

            logger.error(err);
            //   return 'error';
            res.send('error');
            //throw err;
        } else {
            if (respInfo.statusCode == 200) {
                logger.info([key, respBody.hash]);
                // logger.info(respBody.fsize);
                // logger.info(respBody.mimeType);
                // logger.info(respBody.putTime);
                // logger.info(respBody.type);

                // return respBody.hash;
                var data = { "key": key, "hash": respBody.hash };
                res.send(JSON.stringify(data));
            } else {
                logger.error(respInfo.statusCode);
                logger.error(respBody.error);
                // return 'error';
                var data = { "key": key, "hash": "none" }
                res.send(JSON.stringify(data));
            }
        }
    });
}

const get_upload_token_pri = () => {
    const putPolicy = new qiniu.rs.PutPolicy(options_pri);

    var uploadToken = putPolicy.uploadToken(mac);
    return uploadToken;
}

const get_upload_token_pub = async() => {
    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

    var uploadToken = putPolicy.uploadToken(mac);
    return uploadToken;
}


const get_download_token_pub = (key) => {
    var config = new qiniu.conf.Config();
    var bucketManager = new qiniu.rs.BucketManager(mac, config);
    var publicBucketDomain = 'http://brender-pub.s3-cn-east-1.qiniucs.com';
    var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
    // console.log(publicDownloadUrl);
    return publicDownloadUrl;
}

const get_download_token_pri = (key) => {
    var config = new qiniu.conf.Config();
    var bucketManager = new qiniu.rs.BucketManager(mac, config);
    var privateBucketDomain = 'http://brender.s3-cn-east-1.qiniucs.com';
    var deadline = parseInt(Date.now() / 1000) + 3600; // 1小时过期
    var privateDownloadUrl = bucketManager.privateDownloadUrl(privateBucketDomain, key, deadline);
    return privateDownloadUrl;
}



exports.get_upload_token_pri = get_upload_token_pri;
exports.get_upload_token_pub = get_upload_token_pub;
exports.get_download_token_pub = get_download_token_pub;
exports.get_download_token_pri = get_download_token_pri;
exports.handle_get_file_hash = handle_get_file_hash;
exports.handle_get_batch_file_hash = handle_get_batch_file_hash;
exports.handle_write_data_info_file_pub = handle_write_data_info_file_pub;
exports.handle_pre_upload = handle_pre_upload;