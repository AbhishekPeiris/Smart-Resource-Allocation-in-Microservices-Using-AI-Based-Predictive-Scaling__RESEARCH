'use strict';

const path = require('path');
const AutoLoad = require('@fastify/autoload');
const cors = require('@fastify/cors');

// Metrics plugin
const metricsPlugin = require('./plugins/metrics');

module.exports = async function (fastify, opts) {

  // Enable CORS
  fastify.register(cors, { origin: '*' });

  // Register Metrics First
  fastify.register(metricsPlugin);

  // Load plugins except metrics
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    ignorePattern: /metrics\.js$/,
  });

  // Load routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
  });
};
