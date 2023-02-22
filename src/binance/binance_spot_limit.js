import "dotenv/config";
import {Spot} from '@binance/connector';
import {cancelOrderInDB, closeOrderInDB, createOrderInDB, getBotInfo} from "../db_requests.js";
import { logger } from "../utils/logger.js";

const TIME_IN_FORCE = 'GTC';
const USDT_UAH = 'USDTUAH';
const BINANCE_PLATFORM_DB_ID = '27db0bcd-0ff4-4b54-9564-02b242742454'

const createSellOrderBinanceRequest = ({client, price, quantity}) =>
    client.newOrder(USDT_UAH, 'SELL', 'LIMIT', {
        price,
        quantity,
        timeInForce: TIME_IN_FORCE
    })

const createBuyOrderBinanceRequest = ({client, price, quantity}) => client.newOrder(USDT_UAH, 'BUY', 'LIMIT', {
    price,
    quantity,
    timeInForce: TIME_IN_FORCE
})

const client = new Spot("6Uo26OYrgBPG5nmeTOCOAJ3wGSswVNeJ5TiB4vr9VR818V5cNKFmeaLM9NZ5w6tC",
    "3lgshU2Gwd2v5TkGwemAwqSbefR0IJc0neqnpWZGPlD1EoHtGUgAjVC7Kvy6YPp8")

const BOT_ID = "d8d3bbec-d5b2-499f-8dc1-fa6fd044d463";

const isPrevBotInfoEqual = (prevBotInfo = {}, currentBotInfo = {}) => {
    if(prevBotInfo.buyPrice !== currentBotInfo.buyPrice
        || prevBotInfo.sellPrice !== currentBotInfo.sellPrice
        || prevBotInfo.buyQuantity !== currentBotInfo.buyQuantity ) {

        return false
    }

    return true
}

const binanceSpotLimitTrade = async () => {
    logger.info('Start bot');
    let isFirstLoad = true;
    let isCurrentOpenOrderBuy = false;
    let currentOrderId  = null;
    let prevBotInfo = {};

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
        prevBotInfo = botInfo;
        createSellOrderBinanceRequest(({client, price: botInfo.sellPrice, quantity: botInfo.buyQuantity})).then(({data: sellOrderData}) => {
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
                feeAsset: sellOrderData.fills?.[0]?.commissionAsset,
                price: botInfo.sellPrice
            })
            console.log("First Sell order created", sellOrderData);
        }).catch(e => {
            isFirstLoad = true;
            isCurrentOpenOrderBuy = true;
            console.log("Sell failed", e);
            logger.error('Sell failed', e);
        })
    }

    setInterval(() => {
        client.getOrder(USDT_UAH, {
            orderId: currentOrderId
        }).then(async ({ data }) => {
            console.log(`get order: ${ new Date() }`, {data, currentOrderId})
            logger.info('Start bot', { data, currentOrderId });

            const botInfo = await getBotInfo({ id: BOT_ID })

            const createSellOrder = () => createSellOrderBinanceRequest(({client, price: botInfo.sellPrice, quantity: botInfo.buyQuantity})).then(({data: sellOrderData}) => {
                currentOrderId = sellOrderData.orderId;
                isCurrentOpenOrderBuy = false;
                createOrderInDB({
                    id: sellOrderData.orderId,
                    botId: BOT_ID,
                    isBuy: false,
                    platformForeignId: BINANCE_PLATFORM_DB_ID,
                    sum: botInfo.buyQuantity,
                    fee: sellOrderData.fills?.[0]?.commission,
                    feeAsset: sellOrderData.fills?.[0]?.commissionAsset,
                    price: botInfo.sellPrice
                })
                console.log("Sell order created", sellOrderData);
            }).catch(err => {
                isCurrentOpenOrderBuy = true;
                console.log("Sell failed", err);
            });

            const createBuyOrder = () => createBuyOrderBinanceRequest(({client, price: botInfo.buyPrice, quantity: botInfo.buyQuantity})).then(({data: buyOrderData}) => {
                isCurrentOpenOrderBuy = true;
                currentOrderId = buyOrderData.orderId
                createOrderInDB({
                    id: buyOrderData.orderId,
                    botId: BOT_ID,
                    isBuy: true,
                    platformForeignId: BINANCE_PLATFORM_DB_ID,
                    sum: botInfo.buyQuantity,
                    fee: buyOrderData.fills?.[0]?.commission,
                    feeAsset: buyOrderData.fills?.[0]?.commissionAsset,
                    price: botInfo.buyPrice
                })
                console.log("Buy order created", buyOrderData);
            }).catch(e => {
                isFirstLoad = true;
                isCurrentOpenOrderBuy = false;
                console.log("Buy failed", e);
            })

            if(!isPrevBotInfoEqual(prevBotInfo, botInfo) && isCurrentOpenOrderBuy) {
                client.cancelOrder(USDT_UAH, {
                    orderId: currentOrderId
                }).then(() => {
                    console.log(`Order id: ${currentOrderId} canceled`)
                    cancelOrderInDB({id: currentOrderId})
                    createBuyOrder()
                    prevBotInfo = botInfo;
                }).catch((e) => {
                    console.log(e)
                })

                return;
            }

            if(!isPrevBotInfoEqual(prevBotInfo, botInfo) && !isCurrentOpenOrderBuy) {
                client.cancelOrder(USDT_UAH, {
                    orderId: currentOrderId
                }).then(() => {
                    console.log(`Order id: ${currentOrderId} canceled`)
                    logger.info(`Order id: ${currentOrderId} canceled`);

                    cancelOrderInDB({id: currentOrderId})
                    createSellOrder()
                    prevBotInfo = botInfo;
                }).catch((e) => {
                    console.log(e)
                })

                return;
            }

            if(data.status === "FILLED" && isCurrentOpenOrderBuy){
                closeOrderInDB({id: currentOrderId})
                createSellOrder()
            }

            if(data.status === "FILLED" && !isCurrentOpenOrderBuy){
                closeOrderInDB({id: currentOrderId})
                createBuyOrder()

            }}).catch(error => console.log(error))

    }, 20_000)
}

export default binanceSpotLimitTrade;