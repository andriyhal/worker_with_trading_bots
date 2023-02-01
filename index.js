require("dotenv").config()
const {Spot} = require('@binance/connector');
const cron = require('node-cron');

const workEnv = ["kajUUropn0q1s37n9Y7jEr9fAgzAE6MLh7hIgXuIkP5EwAKyDlWZySVoTl7tSyJO", "tR57OBr2jh6AMEfyxOeJZsfgkrcsT8zjHUyj2gZsvqcM8sJB7rII4tFKSTGTLAXL"]

const TRADE_USDT_QUANTITY = 200;
const USDT_UAH_SELL_PRICE = "40.01";
const USDT_UAH_BUY_PRICE = "39.81";
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

    let isFirstLoad = true;
    let isCurrentOpenOrderBuy = false;
    let currentOrderId  = null;

    if(isFirstLoad){
        createSellOrder(({client})).then(({data}) => {
            isFirstLoad = false
            isCurrentOpenOrderBuy = true;
            currentOrderId = data.orderId
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
}

// every minute
cron.schedule('*/1 * * * *', () => {
    trade();
});
