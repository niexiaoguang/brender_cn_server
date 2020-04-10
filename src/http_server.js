'use strict';


const express = require('express'),
    HttpStatus = require('http-status-codes'),
    path = require('path'),
    crypto = require('crypto'),
    fs = require('fs'),
    url = require('url'),
    bodyParser = require('body-parser');

const {
    logger
} = require('./utils/logger.js'); // require module as logger not the object inside which required by {logger}

const jsonParser = bodyParser.json();

const urlencodedParser = bodyParser.urlencoded({
    extended: false
})

// const { logger } = require('./tools/logger.js');

const port = process.env.PORT || 3000;

const {
    Wechat
} = require('wechat-jssdk');

const {
    sha1
} = require('./utils/crypt.js');

// qiniu api
// ========================================================

const {
    handle_pre_upload
} = require('./utils/qiniu.js');

const {
    handle_write_data_info_file_pub
} = require('./utils/qiniu.js');

const {
    get_upload_token_pri
} = require('./utils/qiniu.js');

const {
    get_upload_token_pub
} = require('./utils/qiniu.js');


const {
    get_download_token_pub
} = require('./utils/qiniu.js');

const {
    get_download_token_pri
} = require('./utils/qiniu.js');

const {
    handle_get_file_hash
} = require('./utils/qiniu.js');


const {
    handle_get_batch_file_hash
} = require('./utils/qiniu.js');

// ========================================================



const {
    inspect
} = require('util');

const {
    make_uuid_by_openid
} = require('./utils/crypt.js');

// obj to save blender login token with timeout 30 sencs
var bl_login_token_pool = {};

// cleanning login token pool 
const clean_login_pool = () => {
    logger.info('cleaning login token pools');
    for (var prop in bl_login_token_pool) {
        if (Object.prototype.hasOwnProperty.call(bl_login_token_pool, prop)) {
            var currentTs = new Date().getTime();
            var ts = prop[ts];
            if (currentTs - ts > 30 * 1000) {
                delete bl_login_token_pool[prop];
            }
        }
    }
};

const wechatConfig = {
    //set your oauth redirect url, defaults to localhost
    "wechatRedirectUrl": "https://brender.cn/api/wechat/bl_login_call_back",
    "wechatToken": "c0cb73f4a56d4cbabbc9401cdf120b09", //not necessary required
    "appId": "wx71881af6d1cdaea8",
    "appSecret": "74b7f36f09f414001fc429c756d62a05",
    // card: true, //enable cards
    // payment: true, //enable payment support
    // merchantId: '', //
    // paymentSandBox: true, //dev env
    // paymentKey: '', //API key to gen payment sign
    // paymentCertificatePfx: fs.readFileSync(path.join(process.cwd(), 'cert/apiclient_cert.p12')),
    //default payment notify url
    // paymentNotifyUrl: `http://your.domain.com/api/wechat/payment/`,
    //mini program config
    // "miniProgram": {
    //     "appId": "mp_appid",
    //     "appSecret": "mp_app_secret",
    // }
}

const wx = new Wechat(wechatConfig);
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


const start = () => {
    app.post('/api/file_metadata', (req, res) => {
        var data = req.body;
        logger.info(data);
        handle_write_data_info_file_pub(data, res);

    });


    app.get('/api/pre_upload', (req, res) => {
        logger.info('pre upload req for upload token ' + req);
        var uuid = req.query.uuid;
        var hash = req.query.hash;
        handle_pre_upload(uuid, hash, res);
    });


    // need check head =========  merge with org files TODO
    // app.get('/api/file_hash', (req, res) => {
    //     logger.info('request file hash' + req);
    //     var bucket = req.query.bucket;
    //     var key = req.query.key;
    //     handle_get_file_hash(bucket, key, res);

    // });

    // app.post('/api/batch_file_hash', (req, res) => {
    //     logger.info('request a batch file hash' + req);
    //     var bucket = req.body.bucket;
    //     var keys = req.body.keys;
    //     handle_get_batch_file_hash(bucket, keys, res);

    // });



    // app.get('/api/upload_token_pri', (req, res) => {
    //     logger.info('request upload token' + req);
    //     var uploadToken = get_upload_token_pri();
    //     // logger.info(uploadToken);
    //     res.send(uploadToken);
    // });


    // app.get('/api/upload_token_pub', (req, res) => {
    //     logger.info('request upload token' + req);
    //     var uploadToken = get_upload_token_pub();
    //     // logger.info(uploadToken);
    //     res.send(uploadToken);
    // });


    // app.get('/api/download_token_pub', (req, res) => {
    //     logger.info('request download token pub ' + req);
    //     var key = req.query.key;
    //     var downloadToken = get_download_token_pub(key);
    //     // logger.info(downloadToken);
    //     res.send(downloadToken);
    // });

    // app.get('/api/download_token_pri', (req, res) => {
    //     logger.info('request download token pri ' + req);
    //     var key = req.query.key;
    //     var downloadToken = get_download_token_pri(key);
    //     // logger.info(downloadToken);
    //     res.send(downloadToken);
    // });



    app.get('/api', (req, res) => {
        logger.info('api echo : ' + req);
        res.send('Hello World!')
    });


    app.get('/api/wechat/get-signature', (req, res) => {
        wx.jssdk.getSignature(req.query.url).then(signatureData => {
            res.json(signatureData);
        });
    });

    app.post('/api/bl_login_confirm', jsonParser, (req, res) => {
        var token = req.body.token;
        logger.info('req : ' + JSON.stringify(req.body));
        logger.info('login pool : ' + JSON.stringify(bl_login_token_pool));
        if (Object.prototype.hasOwnProperty.call(bl_login_token_pool, token)) {
            var response_data = bl_login_token_pool[token];
            delete bl_login_token_pool[token];
            res.json({
                status: 'ok',
                data: response_data
            });
        } else {
            res.json({
                status: 'error',
                data: 'invalid token'
            })
        }
    });



    app.get('/api/wechat/bl_login_call_back', (req, res) => {

        wx.oauth.getUserInfo(req.query.code)
            .then(function(userProfile) {
                logger.info(userProfile);
                // logger.info('login code : ' + req.query.code);
                logger.info('login token : ' + req.query.state);
                var openid = userProfile.openid;
                var nickname = userProfile.nickname;
                var uuid = make_uuid_by_openid(openid);
                var ts = new Date().getTime();
                var token = req.query.state
                bl_login_token_pool[token] = {
                    "uuid": uuid,
                    "nicknamke": nickname,
                    "ts": ts
                };
                // res.json({
                //     wechatInfo: userProfile
                // });
                res.json({
                    "status": "ok"
                });
            });

        clean_login_pool();
    });





    // app.get('/api/wechat/token_validate', (req, res) => {
    //     var query = url.parse(req.url, true).query;
    //     //logger.info("*** URL:" + req.url);
    //     //logger.info(query);
    //     var signature = query.signature;
    //     var echostr = query.echostr;
    //     var timestamp = query['timestamp'];
    //     var nonce = query.nonce;
    //     var oriArray = new Array();
    //     oriArray[0] = nonce;
    //     oriArray[1] = timestamp;
    //     oriArray[2] = "c0cb73f4a56d4cbabbc9401cdf120b09"; //my set token ****
    //     oriArray.sort();
    //     var original = oriArray.join('');
    //     logger.info("Original str : " + original);
    //     logger.info("Signature : " + signature);
    //     var scyptoString = sha1(original);
    //     if (signature == scyptoString) {
    //         res.send(echostr);
    //         logger.info("Confirm and send echo back");
    //     } else {
    //         res.send("false");
    //         logger.info("Failed!");
    //     }
    // });

    app.listen(port, () => logger.info(`App listening on port ${port}!`));


};

const init = () => {
    logger('httpServer init');
}
exports.init = init;
exports.start = start;