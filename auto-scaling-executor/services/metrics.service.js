// auto-scaling-executor/services/metrics.service.js

class MetricsService {

  extractFromPayload(metricsPayload = {}) {
    const latencyMs = Number(metricsPayload.latency_ms ?? metricsPayload.latencyMs ?? 0);
    const errorRate = Number(metricsPayload.error_rate ?? metricsPayload.errorRate ?? 0);

    return {
      latencyMs: isNaN(latencyMs) ? 0 : latencyMs,
      errorRate: isNaN(errorRate) ? 0 : errorRate
    };
  }

  calculateResilienceScore({ latencyMs, errorRate }) {
    // Latency normalize (0–1)
    const LAT_GOOD = 200;
    const LAT_BAD = 1000;

    let latencyScore;
    if (latencyMs <= LAT_GOOD) latencyScore = 1;
    else if (latencyMs >= LAT_BAD) latencyScore = 0;
    else latencyScore =
      1 - (latencyMs - LAT_GOOD) / (LAT_BAD - LAT_GOOD);

    // Error normalize (0–1)
    const ER_GOOD = 0.01; 
    const ER_BAD = 0.05;

    let errorScore;
    if (errorRate <= ER_GOOD) errorScore = 1;
    else if (errorRate >= ER_BAD) errorScore = 0;
    else errorScore =
      1 - (errorRate - ER_GOOD) / (ER_BAD - ER_GOOD);

    const score = 0.6 * latencyScore + 0.4 * errorScore;

    return { score, latencyMs, errorRate, latencyScore, errorScore };
  }
}

export default new MetricsService();
