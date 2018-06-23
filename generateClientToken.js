'use strict'

const gateway = require('./lib/gateway');

exports.handler = (event, context, callback) => {
  gateway.clientToken.generate({}, function (err, response) {
    const res = {
      clientToken: response.clientToken,
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(res)
    })
  });
}