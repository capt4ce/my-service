'use strict'

const ioRedis = require("ioredis");
const redis = new ioRedis(); // sudah jadi tukang janji
const pipe = redis.pipeline();
var timeOutSpec = 30;

// adakan suatu queryStringParameters untuk enable locking mechanism

exports.handler = async (event, context) => {
    try {
        // process parameter
        const beta = 1;
        const response = await pipe.exists("pi:data").get("pi:delta").get("pi:last").exists("pi:lock").exec();
        
        // variable allocation
        let [err0, cacheExists] = response[0];
        if (err0) {
            throw new Error('Problem receiving pi:data.')
        }
        let [err1, delta] = response[1];
        if (err1) {
            throw new Error('Problem receiving pi:delta.')
        }
        delta = +delta;
        let [err2, last] = response[2];
        if (err2) {
            throw new Error('Problem receiving pi:last.')
        }
        last = +last;
        let [err3, isLocked] = response[3];
        if (err3) {
            throw new Error('Problem receiving pi:lock.');
        }
        
        // process decision
        const recall = (Date.now() - delta * beta * Math.log(Math.random())) >= (timeOutSpec * 1000 + last);
        if (!cacheExists) {
            
            // miss
            if (isLocked) {
                let stillLocked = isLocked;
                do {
                    stillLocked = await redis.exists("pi:lock");
                    if(!stillLocked) {
                        let [errCacheRead, readLast] = await redis.get("pi:last");
                        if(errCacheRead) {
                            throw errCacheRead;
                        }
                        return {
                            statusCode: 200,
                            body: JSON.stringify({
                                message: `Mengambil data dari cache (melewati loop); sisa waktu aktif cache adalah ${timeOutSpec * 1000 + readLast - Date.now()} ms.`,
                            }),
                        }
                    }
                    
                    // do timeout 500 ms
                    await new Promise((resolve, reject) => {
                        setTimeout(() => resolve(), 500)
                      });

                } while(stillLocked)
            }
            
            // make new entry on Redis
            uploadToRedis(makeData(), event.queryStringParameters);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Mencache data karena cache tidak ada atau habis masa berlakunya.`,
                }),
            }
        } else if (recall) {
            
            // early
            if (isLocked) {
                
                // ducked
                let [errCacheRead, readLast] = await redis.get("pi:last");
                if(errCacheRead) {
                    throw errCacheRead;
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: `Mengambil data dari cache (ada yang menulis cache); sisa waktu aktif cache adalah ${timeOutSpec * 1000 + readLast - Date.now()} ms.`,
                    }),
                }
            }
            
            // early recompute
            uploadToRedis(makeData(), event.queryStringParameters);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Merefresh data pada cache walau cache belum habis masa berlakunya.`,
                }),
            }
        } else {
            
            // hit

            let [errCacheRead, readLast] = await redis.get("pi:last");
                if(errCacheRead) {
                    throw errCacheRead;
                }
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `Mengambil data dari cache; sisa waktu aktif cache adalah ${timeOutSpec * 1000 + readLast - Date.now()} ms.`,
                }),
            }
        }

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `${err}`,
            }),
        }
    }
}

function uploadToRedis(data, lock) {
    if(lock) {
        redis.setnx("pi:lock","iya, dilock");
    }
    pipe.set("pi:data", +data.hasilHitung ,"EX", timeOutSpec);
    pipe.set("pi:delta", +data.waktuHitung, "EX", timeOutSpec);
    pipe.set("pi:last", Date.now());
    pipe.exec();
    if(lock) {
        redis.del("pi:lock");
    }
}

function makeData() {
    let result = 0;
    const startTime = Date.now();
    for(let i = 0; i < 100000000; i++) {
        // hitung dari 4*arctan(1/5) - arctan(1/239)
        result += (4 * (0.2 ** (2 * i + 1)) / (2 * i + 1) - ((1 / 239) ** (2 * i + 1)) / (2 * i + 1)) * (-1) ** i;
    }
    
    return {
        hasilHitung: 4 * result,                // should return something close to pi
        waktuHitung: Date.now() - startTime,    // return delta
    };
}