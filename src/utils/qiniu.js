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
    expires: 3600 // very short timeout for control upload,for big file need big number for stream upload
};

const {
    hashhash
} = require('./crypt.js');

const {
    dehashhash
} = require('./crypt.js');



const handle_new_uploaded_file = (cb_data, res) => {

    logger.info('callback post req ' + cb_data.bucket);
    logger.info(cb_data.fsize);
    logger.info(cb_data.hash);
    logger.info(cb_data.key);
    logger.info(cb_data.fuid);

    // send data let client to handle
    res.send(cb_data);
}


const handle_get_upload_token_with_callback = (req, res) => {
    var fuid = req.query.fuid;
    logger.info('get token with cb with fuid : ' + fuid);
    var uploadCallbackUrl = 'https://brender.cn/api/upload_callback';

    var callbackBody = '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","fuid":"' + fuid + '"}';
    logger.info('cutome cb : ' + callbackBody);
    var options = {
        scope: bucket_pub,
        callbackUrl: uploadCallbackUrl,
        // callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
        callbackBody: callbackBody,
        callbackBodyType: 'application/json'
    }
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);
    res.send(uploadToken);
}



const handle_fetch_with_prefix = (prefix, res) => {
    var bucket = bucket_pub;
    // @param options 列举操作的可选参数
    //                prefix    列举的文件前缀
    //                marker    上一次列举返回的位置标记，作为本次列举的起点信息
    //                limit     每次返回的最大列举文件数量
    //                delimiter 指定目录分隔符
    var options = {
        limit: 100,
        prefix: prefix,
    };

    var config = new qiniu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);

    bucketManager.listPrefix(bucket, options, function(err, respBody, respInfo) {
        if (err) {
            logger.error(err);
            throw err;
            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
            res.send(JSON.stringify(resp)); // handle error TODO

        }
        if (respInfo.statusCode == 200) {
            //如果这个nextMarker不为空，那么还有未列举完毕的文件列表，下次调用listPrefix的时候，
            //指定options里面的marker为这个值
            var nextMarker = respBody.marker;
            var commonPrefixes = respBody.commonPrefixes;
            logger.info(nextMarker);
            logger.info(commonPrefixes);
            var items = respBody.items;
            items.forEach(function(item) {
                logger.info(item.key);
                // logger.info(item.putTime);
                logger.info(item.hash);
                // logger.info(item.fsize);
                // logger.info(item.mimeType);
                // logger.info(item.endUser);
                // logger.info(item.type);
            });

            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
            resp[myconfig.httpRespAttrInfo] = items;
            res.send(JSON.stringify(resp));


        } else {
            logger.info(respInfo.statusCode);
            logger.info(respBody);
            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
            res.send(JSON.stringify(resp)); // handle error TODO
        }
    });
}


const handle_pre_upload = (uuid, fuid, hash, res) => {
    // var hash1 = hashhash(hash);
    var hash1 = hash;
    var uuidHashFileKey = uuid + myconfig.fileKeySep + hash1; // hanlde hash to file key name TODO
    var uuidHashFuidFileKey = uuidHashFileKey + myconfig.fileKeySep + fuid;
    var keys = [uuidHashFileKey, uuidHashFuidFileKey];
    var bucket = 'brender-pub'; // TODO
    var config = new qiniu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone.Zone_z0;

    var statOperations = [];

    for (let index = 0; index < keys.length; index++) {
        const element = keys[index];
        statOperations.push(qiniu.rs.statOp(bucket, element));

    }
    var bucketManager = new qiniu.rs.BucketManager(mac, config);

    var result = [];
    bucketManager.batch(statOperations, function(err, respBody, respInfo) {
        if (err) {
            logger.error(err);
            //throw err;
            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
            res.send(JSON.stringify(resp)); // handle error TODO

        } else {

            // 200 is success, 298 is part success
            logger.info(respInfo);
            if (parseInt(respInfo.statusCode / 100) == 2) {
                respBody.forEach(function(item) {
                    if (item.code == 200) {
                        logger.info(item.data.fsize + "\t" + item.data.hash + "\t" +
                            item.data.mimeType + "\t" + item.data.putTime + "\t" +
                            item.data.type);

                        result.push(item.data.hash);


                    } else {
                        logger.info(item.code + "\t" + item.data.error);
                    }
                });

                logger.info('query hash for files result : ' + result.length);



                if (result.length == 2) {
                    // uuid-hash and uuid-hash-fuid both exists,do nothing
                    var resp = {};
                    resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                    resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                    resp[myconfig.httpReqAttrUuid] = uuid;
                    resp[myconfig.httpReqAttrFuid] = fuid;
                    resp[myconfig.httpReqAttrHash] = hash;
                    resp[myconfig.httpRespAttrToken] = myconfig.httpRespNo;
                    res.send(JSON.stringify(resp));


                }

                if (result.length == 1 && result[0] === hash) {

                    logger.info('uuid-hash exist but uuid-hash-fuid : ' + result);
                    // uuid-hash exist but uuid-hash-fuid
                    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

                    var uploadToken = putPolicy.uploadToken(mac);

                    var config = new qiniu.conf.Config();
                    var formUploader = new qiniu.form_up.FormUploader(config);
                    var putExtra = new qiniu.form_up.PutExtra();

                    var key = uuidHashFuidFileKey;
                    logger.info('direct write file with key : ' + uuidHashFuidFileKey);
                    var data = uuidHashFileKey;
                    formUploader.put(uploadToken, key, data, putExtra, function(respErr,
                        respBody, respInfo) {
                        if (respErr) {
                            throw respErr;
                            logger.error(respErr);
                            var resp = {};
                            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
                            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                            res.send(JSON.stringify(resp)); // handle error TODO
                        }
                        if (respInfo.statusCode == 200) {
                            logger.info(respBody);
                            var resp = {};
                            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                            resp[myconfig.httpReqAttrUuid] = uuid;
                            resp[myconfig.httpReqAttrFuid] = fuid;
                            resp[myconfig.httpReqAttrHash] = hash;
                            resp[myconfig.httpRespAttrToken] = myconfig.httpRespNo;
                            res.send(JSON.stringify(resp));


                        } else {
                            logger.info(respInfo.statusCode);
                            logger.info(respBody);
                            logger.error(respInfo);
                            var resp = {};
                            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
                            resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                            res.send(JSON.stringify(resp)); // handle error TODO

                        }
                    });
                }
                if (result.length == 0) {
                    // uuid-hash and uuid-hash-fuid bot not exist , need upload uuid-hash
                    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

                    var uploadToken = putPolicy.uploadToken(mac);
                    var resp = {};
                    resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                    resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                    resp[myconfig.httpReqAttrUuid] = uuid;
                    resp[myconfig.httpReqAttrFuid] = fuid;
                    resp[myconfig.httpReqAttrHash] = hash;
                    resp[myconfig.httpRespAttrToken] = uploadToken;
                    res.send(JSON.stringify(resp));


                }


            } else {
                logger.error(respInfo.statusCode);
                logger.error(respBody);
                var resp = {};
                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
                resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
                res.send(JSON.stringify(resp)); // handle error TODO
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
    logger.inf('data need to handle' + data);

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

const handle_get_upload_token_pub = (res) => {
    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

    var uploadToken = putPolicy.uploadToken(mac);
    logger.info('generate upload token : ' + uploadToken);

    res.send(uploadToken)
}

const handle_get_upload_overwrite_token_pub = (key, res) => {

    var keyToOverwrite = key;
    var bucket = bucket_pub;
    var options = {
        scope: bucket + ":" + keyToOverwrite
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);
    logger.info('generate overwrite upload token : ' + uploadToken);

    res.send(uploadToken)
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


exports.handle_new_uploaded_file = handle_new_uploaded_file;
exports.handle_get_upload_token_with_callback = handle_get_upload_token_with_callback;
exports.get_upload_token_pri = get_upload_token_pri;
exports.handle_get_upload_token_pub = handle_get_upload_token_pub;
exports.handle_get_upload_overwrite_token_pub = handle_get_upload_overwrite_token_pub;
exports.get_download_token_pub = get_download_token_pub;
exports.get_download_token_pri = get_download_token_pri;
exports.handle_get_file_hash = handle_get_file_hash;
exports.handle_get_batch_file_hash = handle_get_batch_file_hash;
exports.handle_write_data_info_file_pub = handle_write_data_info_file_pub;
exports.handle_pre_upload = handle_pre_upload;
exports.handle_fetch_with_prefix = handle_fetch_with_prefix;