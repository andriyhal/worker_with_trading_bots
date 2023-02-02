import {prisma} from "../prisma/db_client.js";

export const createOrder = async ({ id, botId, isBuy, platformForeignId, sum }) => {
    try {
        const order = await prisma.order.create({
            data: {
                id,
                botId,
                isBuy,
                platformForeignId,
                sum
            }
        })
        return order
    } catch(e) {
        console.log(e)
    }
}

export const closeOrder = async ({ id, fee = null }) => {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                fee,
                closedAt: new Date()
            }
        })
        return order
    } catch(e) {
        console.log(e)
    }
}

export const getBotInfo = async ({ id }) => {
    try {
        const botInfo = await prisma.bot.findFirst({
            where: { id }
        })

        return botInfo
    } catch(e) {
        console.log(e)
    }
}
