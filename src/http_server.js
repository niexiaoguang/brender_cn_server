'use strict';


const express = require('express'),
    HttpStatus = require('http-status-codes'),
    path = require('path'),
    crypto = require('crypto'),
    fs = require('fs'),
    url = require('url'),
    bodyParser = require('body-parser');

const { logger } = require('./utils/logger.js'); // require module as logger not the object inside which required by {logger}

const jsonParser = bodyParser.json();

// const { logger } = require('./tools/logger.js');

const port = process.env.PORT || 3000;

const { Wechat } = require('wechat-jssdk');

const { sha1 } = require('./utils/crypt.js');

const { get_upload_token } = require('./utils/qiniu.js');



const wechatConfig = {
    //set your oauth redirect url, defaults to localhost
    "wechatRedirectUrl": "http://brender.cn/api/wechat/",
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
        console.log('request upload token' + req);
        var uploadToken = get_upload_token();
        // console.log(uploadToken);
        res.send(uploadToken);
    });


    app.get('/api', (req, res) => {
        console.log('api echo : ' + req);
        res.send('Hello World!')
    });


    app.get('/api/wechat/get-signature', (req, res) => {
        wx.jssdk.getSignature(req.query.url).then(signatureData => {
            res.json(signatureData);
        });
    });

    app.get('/api/wechat/login_call_back', (req, res) => {
        console.log('login call back with req : ' + JSON.stringify(req));
        wx.jssdk.getSignature(req.query.url).then(signatureData => {
            console.log(signatureData);
            res.json(signatureData);
        });
    });





    // app.get('/api/wechat/token_validate', (req, res) => {
    //     var query = url.parse(req.url, true).query;
    //     //console.log("*** URL:" + req.url);
    //     //console.log(query);
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
    //     console.log("Original str : " + original);
    //     console.log("Signature : " + signature);
    //     var scyptoString = sha1(original);
    //     if (signature == scyptoString) {
    //         res.send(echostr);
    //         console.log("Confirm and send echo back");
    //     } else {
    //         res.send("false");
    //         console.log("Failed!");
    //     }
    // });

    app.listen(port, () => console.log(`App listening on port ${port}!`));


};

const init = () => {
    logger('httpServer init');
}
exports.init = init;
exports.start = start;