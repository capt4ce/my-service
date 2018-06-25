'use strict'

const gateway = require('./lib/gateway.js');

exports.handler = async (event, context) => {
  console.log(event)

  const payload = JSON.parse(event.body)

  const result = await gateway.transaction.sale({
    amount: "10.00",
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