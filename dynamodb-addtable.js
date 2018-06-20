'use strict'

const AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

const dynamoDB = new AWS.DynamoDB();

exports.handler = async (event, context) => {
    const params = {
        TableName : "Movies",
        KeySchema: [       
            { AttributeName: "year", KeyType: "HASH"},  //Partition key
            { AttributeName: "title", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        // TableName : "Real Newz",
        // KeySchema: [       
        //     { AttributeName: "date", KeyType: "HASH"},       //Partition key
        //     { AttributeName: "title", KeyType: "RANGE"},     //Sort key
        //     { AttributeName: "content", KeyType: "RANGE"},   //Sort key
        //     { AttributeName: "imageURL", KeyType: "RANGE" }, //Sort key
        // ],
        // AttributeDefinitions: [       
        //     { AttributeName: "date", AttributeType: "N"},
        //     { AttributeName: "title", AttributeType: "S"},    
        //     { AttributeName: "content", AttributeType: "S"},   
        //     { AttributeName: "imageURL", AttributeType: "S"},  
        // ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 10
        },
    };

    try {
        const addTable = await dynamoDB.createTable(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `${params.TableName} table successfully added.`,
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