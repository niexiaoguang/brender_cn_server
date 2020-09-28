const qiniu = require('qiniu');

const {
    logger
} = require('./logger.js'); // require module as logger not the object inside which required by {logger}
const mycrypt = require('./crypt.js');


const myconfig = require('../config.js');
// console.log(config.httpReqAttrAbspath);

const qiniuConfig = require('../ssl/qiniu_config.json');

const accessKey = qiniuConfig.accessKey;
const secretKey = qiniuConfig.secretKey;


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



const generate_tokens_by_uuid_fuid = (uuid, fuid) => {

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



    // prepare overwrite token for blend file
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);

    var overwriteBlendFilekey = myconfig.nocacheFolder + myconfig.projFolder + mycrypt.simple_hash_with_salt(fuid, uuid) + '.blend';


    logger.info('overwrite project filekey : ' + overwriteBlendFilekey);
    var options_for_overwrite = {
        scope: bucket_pub + ":" + overwriteBlendFilekey,
        callbackUrl: uploadCallbackUrl,
        // callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
        callbackBody: callbackBody,
        callbackBodyType: 'application/json'
    };

    var putPolicy1 = new qiniu.rs.PutPolicy(options_for_overwrite);
    var uploadToken1 = putPolicy1.uploadToken(mac);

    return [uploadToken, uploadToken1];
}



const handle_req_upload_token = (req, res) => {
    var uuid = req.body.uuid;
    var fuid = req.body.fuid;

    //  write project data into qiniu overwrite =========
    var projFileKey = myconfig.nocacheFolder + myconfig.projInfoFolder + mycrypt.simple_hash_with_salt(fuid, uuid) + '.json';

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
            var tokens = generate_tokens_by_uuid_fuid(uuid, fuid);
            var resp = {};
            resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
            resp[myconfig.httpRespAttrInfo] = '';
            resp[myconfig.httpReqAttrUuid] = uuid;
            resp[myconfig.httpReqAttrFuid] = fuid;
            resp[myconfig.httpRespAttrToken] = tokens[0];
            resp[myconfig.httpRespAttrTokenOverwrite] = tokens[1];

            res.send(JSON.stringify(resp));

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

        var markerFileKey = myconfig.imgMarkerFolder + cb_data.key + myconfig.fileKeySep + mycrypt.simple_hash_with_salt(cb_data.fuid, cb_data.uuid) + '.json';


        // write maker file
        const putPolicy = new qiniu.rs.PutPolicy(options_pub);

        var uploadToken = putPolicy.uploadToken(mac);

        var config = new qiniu.conf.Config();
        var formUploader = new qiniu.form_up.FormUploader(config);
        var putExtra = new qiniu.form_up.PutExtra();

        var data = JSON.stringify(cb_data);
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




    } else {
        // send data let client to handle
        resp[myconfig.httpRespAttrStatus] = myconfig.httpRespOk;
        res.send(JSON.stringify(resp));

    }

}


exports.handle_new_uploaded_file = handle_new_uploaded_file;
// exports.handle_get_file_hash = handle_get_file_hash;

exports.handle_req_upload_token = handle_req_upload_token;