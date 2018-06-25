'use strict'

const braintree = require("braintree");

require('dotenv').load();

exports.handler = async (event, context) => {
    try {
      const gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: process.env.BT_MERCHANT_ID,
        publicKey: process.env.BT_PUBLIC_KEY,
        privateKey: process.env.BT_PRIVATE_KEY
      });
      
      const resp = await gateway.clientToken.generate({
          customerId: 558971619,          // untuk sementara
          merchantAccountId: 'r6nh29dk3z8xykk9',   // untuk sementara
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify(resp)
      }
    } catch(err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
            message: `${err}`,
        })
      }
    }
}