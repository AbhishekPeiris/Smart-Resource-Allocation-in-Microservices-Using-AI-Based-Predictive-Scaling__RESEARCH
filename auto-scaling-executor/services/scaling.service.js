// auto-scaling-executor/services/scaling.service.js

import LocalScaler from "./local-scaler.service.js";
import K8sExecutor from "./k8s-executor.service.js";
import MetricsService from "./metrics.service.js";
import ChaosService from "./chaos.service.js";

class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50;
    this.RESILIENCE_THRESHOLD = Number(
      process.env.RESILIENCE_THRESHOLD || 0.7
    );
    this.CHAOS_WAIT_MS = Number(process.env.CHAOS_WAIT_MS || 10000); // 10s default
  }

  getMode() {
    return process.env.EXECUTION_MODE || "LOCAL";
  }

  validate(obj) {
    if (
      !obj.deployment ||
      typeof obj.deployment !== "string" ||
      obj.deployment.trim() === ""
    ) {
      throw new Error("deployment is required and must be a non-empty string");
    }
    if (!obj.request_pods || isNaN(Number(obj.request_pods))) {
      throw new Error("request_pods must be a valid number");
    }
    if (obj.request_pods <= 0) throw new Error("request_pods must be > 0");
  }

  calculatePods(requestPods) {
    return Math.max(1, Math.ceil(requestPods / this.POD_CAPACITY));
  }

  /**
   * --- MAIN METHOD ---
   * 1) Scale
   * 2) (K8S only) Inject chaos
   * 3) Validate metrics
   * 4) (K8S only) Rollback on failure
   */
  async scaleOneWithMetrics({ deployment, request_pods, metrics }) {
    this.validate({ deployment, request_pods });
    const additionalPods = this.calculatePods(request_pods);
    const mode = this.getMode();

    // ─────────────────────────────────────────
    // STEP 1 – Apply scale (LOCAL or K8S)
    // ─────────────────────────────────────────
    let baseResult =
      mode === "K8S"
        ? await K8sExecutor.scaleDeploymentIncremental(
            deployment,
            additionalPods
          )
        : LocalScaler.simulateScaling(deployment, additionalPods);

    const attemptedAdditional =
      baseResult.additional_replicas ?? additionalPods;

    if (baseResult.status !== "SUCCESS") {
      return {
        ...baseResult,
        attempted_additional_replicas: attemptedAdditional,
        additional_replicas: 0,
        validation: {
          passed: false,
          rolledBack: false,
          skipped: true,
          reason: "Scaling failed before validation",
        },
      };
    }

    // ─────────────────────────────────────────
    // (K8S ONLY) STEP 2 – Inject chaos & wait
    // ─────────────────────────────────────────
    const chaosEnabled = mode === "K8S";
    let chaosInjected = false;

    if (chaosEnabled) {
      try {
        const { success } = await ChaosService.injectPodFailure(deployment);
        chaosInjected = success;
      } catch (e) {
        console.error("Chaos injection error:", e.message);
      }

      // allow system to react to chaos (latency, errors, restarts ...)
      if (chaosInjected && this.CHAOS_WAIT_MS > 0) {
        await new Promise((r) => setTimeout(r, this.CHAOS_WAIT_MS));
      }
    }

    // We ALWAYS try to clean chaos at the end
    try {
      // ─────────────────────────────────────────
      // STEP 3 – Validate metrics (payload-based)
      // ─────────────────────────────────────────
      const extracted = MetricsService.extractFromPayload(metrics || {});
      const stability = MetricsService.evaluateStability(extracted);
      const scoreData = MetricsService.calculateResilienceScore(extracted);

      const scorePassed = scoreData.score >= this.RESILIENCE_THRESHOLD;
      const passed = stability.isStable && scorePassed;

      // ─────────────────────────────────────────
      // STEP 4 – LOCAL MODE → NO rollback, only reporting
      // ─────────────────────────────────────────
      if (mode !== "K8S") {
        return {
          deployment,
          previous_replicas: baseResult.previous_replicas,
          attempted_additional_replicas: attemptedAdditional,
          additional_replicas: attemptedAdditional,
          required_replicas: baseResult.required_replicas,
          status: passed
            ? "SUCCESS_VALIDATED_LOCAL"
            : "SUCCESS_VALIDATION_FAILED_LOCAL",
          message: baseResult.message,
          validation: {
            ...scoreData,
            passed,
            rolledBack: false,
            threshold: this.RESILIENCE_THRESHOLD,
          },
        };
      }

      // ─────────────────────────────────────────
      // STEP 5 – K8S MODE → PASS → keep scale
      // ─────────────────────────────────────────
      if (passed) {
        return {
          deployment,
          previous_replicas: baseResult.previous_replicas,
          attempted_additional_replicas: attemptedAdditional,
          additional_replicas: attemptedAdditional,
          required_replicas: baseResult.required_replicas,
          status: "SUCCESS_VALIDATED",
          message: "Scale kept – resilience validation passed",
          validation: {
            ...scoreData,
            passed: true,
            rolledBack: false,
            threshold: this.RESILIENCE_THRESHOLD,
          },
        };
      }

      // ─────────────────────────────────────────
      // STEP 6 – K8S MODE → FAIL → rollback
      // ─────────────────────────────────────────
      await K8sExecutor.scaleDeployment(
        deployment,
        baseResult.previous_replicas
      );

      return {
        deployment,
        previous_replicas: baseResult.previous_replicas,
        attempted_additional_replicas: attemptedAdditional,
        additional_replicas: 0,
        required_replicas: baseResult.previous_replicas,
        status: "ROLLED_BACK",
        message: "Resilience validation failed – scale rolled back",
        rollback_reason: stability.reasons,
        validation: {
          ...scoreData,
          passed: false,
          rolledBack: true,
          threshold: this.RESILIENCE_THRESHOLD,
        },
      };
    } finally {
      // Always attempt to remove chaos if we injected it
      if (chaosEnabled && chaosInjected) {
        await ChaosService.deleteChaos(deployment);
      }
    }
  }

  /**
   * Scale multiple services without metrics validation or chaos.
   * Keeps output shape consistent with other endpoints.
   */
  async scaleMultiple(services) {
    const mode = this.getMode();
    const results = [];

    for (const svc of services) {
      try {
        this.validate(svc);
        const { deployment, request_pods } = svc;
        const additionalPods = this.calculatePods(request_pods);

        const baseResult =
          mode === "K8S"
            ? await K8sExecutor.scaleDeploymentIncremental(
                deployment,
                additionalPods
              )
            : LocalScaler.simulateScaling(deployment, additionalPods);

        const attemptedAdditional =
          baseResult.additional_replicas ?? additionalPods;

        const success = baseResult.status === "SUCCESS";

        results.push({
          deployment,
          previous_replicas: baseResult.previous_replicas,
          attempted_additional_replicas: attemptedAdditional,
          additional_replicas: success ? attemptedAdditional : 0,
          required_replicas: baseResult.required_replicas,
          status: baseResult.status,
          message:
            baseResult.message || (success ? "Scaled successfully" : baseResult.error || "Scaling failed"),
        });
      } catch (err) {
        results.push({
          deployment: svc?.deployment,
          previous_replicas: 0,
          attempted_additional_replicas: 0,
          additional_replicas: 0,
          required_replicas: 0,
          status: "FAILED",
          message: err.message,
        });
      }
    }

    return { mode, results };
  }

  async scaleMultipleWithMetrics(services) {
    const results = [];
    for (const svc of services) {
      results.push(await this.scaleOneWithMetrics(svc));
    }
    return { mode: this.getMode(), results };
  }
}

export default new ScalingService();
