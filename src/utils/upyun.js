const {
    hashhash
} = require('./crypt.js');

const {
    dehashhash
} = require('./crypt.js');


const getUpyunUploadFileSec = (datatosecret) => {
    return hashhash(datatosecret)
}

exports.getUpyunUploadFileSec = getUpyunUploadFileSec;