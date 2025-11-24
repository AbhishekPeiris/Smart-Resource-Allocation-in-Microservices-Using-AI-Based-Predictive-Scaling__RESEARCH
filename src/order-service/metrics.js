const client = require('prom-client');
const register = new client.Registry();

// === Requests Counter ===
const httpRequestTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestTotal);

// === Latency Histogram ===
const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_milliseconds',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status'],
    buckets: [50, 100, 200, 500, 1500, 3000],
});
register.registerMetric(httpRequestDurationMs);

// === Queue Length ===
const appQueueLength = new client.Gauge({
    name: 'app_queue_length',
    help: 'Number of pending jobs in internal queue',
});
register.registerMetric(appQueueLength);

register.setDefaultLabels({
    service: 'order-service',
});

client.collectDefaultMetrics({ register });

module.exports = {
    register,
    httpRequestTotal,
    httpRequestDurationMs,
    appQueueLength
};
