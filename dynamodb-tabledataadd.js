'use strict'

const AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    let now = Date.now();
    if(!event.queryStringParameters) {
        return fourhundred("No query found.");
    }
    if(!event.queryStringParameters.title || !event.queryStringParameters.content) {
        return fourhundred("Title and/or content missing.");
    }
    const params = (current) => {
        return {
            TableName: "News",
            Item: {
                "dateFloor": Math.floor(current / 850000000),
                "dateExact": current,
                "tag": event.queryStringParameters.tag || [],         // diharapkan keluaran array, protection available
                "info": {
                    "title": event.queryStringParameters.title,
                    "content": event.queryStringParameters.content,
                    "image": event.queryStringParameters.image || "",  
                }   
            }
        }
    }
    try {
        while(false) {  // replace this with checking whether someone is writing a news entry at this point
            await new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 1000)
            });
            now = Date.now()  // ensure uniqueness
        } 
        await docClient.put(params(now)).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `News of "${event.queryStringParameters.title}" on the ${params.TableName} table successfully added with timestamp ${now}.`,
                content: event.queryStringParameters.content,
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