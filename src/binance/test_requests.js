import { v4 as uuidv4 } from 'uuid';
import {prisma} from "../db_client.js";

export const getUserById = async (id = "72a9d92c-95e3-466b-ba2e-0f3584c334bd") => {
    const userInfo = await prisma.users.findFirst({
        where: { id },
    })

    return userInfo;
}

export const getProfileById = async (id = "55e48f5f-25eb-4c77-abfc-8032da81ba80") => {
    const profileInfo = await prisma.profiles.findFirst({
        where: { id },
    })

    return profileInfo;
}


// export const createProfile = async ({userId, platformId, profileName, apiKey, secretKey}) => {
//
// }
//
// export const createBot = async ({ profileId, pair, isActive, botStrategySpotLimitId }) => {
//
// }
const createBotWithStrategy = async ({
     profileId = "55e48f5f-25eb-4c77-abfc-8032da81ba80",
     pair = "USDTUAH",
}) => {
    try {
        const bot = await prisma.bots.create({
            data: {
                profiles: profileId,
                pair,
                bot_strategy_spot_limit: {
                    create: {
                        id: uuidv4(),
                        totalInvestments: "11",
                        buyPrice: "39.80",
                        sellPrice: "39.80",
                    }
                }
            }
        })
        return bot
    } catch(e) {
        console.log(e)
    }
}

createBotWithStrategy({}).then(info => console.log(info))
//
// const createStrategySpotLimit = async ({ totalInvestments, buyPrice, sellPrice, botId }) => {
//
// }
//
// const updateStrategySpotLimit = async ({ totalInvestments, buyPrice, sellPrice }) => {
//
// }
//
// const getStrategySpotLimitInfo = async ({ id }) => {
//
// }
//
// const createOrder = async ({ botId }) => {
//
// }
