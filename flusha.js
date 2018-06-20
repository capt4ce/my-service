'use strict'
const redis = require("redis"),
    client = redis.createClient(); // don't forget to set up redis server first, by sudo service redis_6379 start
const {promisify} = require('util');
const flushAsync = promisify(client.flushall).bind(client);
exports.handler = async (event, context) => {
    console.log('Received event', JSON.stringify(event, 3));
    console.log('Received context', JSON.stringify(context, 3));
    try {
        await flushAsync();
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `${err}`,
            }),
        }
    }

    if(!event.queryStringParameters) { // ke branch ini kalo tidak ada parameter yang ditentukan
        return {
            statusCode: 200,
            body: JSON.stringify({
                statusCode: 200,
                message: "Redis server memory royally flushed.",
            }),
            // body: JSON.stringify(event),
        }
    }
    return {
        statusCode: 200,
        // body: JSON.stringify({
        //     statusCode: 200,
        //     message: "Redis server memory royally flushed.",
        // }),
        body: JSON.stringify(event),
    }
}