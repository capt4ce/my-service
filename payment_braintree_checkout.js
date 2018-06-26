'use strict'
const braintree = require("braintree");

require('dotenv').load();
const gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY
});

exports.handler = async (event, context) => {
  console.log(event)

  const payload = JSON.parse(event.body)

  const result = await gateway.transaction.sale({
    amount: Math.floor(2000 + 2000 * Math.random()), // 50-50 success/fail
    paymentMethodNonce: payload.nonce,
    options: {
      submitForSettlement: true,
      threeDSecure: {
        required: false,
      },
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}