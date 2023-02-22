import { prisma } from "../../prisma/db_client.js";

const LogLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug',
}

class Logger {
    #logCollection;

    constructor(logCollection) {
        this.#logCollection = logCollection;
    }

    info(message, ...rest) {
        this.#createLog(LogLevel.INFO, message, ...rest);
    }

    warn(message, ...rest) {
        this.#createLog(LogLevel.WARN, message, ...rest);
    }

    error(message, ...rest) {
        this.#createLog(LogLevel.ERROR, message, ...rest);
    }

    debug(message, ...rest) {
        this.#createLog(LogLevel.DEBUG, message, ...rest);
    }

    #createLog(level, message, data) {
        const timestamp = new Date();

        this.#logCollection.create({
            data: {
                message,
                timestamp,
                level,
                data,
            }
        }).catch((error) => {
            console.log('failed to write log', error);
        })
    }
}

export const logger = new Logger(prisma.log);
