'use strict'
const redis = require("redis"),
    client = redis.createClient(); // don't forget to set up redis server first, by sudo service redis_6379 start
const {promisify} = require('util');
const sortAsync = promisify(client.sort).bind(client);

exports.handler = async (event, context) => {
    const result = await sortAsync("nodes:byScore", "BY", "nosort", "GET", "node:*->IP", "GET", "node:*:last");

    const activeNodes = []
    for (let i = 0; i < result.length; i += 2) {
        if (result[i+1]) {
            activeNodes.push({
                ip: result[i],
                port: 6389,
                lastActive: `${new Date(result[i+1])}`,
            });
        }
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(activeNodes),
    }
}