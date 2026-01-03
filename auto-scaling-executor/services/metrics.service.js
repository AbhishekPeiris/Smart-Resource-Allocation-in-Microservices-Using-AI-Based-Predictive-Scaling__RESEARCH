// auto-scaling-executor/services/metrics.service.js

// auto-scaling-executor/services/metrics.service.js

class MetricsService {
  /**
   * Normalize raw metric payload
   */
  extractFromPayload(metrics = {}) {
    return {
      successRate: Number(metrics.successRate ?? 0),
      errorRate: Number(metrics.errorRate ?? 0),
      p95LatencyBefore: Number(metrics.p95LatencyBefore ?? 0),
      p95LatencyAfter: Number(metrics.p95LatencyAfter ?? 0),
      cpuPercent: Number(metrics.cpuPercent ?? 0),
      memPercent: Number(metrics.memPercent ?? 0),
      restartCount: Number(metrics.restartCount ?? 0),
      trafficRecovery: Number(metrics.trafficRecovery ?? 1),
    };
  }

  /**
   * RULE-BASED STABILITY VALIDATION
   * (Hard constraints – any violation => unstable)
   */
  evaluateStability(m) {
    const reasons = [];

    const rules = [
      {
        check: () => m.successRate >= 0.97,
        fail: `Success rate too low (${m.successRate})`,
      },
      {
        check: () => m.errorRate <= 0.03,
        fail: `Error rate too high (${m.errorRate})`,
      },
      {
        check: () => m.cpuPercent <= 90,
        fail: `CPU usage too high (${m.cpuPercent}%)`,
      },
      {
        check: () => m.memPercent <= 90,
        fail: `Memory usage too high (${m.memPercent}%)`,
      },
      {
        check: () => m.restartCount < 3,
        fail: `Too many restarts (${m.restartCount})`,
      },
      {
        check: () => m.trafficRecovery >= 0.8,
        fail: `Traffic recovery too low (${(m.trafficRecovery * 100).toFixed(0)}%)`,
      },
    ];

    // Latency-specific compound rule
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

    // Apply generic rules
    for (const rule of rules) {
      if (!rule.check()) {
        reasons.push(rule.fail);
      }
    }

    return {
      isStable: reasons.length === 0,
      reasons,
    };
  }

  /**
   * SOFT RESILIENCE SCORE (0–1)
   * Used for graded decisions & research analysis
   */
  calculateResilienceScore({ p95LatencyAfter, errorRate }) {
    const latencyScore = this.#latencyScore(p95LatencyAfter);
    const errorScore = this.#errorScore(errorRate);

    const score = Number(
      (0.6 * latencyScore + 0.4 * errorScore).toFixed(3)
    );

    return {
      score,
      latencyScore,
      errorScore,
    };
  }

  /**
   * --- PRIVATE HELPERS ---
   */

  #latencyScore(latency) {
    if (latency <= 300) return 1;
    if (latency >= 1000) return 0;
    return 1 - (latency - 300) / (1000 - 300);
  }

  #errorScore(errorRate) {
    if (errorRate <= 0.01) return 1;
    if (errorRate >= 0.05) return 0;
    return 1 - (errorRate - 0.01) / (0.05 - 0.01);
  }
}

export default new MetricsService();
