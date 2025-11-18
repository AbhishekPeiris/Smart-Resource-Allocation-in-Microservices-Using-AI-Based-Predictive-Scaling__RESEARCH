const client = require('prom-client');

// Global registry
const register = new client.Registry();

// ---- 1) REQUEST RATE counter ----
const httpRequestTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
});

// ---- 2) LATENCY histogram ----
const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_milliseconds',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status'],
    buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

// ---- 3) QUEUE LENGTH gauge ----
const appQueueLength = new client.Gauge({
    name: 'app_queue_length',
    help: 'Pending jobs in queue',
});

// Register metrics
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestDurationMs);
register.registerMetric(appQueueLength);

// Default Node.js metrics
client.collectDefaultMetrics({ register });

module.exports = {
    register,
    httpRequestTotal,
    httpRequestDurationMs,
    appQueueLength,
};
