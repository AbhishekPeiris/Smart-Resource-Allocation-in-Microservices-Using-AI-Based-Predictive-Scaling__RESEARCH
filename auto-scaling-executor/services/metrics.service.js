// auto-scaling-executor/services/metrics.service.js

class MetricsService {
  extractFromPayload(metrics = {}) {
    return {
      successRate: Number(metrics.successRate ?? 0),
      errorRate: Number(metrics.errorRate ?? 0),
      p95LatencyBefore: Number(metrics.p95LatencyBefore ?? 0),
      p95LatencyAfter: Number(metrics.p95LatencyAfter ?? 0),
      cpuPercent: Number(metrics.cpuPercent ?? 0),
      memPercent: Number(metrics.memPercent ?? 0),
      restartCount: Number(metrics.restartCount ?? 0),
      trafficRecovery: Number(metrics.trafficRecovery ?? 1)
    };
  }

  /**
   * Apply strict stability rules
   * Returns: { isStable: Boolean, reasons: [] }
   */
  evaluateStability(m) {
    const reasons = [];

    // 1. success rate
    if (m.successRate < 0.97) {
      reasons.push(`Success rate too low (${m.successRate})`);
    }

    // 2. error rate
    if (m.errorRate > 0.03) {
      reasons.push(`Error rate too high (${m.errorRate})`);
    }

    // 3. latency before/after
    if (m.p95LatencyBefore > 0 && m.p95LatencyAfter > 0) {
      const ratio = m.p95LatencyAfter / m.p95LatencyBefore;

      if (m.p95LatencyAfter > 1000) {
        reasons.push(`p95LatencyAfter too high (${m.p95LatencyAfter}ms > 1000ms)`);
      }

      if (ratio > 1.5) {
        reasons.push(
          `Latency spike too large (p95After is ${(ratio * 100).toFixed(0)}% of before)`
        );
      }
    }

    // 4. CPU
    if (m.cpuPercent > 90) {
      reasons.push(`CPU usage too high (${m.cpuPercent}%)`);
    }

    // 5. Memory
    if (m.memPercent > 90) {
      reasons.push(`Memory usage too high (${m.memPercent}%)`);
    }

    // 6. Restart threshold
    if (m.restartCount >= 3) {
      reasons.push(`Too many restarts (${m.restartCount})`);
    }

    // 7. Traffic recovery
    if (m.trafficRecovery < 0.8) {
      reasons.push(
        `Traffic recovery too low (${(m.trafficRecovery * 100).toFixed(0)}%)`
      );
    }

    return {
      isStable: reasons.length === 0,
      reasons
    };
  }

  /**
   * Calculate normalized score 0–1 using latency + error rate
   */
  calculateResilienceScore({ p95LatencyAfter, errorRate }) {
    // latency score
    let latencyScore;
    if (p95LatencyAfter <= 300) latencyScore = 1;
    else if (p95LatencyAfter >= 1000) latencyScore = 0;
    else latencyScore = 1 - (p95LatencyAfter - 300) / (1000 - 300);

    // error score
    let errorScore;
    if (errorRate <= 0.01) errorScore = 1;
    else if (errorRate >= 0.05) errorScore = 0;
    else errorScore = 1 - (errorRate - 0.01) / (0.05 - 0.01);

    const score = 0.6 * latencyScore + 0.4 * errorScore;

    return {
      score,
      latencyScore,
      errorScore
    };
  }
}

export default new MetricsService();
