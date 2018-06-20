'use strict'
const redis = require("redis"),
    client = redis.createClient(); // don't forget to set up redis server first, by sudo service redis_6379 start
const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);
const existsAsync = promisify(client.exists).bind(client);
const setAsync = promisify(client.set).bind(client);

exports.handler = async (event, context) => {
    var timeOutSpec = 30; // waktu hidup cache
    try {
        if(await existsAsync("PI:data")) {
            // value exists, roll the dice to determine whether this instance refresh the cache
            const beta = 1; 
            
            /**
             * beta = 1     => kemungkinan cache refresh adalah 0.37 untuk ttl = delta dan 0.61 untuk ttl = delta / 2.
             * beta = 2     => kemungkinan cache refresh adalah 0.61 untuk ttl = delta dan 0.78 untuk ttl = delta / 2.
             * beta = 0.5   => kemungkinan cache refresh adalah 0.14 untuk ttl = delta dan 0.37 untuk ttl = delta / 2.
             */
            const delta = 14700; // hasil dari percobaan, dalam ms
            const last = await getAsync("PI:last");
            const ttl = timeOutSpec * 1000 + +last;
            const randomValue = Date.now() - delta * beta * Math.log(Math.random());
            console.log(randomValue);
            console.log(ttl);
            if (randomValue >= ttl) { 
                const dataInput = makeData();
                setAsync("PI:data", dataInput, "EX", timeOutSpec);
                setAsync("PI:last", Date.now());
                console.log("Cache direfresh saat ada data valid dalam cache.");
            } else {
                console.log("Mengambil data dari cache.");
                // ambil data dari sini
                let leftout = await getAsync("PI:last");
                leftout = +leftout;
                leftout += 1000 * timeOutSpec - Date.now();
                console.log(`Cache aktif untuk ${leftout} ms.`)
            }
        } else { // kalo engga ada maka ttl = 0
            // value don't exist, *must* create the key/value cache
            const dataInput = makeData();
            setAsync("PI:data", dataInput, "EX", timeOutSpec);
            setAsync("PI:last", Date.now());
            console.log("Membuat ulang data karena tidak ada cache.");
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `${err}`,
            }),
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify({
            statusCode: 200,
            message: "Proses berhasil. Silahkan lihat console log.",
        }),
        // body: JSON.stringify(event),
    }
}

function makeData() { // dicek di calcualte.js dengan command "node calculate.js", kisaran 14700ms prosesnya
    let result = 0;
    let time = Date.now();
    for(let i = 0; i < 100000000; i++) {
        // hitung dari 4*arctan(1/5) - arctan(1/239)
        result += (4 * (0.2 ** (2 * i + 1)) / (2 * i + 1) - ((1 / 239) ** (2 * i + 1)) / (2 * i + 1)) * (-1) ** i;
    }
    console.log(Date.now() - time);
    return 4 * result; // should return something close to pi
}