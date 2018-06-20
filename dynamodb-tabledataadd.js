'use strict'

const AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    const now = Date.now();
    if(!event.queryStringParameters) {
        return fourhundred("No query found.");
    }
    if(!event.queryStringParameters.title || !event.queryStringParameters.content) {
        return fourhundred("Title and/or content missing.");
    }
    const params = {
        TableName: "News",
        Item: {
            "dateFloor": Math.floor(now / 850000000),
            "dateExact": now,
            "tag": event.queryStringParameters.tag || [],         // diharapkan keluaran array, protection available
            "info": {
                "title": event.queryStringParameters.title,
                "content": event.queryStringParameters.content,
                "image": event.queryStringParameters.image || "",  
            }   
        }
    }
    try {
        await docClient.put(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `News of "${params.Item.info.title}" on the ${params.TableName} table successfully added with timestamp ${now}.`,
                content: params.Item.info.content,
            }),
        }
    } catch(err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `${err}`,
            }),
        }
    }
}

function fourhundred(errmes) {
    return {
        statusCode: 400,
        error: "Bad Request",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: errmes + "",
        }),
    }
}