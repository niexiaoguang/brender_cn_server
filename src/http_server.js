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

const {
    get_upload_token
} = require('./utils/qiniu.js');

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

const start = () => {
    // need check head =========  merge with org files TODO
    app.get('/api/upload_token', (req, res) => {
        logger.info('request upload token' + req);
        var uploadToken = get_upload_token();
        // logger.info(uploadToken);
        res.send(uploadToken);
    });


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
            .then(function (userProfile) {
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