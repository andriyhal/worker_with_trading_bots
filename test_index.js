require("dotenv").config()
const {Spot} = require('@binance/connector');

const workEnv = [process.env.VITALIY_API_KEY, process.env.VITALIY_SECRET_KEY]
// const workEnv = [process.env.API_KEY_SPOT, process.env.SECRET_KEY_SPOT]

const TRADE_USDT_QUANTITY = 170;
const USDT_UAH_SELL_PRICE = 40.21;
const USDT_UAH_BUY_PRICE = 40.20;
const DEFAULT_CURRENT_PRICE = 0;
const USDT_UAH = 'USDTUAH';

// const createSellOrder = ({quantity, client}) => {
//     client.newOrder(USDT_UAH, 'SELL', 'MARKET', {
//         quantity,
//     }).then(response => console.log(response.data))
//         .catch(error => console.log(error))
// }
//
// const createBuyOrder = ({quantity, client}) => {
//     client.newOrder(USDT_UAH, 'BUY', 'MARKET', {
//         quantity,
//     }).then(response => client.logger.log(response.data))
//         .catch(error => client.logger.error(error))
// }

const createSellOrder = ({quantity, client}) => {
  console.log("sell order")
}

const createBuyOrder = ({quantity, client}) => {
  console.log("buy order")
}

const client = new Spot(...workEnv)

const trade = () => {
    let currentPrice = DEFAULT_CURRENT_PRICE;
    let isSellOrderActive = true;

    const callbacks = {
        open: () => console.log('Connected with Websocket server'),
        close: () => console.log('Disconnected with Websocket server'),
        message: data => {
            currentPrice = JSON.parse(data).p
            console.log("currentPrice: ", currentPrice)
        }
    }

    client.aggTradeWS(USDT_UAH, callbacks)

    setInterval(() => {
        if (currentPrice <= USDT_UAH_BUY_PRICE && !isSellOrderActive){
            try {
                createBuyOrder({quantity: TRADE_USDT_QUANTITY, client});
                isSellOrderActive = true;
                console.log("buy order created", currentPrice);
            } catch(e) {
                isSellOrderActive = false;
                console.log("buy failed", e);
            }
        }

        if (currentPrice >= USDT_UAH_SELL_PRICE && isSellOrderActive) {
            try {
                createSellOrder({quantity: TRADE_USDT_QUANTITY, client});
                isSellOrderActive = false;
                console.log("sell order created", currentPrice);
            } catch(e) {
                isSellOrderActive = true;
                console.log("sell failed", e);
            }
        }
    }, 1)
}

trade()