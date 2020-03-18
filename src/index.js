'use strict';
const config = require('./config.js');

const { logger } = require('./utils/logger.js'); // require module as logger not the object inside which required by {logger}

// const DB = require('./utils/db.js');

const httpServer = require('./http_server.js');


const test_amqp = require('./test_amqp.js');


const do_init = async () => {

    // process.env.NODE_ENV = 'production';

    var myid = process.env.nodeid;
    logger.info('my id : ' + myid);

    var redisHost = process.env.redishost;
    var redisPort = process.env.redisport;
    var redisPass = process.env.redispass;
    // for dev only =============  =============
    // export NODE_ENV=production


    var dbHost = process.env.dbhost;
    var dbPort = process.env.dbport;
    var dbUser = process.env.dbuser;
    var dbPass = process.env.dbpass;
    var dbName = process.env.dbname;
    var resp = await DB.init(dbHost, dbPort, dbUser, dbPass, dbName);
    // logger.info(JSON.stringify(resp));
    return resp;

};

const start = () => {
    logger.info('init done , start');
    httpServer.start();

    test_amqp.test();
};

const init = async () => {
    var res;
    // var res = await do_init();
    logger.info('node dev init with : ' + JSON.stringify(res));
    start();
}

init();