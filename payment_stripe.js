'use strict'

const stripe = require("stripe");
const queryString = require("querystring");

exports.handler = async (event, context) => {
    let stripeCurrent = new stripe("sk_test_BQokikJOvBiI2HlWgH4olfQ2");
    let params = queryString.parse(event.body)
    if(params.apiKey) {
        stripeCurrent = new stripe(params.apiKey)
    }
    try {
        const charge = await stripeCurrent.charges.create({
            amount: 200,
            currency: 'usd',
            description: 'Example charge',
            source: params['stripeToken'],
            metadata: {order_id: 6735},
        })
        return {
            statusCode: 200,
            body: charge
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `${err}`,
            })
        }
    }
}
