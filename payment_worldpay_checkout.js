'use strict'
require('dotenv').load();
const queryString = require("querystring");

exports.handler = async (event, context) => {
  try {
    const paymentBody = queryString.parse(event.body);
    paymentBody.orderDescription = `${JSON.stringify(context.identity)},${Date.now()},${paymentBody.amount}`; // csv format
    return await fetch("https://api.worldpay.com/v1/orders", {
      method: "POST",
      headers: {
        'Authorization': process.env.WP_SERVICE_KEY,
        'Content-type': "application/json",
      },
      body: JSON.stringify(paymentBody),
    })
  } catch(err) {
    return {
      statusCode: 400,
      body: JSON.stringify(err)
    }
  }
}
