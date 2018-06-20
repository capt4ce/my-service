'use strict'

const AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    let dateHash = Math.floor(Date.now() / 850000000)
    if(event.queryStringParameters && +event.queryStringParameters.dateHash) {
        dateHash = +event.queryStringParameters.dateHash;
    }
    const params = {
        TableName: "News",
        ProjectionExpression: "dateExact, tag, info",
        KeyConditionExpression: "dateFloor = hashDate",
        ExpressionAttributeValues: {
            "hashDate": dateHash,
        },
    }
    try {
        const result = await docClient.query(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `${result}`,
                dataDate: `${dateHash}`,
            }),
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `${err}`,
            }),
        }
    }
}