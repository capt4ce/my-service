'use strict'
var redis = require("redis"),
    client = redis.createClient(); // don't forget to set up redis server first, by sudo service redis_6379 start
const {promisify} = require('util');
const zunionAsync = promisify(client.zunionstore).bind(client);
redis.debug_mode = true;
exports.handler = async (event, context) => {
    try {
        await zunionAsync("unionset", 2, "nodes:byCpu", "nodes:byTcpConn", "WEIGHTS", 1, 2);
    } catch (err) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `${err}`,
            }),
        }
    }
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            statusCode: 200,
            message: "Intersection of node successfully created in 'unionset' key.",
        }),
    }
}