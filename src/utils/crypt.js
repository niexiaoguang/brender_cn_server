const md5 = require("blueimp-md5");

const Hashids = require('hashids/cjs')


const salt = '2aiA3B8ge9ypyuXh';

const { crypt_config } = require('../ssl/crypt_config.js')

const hashids = new Hashids(crypt_config.salt);


const simple_hash_with_salt = (raw, salt) => {
    return md5(raw + salt).substring(8, 24);

}

const hashhash = (rawhash) => {



    var hex = Buffer.from(rawhash).toString('hex');
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

    var string = Buffer.from(decodedHex, 'hex').toString('utf8');
    // console.log(string); // 'Hello World'
    return string;
}
const make_uuid_by_openid = (raw) => {
    return md5(raw).substring(8, 24);
}


const fuidJsonFileKeySalt = 'brender_projcet_json';
const fuidFileKeySalt = 'brender_project';
const imageFileKeySalt = 'brender_img';

exports.fuidJsonFileKeySalt = fuidJsonFileKeySalt;
exports.fuidFileKeySalt = fuidFileKeySalt;
exports.imageFileKeySalt = imageFileKeySalt;
exports.hashhash = hashhash;
exports.dehashhash = dehashhash;

exports.simple_hash_with_salt = simple_hash_with_salt;
exports.make_uuid_by_openid = make_uuid_by_openid;