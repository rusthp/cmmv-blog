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
        logging: process.env.NODE_ENV === 'development' ? ['error'] : false,
        // SQLite performance optimizations
        // These will be applied when the database connection is established
        extra: {
            // Enable WAL mode for better concurrency (allows reads during writes)
            // Set via PRAGMA journal_mode=WAL when connection opens
            enableWAL: true,
            // Cache size: 64MB (negative value means KB, so -64000 = 64MB)
            cacheSize: -64000,
            // Use memory for temporary storage (faster than disk)
            tempStore: 'MEMORY',
            // Memory-mapped I/O for faster reads (256MB)
            mmapSize: 268435456,
            // Page size: 4KB (optimal for most workloads)
            pageSize: 4096,
            // Synchronous mode: NORMAL (balance between safety and speed)
            // FULL is safer but slower, OFF is faster but risky
            synchronous: 'NORMAL',
            // Enable foreign key constraints
            foreignKeys: true,
            // Optimize for read-heavy workloads
            optimizeForReads: true,
        }
    },

    auth: {
        localRegister: true,
        localLogin: true,
        jwtSecret: process.env.JWT_SECRET || 'secret',
        jwtSecretRefresh: process.env.JWT_SECRET_REFRESH || 'secret',
        expiresIn: 60 * 60 * 24
    },

    cache: {
        // Multi-level caching strategy
        // Primary: Filesystem cache (persistent across restarts)
        store: "cache-manager-fs-binary",
        path: "./cache",
        ttl: 600, // Default: 10 minutes
        
        // Entity-specific TTLs for optimized cache management
        entityTtls: {
            // Frequently accessed, rarely changed
            'SettingsEntity': 1800, // 30 minutes
            'OddsSettingsEntity': 1800, // 30 minutes
            'YTChannelsEntity': 600, // 10 minutes
            
            // Frequently accessed, changes more often
            'YTVideosEntity': 300, // 5 minutes
            'PostsEntity': 300, // 5 minutes
            
            // Less frequently accessed
            'OddsCountriesEntity': 3600, // 1 hour
            'OddsVenuesEntity': 3600, // 1 hour
        },
        
        // Enable query result caching
        queryCache: {
            enabled: true,
            defaultTtl: 300, // 5 minutes for query results
        }
    },
});
