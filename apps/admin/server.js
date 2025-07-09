import path from 'node:path';
import fs from 'node:fs';
import cmmv, { serverStatic } from '@cmmv/server';

import { proxy } from '@cmmv/proxy';

import serverConfig from './server.config.js';

const whitelabelApiUrls = {};

/**
 * Fetches whitelabel API URLs with retry logic and exponential backoff
 */
const fetchWhitelabelApiUrls = async (retryCount = 0) => {
    const { maxRetries, timeout, baseDelay, maxDelay, backoffMultiplier } = serverConfig.whitelabel;

    if (Object.keys(whitelabelApiUrls).length > 0) {
        return true;
    }

    try {
        if (typeof fetch === 'undefined') {
            console.warn('Fetch is not available, skipping whitelabel fetch');
            return false;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        console.log(`Fetching whitelabel data from: ${serverConfig.apiUrl}/whitelabel/admin (attempt ${retryCount + 1}/${maxRetries + 1})`);

        const response = await fetch(`${serverConfig.apiUrl}/whitelabel/admin`, {
            signal: controller.signal,
            headers: serverConfig.proxy.headers
        }).catch(error => {
            console.warn('Fetch error:', error.message);
            return null;
        });

        clearTimeout(timeoutId);

        if (!response) {
            console.warn('No response received from whitelabel API');
            return false;
        }

        if (response.ok) {
            const whitelabels = await response.json();
            let count = 0;

            if (whitelabels?.result?.data) {
                whitelabels.result.data.forEach((whitelabel) => {
                    if (whitelabel.id && whitelabel.apiUrl) {
                        whitelabelApiUrls[whitelabel.id] = whitelabel.apiUrl;
                        count++;
                        console.log(`✅ Added whitelabel: ${whitelabel.id} -> ${whitelabel.apiUrl}`);
                    }
                });

                console.log(`🎉 Successfully loaded ${count} whitelabel configurations`);
                return true;
            } else {
                console.warn('⚠️  Invalid response format from whitelabel API');
                return false;
            }
        } else {
            console.warn(`⚠️  Whitelabel API responded with status: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.warn(`❌ Error fetching whitelabel data (attempt ${retryCount + 1}):`, error.message);
        return false;
    } finally {
        if (retryCount < maxRetries) {
            const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, retryCount), maxDelay);
            console.log(`🔄 Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWhitelabelApiUrls(retryCount + 1);
        } else {
            console.warn(`🚫 Max retries (${maxRetries}) reached for whitelabel API`);
            return false;
        }
    }
};

/**
 * Sets up proxy middleware for whitelabel routes
 */
const setupWhitelabelProxies = (app) => {
    Object.entries(whitelabelApiUrls).forEach(([id, url]) => {
        const pattern = `/${id}`;

        console.log(`Setting up proxy: ${pattern} -> ${url}`);

        const proxyHandler = proxy({
            target: url,
            changeOrigin: true,
            pathRewrite: {
                [`^${pattern}`]: '/api'
            },
            timeout: serverConfig.proxy.timeout || 120000,
            headers: {
                ...serverConfig.proxy.headers
            }
        });

        const loggingProxyHandler = (req, res, next) => {
            const originalUrl = req.url;
            const targetUrl = url;
            const rewrittenPath = originalUrl.replace(new RegExp(`^${pattern}`), '/api');
            const finalUrl = `${targetUrl}${rewrittenPath}`;

            console.log(`🔄 [${id}] Proxying: ${req.method} ${originalUrl}`);
            console.log(`📍 [${id}] Target: ${targetUrl}`);
            console.log(`🔀 [${id}] Rewritten: ${rewrittenPath}`);
            console.log(`🎯 [${id}] Final URL: ${finalUrl}`);
            console.log(`📋 [${id}] Headers:`, JSON.stringify(req.headers, null, 2));

            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                if (res.statusCode >= 400) {
                    console.error(`❌ [${id}] Error ${res.statusCode} for ${req.method} ${originalUrl}`);
                    console.error(`🔗 [${id}] Was trying to reach: ${finalUrl}`);
                } else {
                    console.log(`✅ [${id}] Success ${res.statusCode} for ${req.method} ${originalUrl}`);
                }
                originalEnd.call(this, chunk, encoding);
            };

            try {
                return proxyHandler(req, res, next);
            } catch (error) {
                console.error(`💥 [${id}] Proxy error:`, error);
                if (!res.headersSent) {
                    res.statusCode = 502;
                    res.end(JSON.stringify({
                        error: 'Proxy Error',
                        message: `Failed to proxy to ${targetUrl}`,
                        whitelabelId: id,
                        originalUrl: originalUrl,
                        targetUrl: finalUrl
                    }));
                }
            }
        };

        // Define routes for all HTTP methods
        app.get(`${pattern}/*`, loggingProxyHandler);
        app.post(`${pattern}/*`, loggingProxyHandler);
        app.put(`${pattern}/*`, loggingProxyHandler);
        app.delete(`${pattern}/*`, loggingProxyHandler);
        app.patch(`${pattern}/*`, loggingProxyHandler);
        app.options(`${pattern}/*`, loggingProxyHandler);

        // Also handle the exact pattern without /*
        app.get(pattern, loggingProxyHandler);
        app.post(pattern, loggingProxyHandler);
        app.put(pattern, loggingProxyHandler);
        app.delete(pattern, loggingProxyHandler);
        app.patch(pattern, loggingProxyHandler);
        app.options(pattern, loggingProxyHandler);
    });
};

/**
 * Sets up main API proxy
 */
const setupMainApiProxy = (app) => {
    console.log(`🔧 Setting up main API proxy: /api -> ${serverConfig.apiUrl}`);

    const baseProxyOptions = {
        target: serverConfig.apiUrl,
        changeOrigin: serverConfig.proxy.changeOrigin,
        timeout: serverConfig.proxy.timeout || 120000,
        headers: {
            ...serverConfig.proxy.headers
        }
    };

    const mainApiProxy = proxy({
        ...baseProxyOptions,
        pathRewrite: { '^/api': '' }
    });

    const adminApiProxy = proxy({
        ...baseProxyOptions,
        pathRewrite: { '^/api/admin': '' }
    });

    const imagesProxy = proxy({
        ...baseProxyOptions
    });

    // Define routes for main API
    app.get('/api/*', mainApiProxy);
    app.post('/api/*', mainApiProxy);
    app.put('/api/*', mainApiProxy);
    app.delete('/api/*', mainApiProxy);
    app.patch('/api/*', mainApiProxy);
    app.options('/api/*', mainApiProxy);

    // Define routes for admin API
    app.get('/api/admin/*', adminApiProxy);
    app.post('/api/admin/*', adminApiProxy);
    app.put('/api/admin/*', adminApiProxy);
    app.delete('/api/admin/*', adminApiProxy);
    app.patch('/api/admin/*', adminApiProxy);
    app.options('/api/admin/*', adminApiProxy);

    // Define routes for images
    app.get('/images/*', imagesProxy);
    app.post('/images/*', imagesProxy);
    app.put('/images/*', imagesProxy);
    app.delete('/images/*', imagesProxy);
    app.patch('/images/*', imagesProxy);
    app.options('/images/*', imagesProxy);

    console.log('✅ Main API proxy routes configured');
};

/**
 * Initialize the server
 */
const initServer = async () => {
    console.log('🚀 Starting CMMV Admin Server...');
    console.log(`🌍 Environment: ${serverConfig.mode}`);
    console.log(`🔗 API URL: ${serverConfig.apiUrl}`);
    console.log(`🏠 Allowed Hosts: ${serverConfig.allowedHosts}`);
    console.log(`📁 Static Directory: ${serverConfig.staticDir}`);

    const app = cmmv.default();
    setupMainApiProxy(app);

    console.log('🔍 Fetching whitelabel configurations...');
    const success = await fetchWhitelabelApiUrls();

    if (success && Object.keys(whitelabelApiUrls).length > 0) {
        console.log('🔧 Setting up whitelabel proxies...');
        setupWhitelabelProxies(app);
    } else {
        console.warn('⚠️  No whitelabel configurations found, continuing without whitelabel proxies');
    }

    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: serverConfig.mode,
            whitelabels: {
                count: Object.keys(whitelabelApiUrls).length,
                configured: Object.keys(whitelabelApiUrls)
            },
            apiUrl: serverConfig.apiUrl,
            version: process.env.npm_package_version || '1.0.0'
        });
    });

    app.get('/whitelabels', (req, res) => {
        res.json({
            count: Object.keys(whitelabelApiUrls).length,
            whitelabels: whitelabelApiUrls,
            timestamp: new Date().toISOString()
        });
    });

    const setupGenericProxy = () => {
        const proxyHandler = async (req, res) => {
            const targetUrl = req.query.url;

            if (!targetUrl) {
                res.code(400);
                res.type('application/json');
                return res.send(JSON.stringify({
                    error: 'Missing URL parameter',
                    message: 'Please provide a target URL via ?url=<target_url>'
                }));
            }

            try {
                new URL(targetUrl);
            } catch (error) {
                res.code(400);
                res.type('application/json');
                return res.send(JSON.stringify({
                    error: 'Invalid URL',
                    message: 'The provided URL is not valid'
                }));
            }

            try {
                const proxyHeaders = { ...req.headers };
                delete proxyHeaders.host;
                delete proxyHeaders.connection;
                delete proxyHeaders['content-length'];

                const fetchOptions = {
                    method: req.method,
                    headers: proxyHeaders,
                    timeout: serverConfig.proxy.timeout || 120000
                };

                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    if (req.body) {
                        if (typeof req.body === 'string') {
                            fetchOptions.body = req.body;
                        } else {
                            fetchOptions.body = JSON.stringify(req.body);
                        }
                    }
                }

                const response = await fetch(targetUrl, fetchOptions);
                res.code(response.status);

                response.headers.forEach((value, key) => {
                    if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase()))
                        res.header(key, value);
                });

                const responseBody = (response.headers.get('content-type') === 'application/json') ?
                await response.json() : await response.text();

                try {
                    if(response.headers.get('content-type').includes('application/json')) {
                        res.res.setHeader("Content-Type", response.headers.get('content-type'));
                        res.res.write(responseBody);
                    } else {
                        res.res.setHeader("Content-Type", response.headers.get('content-type'));
                        res.res.write(responseBody);
                    }

                    res.res.end();
                } catch (e) {
                    res.res.setHeader("Content-Type", "text/plain");
                    res.res.write(responseBody);
                    res.res.end();
                }

            } catch (error) {
                console.error(`❌ [Generic Proxy] Error:`, error.message);

                if (!res.sent) {
                    res.res.setHeader("Content-Type", "application/json");
                    res.res.write(JSON.stringify({
                        error: 'Proxy Error',
                        message: 'Failed to connect to target URL',
                        targetUrl: targetUrl,
                        details: error.message
                    }));
                }
            }
        };

        // Register proxy routes for all HTTP methods
        app.get('/proxy', proxyHandler);
        app.post('/proxy', proxyHandler);
        app.put('/proxy', proxyHandler);
        app.delete('/proxy', proxyHandler);
        app.patch('/proxy', proxyHandler);
        app.options('/proxy', proxyHandler);
        app.head('/proxy', proxyHandler);
    };

    setupGenericProxy();

    app.get('/', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.send(fs.readFileSync(path.resolve(serverConfig.staticDir, 'index.html'), 'utf8'));
    });

    app.get('/*', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.send(fs.readFileSync(path.resolve(serverConfig.staticDir, 'index.html'), 'utf8'));
    });

    app.use(serverStatic(serverConfig.staticDir));

    app.listen({ host: serverConfig.host, port: serverConfig.port })
    .then(server => {
        const addr = server.address();
        console.log(`\n✅ Server started successfully!`);
        console.log(`📡 Listening on: http://${addr.address}:${addr.port}`);
        console.log(`🔗 API Proxy: ${serverConfig.apiUrl}`);
        console.log(`🏷️  Whitelabels: ${Object.keys(whitelabelApiUrls).length} configured`);

        if (Object.keys(whitelabelApiUrls).length > 0) {
            console.log(`\n📋 Whitelabel Routes:`);
            Object.entries(whitelabelApiUrls).forEach(([id, url]) => {
                console.log(`   /${id} -> ${url}`);
            });
        }

        console.log(`\n🔍 Health check: http://${addr.address}:${addr.port}/health`);
        console.log(`📊 Whitelabels info: http://${addr.address}:${addr.port}/whitelabels`);
        console.log(`🔄 Generic proxy: http://${addr.address}:${addr.port}/proxy?url=<target_url>`);
        console.log(`\n🎉 Server is ready for requests!`);
    })
    .catch(err => {
        console.error('❌ Failed to start server:', err.message);
        throw Error(err.message);
    });
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start the server
initServer().catch(err => {
    console.error('💥 Failed to initialize server:', err);
    process.exit(1);
});
