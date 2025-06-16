import * as dotenv from "dotenv";
import { Config } from "@cmmv/core";

dotenv.config();

Config.assign({
    env: process.env.NODE_ENV,

    server: {
        host: process.env.HOST || '0.0.0.0',
        port: process.env.PORT || 5000,
        cors: {
            enabled: false, // If user cloudflare, disable this
            /*options: {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: [
                    'Content-Type', 'Authorization', 'X-Requested-With', 'Accept',
                    'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'
                ],
                credentials: false,
            },*/
        },
    },

    repository: {
        type: 'sqlite',
        database: "./database.sqlite",
        synchronize: true,
        logging: false,
    },

    auth: {
        localRegister: true,
        localLogin: true,
        jwtSecret: process.env.JWT_SECRET || 'secret',
        jwtSecretRefresh: process.env.JWT_SECRET_REFRESH || 'secret',
        expiresIn: 60 * 60 * 24
    },

    cache: {
        store: "cache-manager-fs-binary",
        path: "./cache",
        ttl: 600
    },
});
