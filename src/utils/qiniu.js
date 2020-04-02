const qiniu = require('qiniu');

const {
    logger
} = require('./logger.js'); // require module as logger not the object inside which required by {logger}



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
                res.send(JSON.stringify([key, respBody.hash]));
            } else {
                logger.error(respInfo.statusCode);
                logger.error(respBody.error);
                // return 'error';
                res.send('error');
            }
        }
    });
}

const get_upload_token_pri = () => {
    const putPolicy = new qiniu.rs.PutPolicy(options_pri);

    var uploadToken = putPolicy.uploadToken(mac);
    return uploadToken;
}

const get_upload_token_pub = () => {
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