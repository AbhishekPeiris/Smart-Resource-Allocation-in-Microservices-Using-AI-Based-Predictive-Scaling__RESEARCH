'use strict'

const path = require('path')
const AutoLoad = require('@fastify/autoload')


const {
  register,
  httpRequestTotal,
  httpRequestDurationMs,
  appQueueLength,
} = require('./metrics');

module.exports = async function (fastify, opts) {

  fastify.register(require('@fastify/cors'), { origin: '*' });

  // ===== Metrics Hooks =====

  // Track start time
  fastify.addHook('onRequest', async (req, reply) => {
    req.startTime = process.hrtime.bigint();
  });

  // Track end + record metrics
  fastify.addHook('onResponse', async (req, reply) => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - req.startTime) / 1_000_000;

    const labels = {
      method: req.method,
      route: req.routeOptions?.url || req.url,
      status: reply.statusCode,
    };

    // RPS counter
    httpRequestTotal.inc(labels);

    // Latency
    httpRequestDurationMs.observe(labels, durationMs);
  });

  // ===== /metrics endpoint =====
  fastify.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // ===== Queue length update demo (later replace with real queue) =====
  setInterval(() => {
    const randomQueueSize = Math.floor(Math.random() * 20); // demo value
    appQueueLength.set(randomQueueSize);
  }, 5000);

  // -----------------------------------------
  // AUTOLOAD plugins + routes (existing code)
  // -----------------------------------------
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  });

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  });
}
