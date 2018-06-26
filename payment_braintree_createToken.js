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

      let newCustomerResult, newCustomerCreation;
      if(event.body) {
        newCustomerResult = await gateway.customer.find(JSON.parse(event.body).oldCustomerID + ""); // harus string
        if(!newCustomerResult) {
          newCustomerCreation = await gateway.customer.create({});
          newCustomerResult = await gateway.customer.find(newCustomerCreation.customer.id);
        }
      } else {
        newCustomerCreation = await gateway.customer.create({});
        console.log(newCustomerCreation.customer.id)
        newCustomerResult = await gateway.customer.find(newCustomerCreation.customer.id);
      }
      
      /**
       * Alur kerja program ini:
       * 1. a. Jika dipanggil dari oldUser, maka mencoba cari customer dengan customer.id yang
       *       ditentukan page tersebut; jika tidak ada, maka buat data customer baru.
       *    b. Jika dipanggil dari newUser, maka membuat user baru, lalu mencari user tersebut
       *        - Tindakan ini dilakukan karena instance Dropin yang dipanggil di web page
       *          hanya melakukan credit check validation pada customer dimana customer.id-nya
       *          dipanggil dari gateway.customer.find() 
       * 3. Ambil customer yang ditemukan pencarian
       * 4. Buat instance Braintree.dropin
       * 5. Request cara pembayaran: jika user adalah customer lama maka pembayaran 
       *    sebelumnya akan tertera di instance tersebut
       * 6. Jika cara pembayaran belum ada, maka user harus memasukkan data pembayaran
       * 7. Dropin akan melakukan verifikasi terhadap kartu pembayaran yang telah dimasukkan,
       *    jika kartu tidak valid (https://developers.braintreepayments.com/reference/general/testing/node)
       *    maka akan ada notifikasi dari instance
       * 8. Jika kartu valid, akan diteruskan pada checkout
       * 9. Checkout akan melakukan suatu pembayaran yang nilainya berkisar dari 2000 ke 4000
       * 10. Jika nilai < 3000 maka transaksi akan gagal
       */

      const resp = await gateway.clientToken.generate({
          customerId: newCustomerResult.id,
          merchantAccountId: 'r6nh29dk3z8xykk9',    
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