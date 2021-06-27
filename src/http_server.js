'use strict';


const express = require('express'),
    HttpStatus = require('http-status-codes'),
    path = require('path'),
    crypto = require('crypto'),
    fs = require('fs'),
    url = require('url'),
    bodyParser = require('body-parser'),
    sha1 = require('sha1');

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

// 
// qiniu api
// ========================================================
const {
    handle_req_upload_token
} = require('./utils/qiniu.js');


const {
    handle_new_uploaded_file
} = require('./utils/qiniu.js');

// ========================================================


// qcloud sms api
// ========================================================
const {
    handle_sms_auth_reqcode
} = require('./utils/sms.js');

const {
    handle_sms_auth_verifycode
} = require('./utils/sms.js');


// ========================================================


// wechat api
// ========================================================
const {
    get_access_token
} = require('./wechat/access_token.js');

const {
    init_menu
} = require('./wechat/init_menu.js');

const {
    handle_wechat_service_req
} = require('./wechat/handle_req.js');


const {
    get_access_token_lohogame
} = require('./wechat/access_token_lohogame.js');

const {
    init_menu_lohogame
} = require('./wechat/init_menu_lohogame.js');

const {
    handle_wechat_service_req_lohogame
} = require('./wechat/handle_req_lohogame.js');


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


const wechatLohogameConfig = require('./ssl/wechat_config_lohogame.json');
const wechatBrenderConfig = require('./ssl/wechat_config.json');
// const wechatConfig = {
//     //set your oauth redirect url, defaults to localhost
//     "wechatRedirectUrl": "https://brender.cn/api/wechat/bl_login_call_back",
//     "wechatToken": "xxx", //not necessary required
//     "appId": "xxx",
//     "appSecret": "xxx",
//     // card: true, //enable cards
//     // payment: true, //enable payment support
//     // merchantId: '', //
//     // paymentSandBox: true, //dev env
//     // paymentKey: '', //API key to gen payment sign
//     // paymentCertificatePfx: fs.readFileSync(path.join(process.cwd(), 'cert/apiclient_cert.p12')),
//     //default payment notify url
//     // paymentNotifyUrl: `http://your.domain.com/api/wechat/payment/`,
//     //mini program config
//     // "miniProgram": {
//     //     "appId": "mp_appid",
//     //     "appSecret": "mp_app_secret",
//     // }
// }

const wxBrender = new Wechat(wechatBrenderConfig);
const wxLohogame = new Wechat(wechatLohogameConfig);
const app = express();

// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


const start = () => {



    // --------------------------- echo ======================================= 

    app.get('/api', (req, res) => {
        logger.info('api echo : ' + req);
        res.send('Hello World!');
    });





    // --------------------------- qiniu ======================================= 

    app.post('/api/upload_token', (req, res) => {

        handle_req_upload_token(req, res);
    });



    app.post('/api/upload_callback', (req, res) => {

        handle_new_uploaded_file(req.body, res);
    });




    // --------------------------- wechat ======================================= 

// ============================== wechat validation ============================== 

    // app.get('/api/wechat/lohogame', (req, res) => {
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



    
    app.post('/api/wechat',(req,res) => {
        handle_wechat_service_req(req,res);
    });

    app.get('/api/wechat/access',async (req,res) => {

        await init_menu();
        var token = await get_access_token();

        res.json({token:token});
    });

    app.get('/api/wechat/get-signature', (req, res) => {
        wxBrender.jssdk.getSignature(req.query.url).then(signatureData => {
            res.json(signatureData);
        });
    });






    app.post('/api/wechat/lohogame',(req,res) => {
        handle_wechat_service_req_lohogame(req,res);
    });

    app.get('/api/wechat/lohogame/access',async (req,res) => {

        await init_menu_lohogame();
        var token = await get_access_token_lohogame();

        res.json({token:token});
    });



    app.get('/api/wechat/lohogame/get-signature', (req, res) => {
        wxLohogame.jssdk.getSignature(req.query.url).then(signatureData => {
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



    // --------------------------- sms ======================================= 

    app.get('/api/sms/reqcode', async (req,res) => {
        // logger.info('sms echo : ' + req);
        // res.send('reqcodeq SMS!');
        // params :
        // phone string list 
        // auth code string
        // timeout string
        var result = await handle_sms_auth_reqcode(req,res);
        res.send(result);
    });


    app.get('/api/sms/verifycode', async (req,res) => {
        // logger.info('sms echo : ' + req);
        // params :
        // phone string list 
        // auth code string
        // timeout string
        var result = await handle_sms_auth_verifycode(req,res);
        res.send(result);
    });



    // --------------------------- ready to go  ======================================= 

    app.listen(port, () => logger.info(`App listening on port ${port}!`));


};

const init = () => {
    logger('httpServer init');
}
exports.init = init;
exports.start = start;







// ============================== wechat validation ============================== 

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