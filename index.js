require("dotenv").config()
const {Spot} = require('@binance/connector');

const workEnv = [process.env.API_KEY, process.env.SECRET_KEY]

const TRADE_USDT_QUANTITY = 11;
const USDT_UAH_SELL_PRICE = "39.90";
const USDT_UAH_BUY_PRICE = "39.82";
const USDT_UAH = 'USDTUAH';
const TIME_IN_FORCE = 'GTC';

const SELL_LIMIT_ORDER_OPTIONS = {
    price: USDT_UAH_SELL_PRICE,
    quantity: TRADE_USDT_QUANTITY,
    timeInForce: TIME_IN_FORCE
}

const BUY_LIMIT_ORDER_OPTIONS = {
    price: USDT_UAH_BUY_PRICE,
    quantity: TRADE_USDT_QUANTITY,
    timeInForce: TIME_IN_FORCE
}

const createSellOrder = ({client}) =>
    client.newOrder(USDT_UAH, 'SELL', 'LIMIT', SELL_LIMIT_ORDER_OPTIONS)

const createBuyOrder = ({client}) => client.newOrder(USDT_UAH, 'BUY', 'LIMIT', BUY_LIMIT_ORDER_OPTIONS)

const client = new Spot(...workEnv)

const trade = () => {
    let isFirstLoad = true;
    let isCurrentOpenOrderBuy = false;
    let currentOrderId  = null;

    if(isFirstLoad){
        createBuyOrder(({client})).then(({data}) => {
            isFirstLoad = false
            isCurrentOpenOrderBuy = false;
            currentOrderId = data.orderId
            console.log("First Buy order created", data);
        }).catch(e => {
            isFirstLoad = true;
            isCurrentOpenOrderBuy = true;
            console.log("Buy failed", e);
        })
    }

    setInterval(() => {
        client.getOrder(USDT_UAH, {
            orderId: currentOrderId
        }).then(({ data }) => {
            console.log(`get order: ${ new Date() }`, {data, currentOrderId})
            if(data.status === "FILLED" && isCurrentOpenOrderBuy){
                createSellOrder(({client})).then(({data}) => {
                    currentOrderId = data.orderId;
                    isCurrentOpenOrderBuy = true;
                    console.log("Sell order created", data);
                }).catch(err => {
                    isCurrentOpenOrderBuy = false;
                    console.log("Sell failed", err);
                });
            }

            if(data.status === "FILLED" && !isCurrentOpenOrderBuy){
                createBuyOrder(({client})).then(({data}) => {
                    currentOrderId = data.orderId;
                    isCurrentOpenOrderBuy = false;
                    console.log("Buy order created", data);
                }).catch(e => {
                    isCurrentOpenOrderBuy = true;
                    console.log("Sell failed", e);
                })
            }}).catch(error => console.log(error))

    }, 5000)
}

trade()