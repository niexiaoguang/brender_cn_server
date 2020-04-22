const qiniu = require('qiniu');

const {
    logger
} = require('./logger.js'); // require module as logger not the object inside which required by {logger}
const mycrypt = require('./crypt.js');


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



const generate_filekey_by_hash = (hash, uuid, fuid) => {
    return hash;
}


// -------------------------------------------------------------------------------------------

const handle_req_upload_token_1 = (req, res) => {

    var uuid = req.body.uuid;
    var fuid = req.body.fuid;
    var hashes = req.body.projdata.hashes; // TODO
    var statOperations = [];

    for (let index = 0; index < hashes.length; index++) {
        const element = generate_filekey_by_hash(hashes[index]);
        statOperations.push(qiniu.rs.statOp(bucket_pub, element));

    }

    var config = new qiniu.conf.Config();
    //config.useHttpsDomain = true;
    config.zone = qiniu.zone.Zone_z0;
    var bucketManager = new qiniu.rs.BucketManager(mac, config);

    bucketManager.batch(statOperations, function(err, respBody, respInfo) {
        if (err) {
            //throw err;
            logger.error(err);

            var resp = {};

            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = myconfig.ErrorCodeQiniuReq;
            resp[myconfig.httpReqAttrUuid] = uuid;
            resp[myconfig.httpReqAttrFuid] = fuid;

            res.send(JSON.stringify(resp));
        } else {

            // 200 is success, 298 is part success
            logger.info(respInfo);
            var qRes = [];

            if (parseInt(respInfo.statusCode / 100) == 2) {
                respBody.forEach(function(item) {
                    if (item.code == 200) {
                        logger.info(item.data.fsize + "\t" + item.data.hash + "\t" +
                            item.data.mimeType + "\t" + item.data.putTime + "\t" +
                            item.data.type);

                        qRes.push(item.data.hash);


                    } else {
                        logger.info(item.code + "\t" + item.data.error);
                    }
                });

                // minus qRes from hashesh
                qRes = hashes.filter(n => !qRes.includes(n));


                // generate token to response
                logger.info('get token with cb with uuid : ' + uuid);
                logger.info('get token with cb with fuid : ' + fuid);
                var uploadCallbackUrl = 'https://brender.cn/api/upload_callback';

                var callbackBody = '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","fuid":"' + fuid + '",' + '"uuid":"' + uuid + '"}';

                logger.info('cutome cb : ' + callbackBody);
                var options = {
                    scope: bucket_pub,
                    callbackUrl: uploadCallbackUrl,
                    // callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
                    callbackBody: callbackBody,
                    callbackBodyType: 'application/json'
                };



                var putPolicy = new qiniu.rs.PutPolicy(options);
                var uploadToken = putPolicy.uploadToken(mac);

                var overwriteBlendFilekey = myconfig.nocacheFolder + mycrypt.simple_hash_with_salt(fuid + mycrypt.fuidJsonFileKeySalt) + '.blend';

                var options_for_overwrite = {
                    scope: bucket_pub + ":" + overwriteBlendFilekey,
                    callbackUrl: uploadCallbackUrl,
                    // callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
                    callbackBody: callbackBody,
                    callbackBodyType: 'application/json'
                };

                var putPolicy1 = new qiniu.rs.PutPolicy(options_for_overwrite);
                var uploadToken1 = putPolicy1.uploadToken(mac);



                var resp = {};
                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                resp[myconfig.httpRespAttrInfo] = qRes;
                resp[myconfig.httpReqAttrUuid] = uuid;
                resp[myconfig.httpReqAttrFuid] = fuid;
                resp[myconfig.httpRespAttrToken] = uploadToken;
                resp[myconfig.httpRespAttrTokenOverwrite] = uploadToken1;

                res.send(JSON.stringify(resp));

            } else {

                var resp = {};

                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                resp[myconfig.httpRespAttrInfo] = myconfig.ErrorCodeQiniuFileStat;
                resp[myconfig.httpReqAttrUuid] = uuid;
                resp[myconfig.httpReqAttrFuid] = fuid;

                res.send(JSON.stringify(resp));
            }
        }
    });

}


const handle_req_upload_token = (req, res) => {
    var uuid = req.body.uuid;
    var fuid = req.body.fuid;

    //  write project data into qiniu overwrite =========
    var projFileKey = myconfig.nocacheFolder + mycrypt.simple_hash_with_salt(fuid + mycrypt.fuidJsonFileKeySalt) + '.json';

    logger.info('generate proj json file : ' + projFileKey);
    var keyToOverwrite = projFileKey;
    var bucket = bucket_pub;
    var options = {
        scope: bucket + ":" + keyToOverwrite
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);

    var config = new qiniu.conf.Config();
    var formUploader = new qiniu.form_up.FormUploader(config);
    var putExtra = new qiniu.form_up.PutExtra();

    logger.info('data need to handle' + req.body);

    formUploader.put(uploadToken, projFileKey, JSON.stringify(req.body), putExtra, function(respErr,
        respBody, respInfo) {
        if (respErr) {

            logger.error(respErr);
            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = myconfig.ErrorCodeQiniuReq;
            resp[myconfig.httpReqAttrUuid] = uuid;
            resp[myconfig.httpReqAttrFuid] = fuid;

            res.send(JSON.stringify(resp));

        }
        if (respInfo.statusCode == 200) {
            // pass req and res to next handle process
            handle_req_upload_token_1(req, res);

        } else {
            logger.info(respInfo.statusCode);
            logger.info(respBody);
            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
            resp[myconfig.httpRespAttrInfo] = respInfo.statusCode;
            resp[myconfig.httpReqAttrUuid] = uuid;
            resp[myconfig.httpReqAttrFuid] = fuid;
        }
    });

}

// -------------------------------------------------------------------------------------------
const handle_new_uploaded_file = (cb_data, res) => {

    logger.info('callback post req ' + cb_data.bucket);
    logger.info(cb_data.fsize);
    logger.info(cb_data.hash);
    logger.info(cb_data.key);
    logger.info(cb_data.fuid);
    logger.info(cb_data.uuid);

    var resp = {};
    resp[myconfig.httpRespAttrStatus] = null;
    resp[myconfig.httpRespAttrInfo] = myconfig.httpRespNo;
    resp[myconfig.httpReqAttrUuid] = cb_data.uuid;
    resp[myconfig.httpReqAttrFuid] = cb_data.fuid;
    resp[myconfig.httpReqAttrHash] = cb_data.hash;
    resp[myconfig.httpRespAttrFsize] = cb_data.fsize;
    resp[myconfig.httpReqAttrFilekey] = cb_data.key;

    // not blend file , like images need generate mark file
    if (cb_data.key.indexOf('.blend') == -1) {
        var fuidHash = mycrypt.simple_hash_with_salt(cb_data.fuid + mycrypt.fuidFileKeySalt);
        var markerFileKey = cb_data.hash + myconfig.fileKeySep + fuidHash;


        // write maker file
        const putPolicy = new qiniu.rs.PutPolicy(options_pub);

        var uploadToken = putPolicy.uploadToken(mac);

        var config = new qiniu.conf.Config();
        var formUploader = new qiniu.form_up.FormUploader(config);
        var putExtra = new qiniu.form_up.PutExtra();

        var data = cb_data;
        formUploader.put(uploadToken, markerFileKey, data, putExtra, function(respErr,
            respBody, respInfo) {
            if (respErr) {
                // throw respErr;
                logger.error(respErr);

                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
                res.send(JSON.stringify(resp));

            }
            if (respInfo.statusCode == 200) {
                logger.info(respBody);

                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
                res.send(JSON.stringify(resp));

            } else {
                logger.info(respInfo.statusCode);
                logger.info(respBody);
                logger.error(respBody);

                resp[myconfig.httpRespAttrStatus] = myconfig.httpRespError;
                res.send(JSON.stringify(resp));

            }
        });




    }
    // send data let client to handle
    // res.send(cb_data);
}


const handle_get_upload_token_with_callback = (req, res) => {
    var uuid = req.query.uuid;
    var fuid = req.query.fuid;
    logger.info('get token with cb with fuid : ' + fuid);
    var uploadCallbackUrl = 'https://brender.cn/api/upload_callback';

    var callbackBody = '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","fuid":"' + fuid + '",' + '"uuid":"' + uuid + '"}';

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



const get_upload_token_pub = (res) => {
    const putPolicy = new qiniu.rs.PutPolicy(options_pub);

    var uploadToken = putPolicy.uploadToken(mac);
    logger.info('generate upload token : ' + uploadToken);

    res.send(uploadToken)
}

const get_upload_overwrite_token_pub = (key, res) => {

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
// exports.handle_get_file_hash = handle_get_file_hash;

exports.handle_req_upload_token = handle_req_upload_token;