import "dotenv/config";
import {Spot} from '@binance/connector';
import {closeOrderInDB, createOrderInDB, getBotInfo} from "../db_requests.js";

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

const binanceSpotLimitTrade = async () => {
    let isFirstLoad = true;
    let isCurrentOpenOrderBuy = false;
    let currentOrderId  = null;

    // TODO: will implement logic with if sell first
    // if(isFirstLoad){
    //     const botInfo = await getBotInfo({ id: BOT_ID })
        // createBuyOrder(({client, price: botInfo.buyPrice, quantity: botInfo.buyQuantity})).then(({data}) => {
        //     isFirstLoad = false
        //     isCurrentOpenOrderBuy = false;
        //     currentOrderId = data.orderId
        //     createOrderInDB({id: data.id, botId: BOT_ID, isBuy: true, platformForeignId: BINANCE_PLATFORM_DB_ID, sum: botInfo.buyQuantity})
        // }).catch(e => {
        //     isFirstLoad = true;
        //     isCurrentOpenOrderBuy = true;
        //     console.log("Buy failed", e);
        // })
    // }

    if(isFirstLoad){
        const botInfo = await getBotInfo({ id: BOT_ID })
        createSellOrder(({client, price: botInfo.sellPrice, quantity: botInfo.buyQuantity})).then(({data: sellOrderData}) => {
            isFirstLoad = false
            isCurrentOpenOrderBuy = false;
            currentOrderId = sellOrderData.orderId;
            createOrderInDB({
                id: sellOrderData.orderId,
                botId: BOT_ID,
                isBuy: false,
                platformForeignId: BINANCE_PLATFORM_DB_ID,
                sum: botInfo.buyQuantity,
                fee: sellOrderData.fills?.[0]?.commission,
                feeAsset: sellOrderData.fills?.[0]?.commissionAsset
            })
            console.log("First Sell order created", sellOrderData);
        }).catch(e => {
            isFirstLoad = true;
            isCurrentOpenOrderBuy = true;
            console.log("Sell failed", e);
        })
    }

    setInterval(() => {
        client.getOrder(USDT_UAH, {
            orderId: currentOrderId
        }).then(async ({ data }) => {
            console.log(`get order: ${ new Date() }`, {data, currentOrderId})
            if(data.status === "FILLED" && isCurrentOpenOrderBuy){
                const botInfo = await getBotInfo({ id: BOT_ID })
                closeOrderInDB({id: currentOrderId})
                createSellOrder(({client, price: botInfo.sellPrice, quantity: botInfo.buyQuantity})).then(({data: sellOrderData}) => {
                    currentOrderId = sellOrderData.orderId;
                    isCurrentOpenOrderBuy = false;
                    createOrderInDB({
                        id: sellOrderData.orderId,
                        botId: BOT_ID,
                        isBuy: false,
                        platformForeignId: BINANCE_PLATFORM_DB_ID,
                        sum: botInfo.buyQuantity,
                        fee: sellOrderData.fills?.[0]?.commission,
                        feeAsset: sellOrderData.fills?.[0]?.commissionAsset
                    })
                    console.log("Sell order created", sellOrderData);
                }).catch(err => {
                    isCurrentOpenOrderBuy = true;
                    console.log("Sell failed", err);
                });
            }

            if(data.status === "FILLED" && !isCurrentOpenOrderBuy){
                const botInfo = await getBotInfo({ id: BOT_ID })
                closeOrderInDB({id: currentOrderId})
                console.log({closeOrderData: data})
                createBuyOrder(({client, price: botInfo.buyPrice, quantity: botInfo.buyQuantity})).then(({data: buyOrderData}) => {
                    isCurrentOpenOrderBuy = true;
                    currentOrderId = buyOrderData.orderId
                    createOrderInDB({
                        id: buyOrderData.orderId,
                        botId: BOT_ID,
                        isBuy: true,
                        platformForeignId: BINANCE_PLATFORM_DB_ID,
                        sum: botInfo.buyQuantity,
                        fee: buyOrderData.fills?.[0]?.commission,
                        feeAsset: buyOrderData.fills?.[0]?.commissionAsset
                    })
                    console.log("Buy order created", buyOrderData);
                }).catch(e => {
                    isFirstLoad = true;
                    isCurrentOpenOrderBuy = false;
                    console.log("Buy failed", e);
                })
            }}).catch(error => console.log(error))

    }, 20_000)
}

export default binanceSpotLimitTrade;