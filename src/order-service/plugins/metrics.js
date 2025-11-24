'use strict';

const path = require('path');
const {
    register,
    httpRequestTotal,
    httpRequestDurationMs
} = require(path.join(__dirname, '..', 'metrics.js'));

module.exports = async function (fastify, opts) {

    fastify.addHook('onRequest', async (req, reply) => {
        req.startTime = Date.now();
    });

    fastify.addHook('onResponse', async (req, reply) => {
        const elapsed = Date.now() - req.startTime;

        const labels = {
            method: req.method,
            route: req.routerPath || req.url,
            status: reply.statusCode,
        };

        httpRequestTotal.inc(labels);
        httpRequestDurationMs.observe(labels, elapsed);
    });

    // Expose metrics endpoint
    fastify.get('/metrics', async (req, reply) => {
        reply.header('Content-Type', register.contentType);
        return register.metrics();
    });
};
