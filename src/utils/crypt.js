const md5 = require("blueimp-md5");

const Hashids = require('hashids/cjs')


const salt = '2aiA3B8ge9ypyuXh';


const hashids = new Hashids(salt);

const hashhash = (rawhash) => {



    var hex = Buffer(rawhash).toString('hex');
    // console.log(hex); // '48656c6c6f20576f726c64'

    var encoded = hashids.encodeHex(hex);
    // console.log(encoded); // 'rZ4pPgYxegCarB3eXbg'

    // var decodedHex = hashids.decodeHex('rZ4pPgYxegCarB3eXbg');
    // console.log(decodedHex); // '48656c6c6f20576f726c64'

    // var string = Buffer('48656c6c6f20576f726c64', 'hex').toString('utf8');
    // console.log(string); // 'Hello World'


    return encoded;
}

const dehashhash = (rawhash) => {
    var decodedHex = hashids.decodeHex(rawhash);
    // console.log(decodedHex); // '48656c6c6f20576f726c64'

    var string = Buffer(decodedHex, 'hex').toString('utf8');
    // console.log(string); // 'Hello World'
    return string;


}
const make_uuid_by_openid = (raw) => {
    return md5(raw).substring(8, 24);


}


const sha1 = (str) => {
    var md5sum = crypto.createHash("sha1");
    md5sum.update(str);
    str = md5sum.digest("hex");
    return str;
}

exports.make_uuid_by_openid = make_uuid_by_openid;
exports.sha1 = sha1;
exports.hashhash = hashhash;