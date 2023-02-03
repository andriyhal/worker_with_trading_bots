import {prisma} from "../prisma/db_client.js";

export const createOrderInDB = async ({ id, botId, isBuy, platformForeignId, sum, fee, feeAsset }) => {
    try {
        return await prisma.orders.create({
            data: {
                id: id.toString(),
                botId,
                isBuy,
                platformForeignId,
                sum,
                fee,
                feeAsset
            }
        })

    } catch(e) {
        console.log(e)
    }
}

export const closeOrderInDB = async ({ id }) => {
    try {
        return await prisma.orders.update({
            where: { id: id.toString() },
            data: {
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
