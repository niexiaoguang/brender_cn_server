// const { createLogger, format, transports } = require('winston');

var ts = new Date().getTime();

// const logger = createLogger({
//     level: 'info',
//     format: format.combine(
//         format.timestamp({
//             format: 'YYYY-MM-DD HH:mm:ss'
//         }),
//         format.errors({ stack: true }),
//         format.splat(),
//         format.json()
//     ),
//     defaultMeta: { service: 'brender_node_render' },
//     transports: [
//         //
//         // - Write to all logs with level `info` and below to `quick-start-combined.log`.
//         // - Write all logs error (and below) to `quick-start-error.log`.
//         // config.logPath is ./log , according project path not the logger file path which in ./tools/  TODO
//         new transports.File({ filename: process.env.logpath + 'brender_node_render-error-' + ts + '.log', level: 'error' }),
//         new transports.File({ filename: process.env.logpath + 'brender_node_render-combined-' + ts + '.log' })
//     ]
// });

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
// if (process.env.NODE_ENV !== 'production') {
//     logger.add(new transports.Console({
//         format: format.combine(
//             format.colorize(),
//             format.simple()
//         )
//     }));
// }

// test only TODO
const logger = {};
logger.info = function(info) {
    console.log(info);
};

exports.logger = logger;