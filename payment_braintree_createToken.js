'use strict'

const braintree = require("braintree");

exports.handler = async (event, context) => {
    const gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: "",
        publicKey: "",
        privateKey: "",
      });
      
    const resp = gateway.clientToken.generate({
          customerId: "sampleCustomer",
        });
}