import {prisma} from "../prisma/db_client.js";

export const createOrderInDB = async ({ id, botId, isBuy, platformForeignId, sum }) => {
    try {
        return await prisma.order.create({
            data: {
                id,
                botId,
                isBuy,
                platformForeignId,
                sum
            }
        })

    } catch(e) {
        console.log(e)
    }
}

export const closeOrderInDB = async ({ id, fee = null }) => {
    try {
        return await prisma.order.update({
            where: { id },
            data: {
                fee,
                closedAt: new Date()
            }
        })
    } catch(e) {
        console.log(e)
    }
}

export const getBotInfo = async ({ id }) => {
    try {
        return await prisma.bots.findFirst({
            where: { id }
        })

    } catch(e) {
        console.log(e)
    }
}
