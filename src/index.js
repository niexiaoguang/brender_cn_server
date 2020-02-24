'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const port = process.env.PORT || 3000;
const { Wechat } = require('wechat-jssdk');

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

app.get('/api', (req, res) => res.send('Hello World!'));


app.get('/api/wechat/get-signature', (req, res) => {
  wx.jssdk.getSignature(req.query.url).then(signatureData => {
    res.json(signatureData);
  });
});



app.listen(port, () => console.log(`App listening on port ${port}!`));


