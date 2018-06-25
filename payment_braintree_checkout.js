'use strict'

const gateway = require('./lib/gateway.js');

exports.handler = async (event, context) => {
  console.log(event)

  const payload = JSON.parse(event.body)

  const result = await gateway.transaction.sale({
    amount: Math.floor(2000 + 2000 * Math.random()), // 50-50 success/fail
    paymentMethodNonce: payload.nonce,
    options: {
      submitForSettlement: true
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}