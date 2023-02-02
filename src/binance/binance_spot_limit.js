import "dotenv/config";
import {Spot} from '@binance/connector';
import {CronJob} from 'cron';
import {createOrderInDB, getBotInfo} from "../db_requests.js";

const TIME_IN_FORCE = 'GTC';
const USDT_UAH = 'USDTUAH';
const BINANCE_PLATFORM_DB_ID = '27db0bcd-0ff4-4b54-9564-02b242742454'

const createSellOrder = ({client, price, quantity}) =>
    client.newOrder(USDT_UAH, 'SELL', 'LIMIT', {
        price,
        quantity,
        timeInForce: TIME_IN_FORCE
    })

const createBuyOrder = ({client, price, quantity}) => client.newOrder(USDT_UAH, 'BUY', 'LIMIT', {
    price,
    quantity,
    timeInForce: TIME_IN_FORCE
})

const client = new Spot("b0oAIiuWAvLDfEAB1eAEWZ8AyBNnwagYBZK2GpirX8Ao0NNzZg9Z599pDiMlJKEd",
    "UNWbaI6H9OonPbGcrU6EAUOD02zBTxpJllo4E2iKjm9PjLGqqvzRsMUck387IoMy")

const BOT_ID = "b28ddd30-3763-4e57-968f-d2399ae24385";

// createOrder = async ({ id, botId, isBuy, platformForeignId, sum })

const binanceSpotLimitTrade = async () => {
    let isFirstLoad = true;
    let isCurrentOpenOrderBuy = false;
    let currentOrderId  = null;

    //// TODO: will implement logic with if sell first
    // if(isFirstLoad){
    //     const botInfo = await getBotInfo({ id: BOT_ID })
    //     createBuyOrder(({client, price: botInfo.buyPrice, quantity: botInfo.buyQuantity})).then(({data}) => {
    //         isFirstLoad = false
    //         isCurrentOpenOrderBuy = false;
    //         currentOrderId = data.orderId
    //         createOrderInDB({id: data.id, botId: BOT_ID, isBuy: true, platformForeignId: BINANCE_PLATFORM_DB_ID, sum: botInfo.buyQuantity})
    //     }).catch(e => {
    //         isFirstLoad = true;
    //         isCurrentOpenOrderBuy = true;
    //         console.log("Buy failed", e);
    //     })
    // }

    if(isFirstLoad){
        const botInfo = await getBotInfo({ id: BOT_ID })
        createSellOrder(({client, price: botInfo.sellPrice, quantity: botInfo.buyQuantity})).then(({data}) => {
            isFirstLoad = false
            isCurrentOpenOrderBuy = true;
            currentOrderId = data.orderId
            createOrderInDB({id: data.id, botId: BOT_ID, isBuy: false, platformForeignId: BINANCE_PLATFORM_DB_ID, sum: botInfo.buyQuantity})
            console.log("First Sell order created", data);
        }).catch(e => {
            isFirstLoad = true;
            isCurrentOpenOrderBuy = false;
            console.log("Sell failed", e);
        })
    }

    const trade = () => {
        client.getOrder(USDT_UAH, {
            orderId: currentOrderId
        }).then(async ({ data }) => {
            console.log(`get order: ${ new Date() }`, {data, currentOrderId})
            if(data.status === "FILLED" && isCurrentOpenOrderBuy){
                const botInfo = await getBotInfo({ id: BOT_ID })
                createSellOrder(({client, price: botInfo.sellPrice, quantity: botInfo.buyQuantity})).then(({data}) => {
                    currentOrderId = data.orderId;
                    isCurrentOpenOrderBuy = true;
                    createOrderInDB({id: data.id, botId: BOT_ID, isBuy: false, platformForeignId: BINANCE_PLATFORM_DB_ID, sum: botInfo.buyQuantity})
                    console.log("Sell order created", data);
                }).catch(err => {
                    isCurrentOpenOrderBuy = false;
                    console.log("Sell failed", err);
                });
            }

            if(data.status === "FILLED" && !isCurrentOpenOrderBuy){
                const botInfo = await getBotInfo({ id: BOT_ID })
                createBuyOrder(({client, price: botInfo.buyPrice, quantity: botInfo.buyQuantity})).then(({data}) => {
                    isCurrentOpenOrderBuy = false;
                    currentOrderId = data.orderId
                    createOrderInDB({id: data.id, botId: BOT_ID, isBuy: true, platformForeignId: BINANCE_PLATFORM_DB_ID, sum: botInfo.buyQuantity})
                    console.log("Buy order created", data);
                }).catch(e => {
                    isFirstLoad = true;
                    isCurrentOpenOrderBuy = true;
                    console.log("Buy failed", e);
                })
            }}).catch(error => console.log(error))

    };

    const job = new CronJob(
        '*/1 * * * *', // cronTime, every minute
        trade, // onTick callback
        // null, // onComplete callback when job.stop() was executed
        // true, // start job, but does not fire onTick immediately
        // see other params https://www.npmjs.com/package/cron, or delete all comments
    );

    job.start();
    // job.stop();
}

export default binanceSpotLimitTrade;
