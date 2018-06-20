'use strict'
var redis = require("redis"),
    client = redis.createClient(); // don't forget to set up redis server first, by sudo service redis_6379 start
const {promisify} = require('util');
redis.debug_mode = true;
const zinterAsync = promisify(client.zinterstore).bind(client);
// client.zinterstore("interset", 3, "nodeListCPU", "nodeListRAM", "nodeList", "WEIGHT", 4, 2, 1)

exports.handler = async (event, context) => {
    try {
        await zinterAsync("interset", 2, "nodes:byCpu", "nodes:byTcpConn", "WEIGHTS", 2, 1);
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
            message: "Intersection of node successfully created in 'interset' key.",
        }),
    }
}