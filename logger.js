const pino = require("pino");
const streams = [{
    level: "trace",
    stream: process.stdout,},
    {
        level: "trace",
        stream: pino.destination("logs/server-log") }];
const logger = pino({ level: "info"} ,pino.multistream(streams)); 

module.exports = logger;