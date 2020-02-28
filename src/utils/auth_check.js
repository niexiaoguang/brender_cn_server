function md5(data) {
    let hash = crypto.createHash('md5');
    return hash.update(data).digest('hex');
};

const auth_req = (req) => {
    // body...
    var uuid = req.headers['uuid'];
    var ts = req.headers['ts'];
    var fuid = req.headers['fuid'];
    console.log('authReq result : ' + md5(md5(uuid + ts)));
    var res = new String(fuid).valueOf() == new String(md5(md5(uuid + ts))).valueOf()
    return true;

};

const auth_req1 = (req) => {
    return true;
}
// -----------------------------------------------------------

const check_uuid = (uuid) => {
    return true;
}

// -----------------------------------------------------------

const check_req_body = (req) => {
    return true;
}


exports.auth_req = auth_req;
exports.auth_req1 = auth_req1;
exports.check_req_body = check_req_body;
exports.check_uuid = check_uuid;