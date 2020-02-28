const sha1 = (str) => {
    var md5sum = crypto.createHash("sha1");
    md5sum.update(str);
    str = md5sum.digest("hex");
    return str;
}


exports.sha1 = sha1;