'use strict'
// https://www.digitalocean.com/community/tutorials/how-to-install-and-use-redis 
// https://github.com/NodeRedis/node_redis
var redis = require("redis"),
    client = redis.createClient(); // don't forget to set up redis server first, by sudo service redis_6379 start
const {promisify} = require('util');
const zaddAsync = promisify(client.zadd).bind(client);
const setexAsync = promisify(client.setex).bind(client);
const timeAsync = promisify(client.time).bind(client);
const hsetAsync = promisify(client.hset).bind(client);

exports.handler = async (event, context) => {
    if(!event.queryStringParameters) {
        return {
            statusCode: 400,
            error: "Bad Request",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                statusCode: 400,
                error: "Bad Request",
                message: "No query found.",
            }),
        }
    }
    const cpu = +event.queryStringParameters.cpuUsage;
    const tcp = +event.queryStringParameters.tcpConn;
    const mac = event.queryStringParameters.macHash + "";
    
    if(!validData(cpu, tcp, mac)) {
        return {
            statusCode: 400,
            error: "Bad Request",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                statusCode: 400,
                error: "Bad Request",
                message: "Wrong request syntax.",
            }),
        }
    }

    try {
        var time = await timeAsync();
        await setexAsync(`node:${mac}:last`, 120, time[0]);

        await hsetAsync(`node:${mac}`, "IP", event.requestContext.identity.sourceIp);
        // await hsetAsync(mac+":<id>", "port", port dari node);

        const score = cpu * 20 + tcp * 2 // tentatif

        await zaddAsync("nodes:byScore", score, mac);
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
            message: "Entry added.",
            addedEntry: {
                "Mac Address": mac,
                "CPU Usage": cpu,
                "TCP Connection": tcp,
            }
        }),
    }
}

function validData(sampleCPU, sampleTCP, sampleMAC) {
    const noNull = sampleCPU !== null && sampleTCP !== null && sampleMAC !== null;
    const valueCompliance = sampleCPU >= 0 && sampleCPU <= 100 && sampleTCP >= 0;
    return valueCompliance && noNull;
}