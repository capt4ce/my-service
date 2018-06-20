'use strict'

const AWS = require("aws-sdk");

AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://localhost:8000"
});

const dynamoDB = new AWS.DynamoDB();

exports.handler = async (event, context) => {
    const params = {
        // TableName : "Movies",
        // KeySchema: [       
        //     { AttributeName: "year", KeyType: "HASH"},  //Partition key
        //     { AttributeName: "title", KeyType: "RANGE" }  //Sort key
        // ],
        // AttributeDefinitions: [       
        //     { AttributeName: "year", AttributeType: "N" },
        //     { AttributeName: "title", AttributeType: "S" }
        // ],
        TableName : "News",
        KeySchema: [       
            { AttributeName: "dateFloor", KeyType: "HASH"},         
            //Partition key - pengelompokan data berdasarkan penanggalan, diset sebagai floor(Date.now() / 850 juta)
            //              - sehingga berita terletak dalam satu partisi berjarak < 9,84 hari from one another
            { AttributeName: "dateExact", KeyType: "RANGE"}         
            //Sort key      - berisi data waktu untuk pengurutan berita, diset sebagai Date.now()
        ],
        AttributeDefinitions: [
            { AttributeName: "dateFloor", AttributeType: "N"},
            { AttributeName: "dateExact", AttributeType: "N"},
        ],
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