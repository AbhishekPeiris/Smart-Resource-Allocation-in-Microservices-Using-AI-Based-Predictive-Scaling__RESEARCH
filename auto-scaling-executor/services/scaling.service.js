// auto-scaling-executor/services/scaling.service.js

import LocalScaler from "./local-scaler.service.js";
import K8sExecutor from "./k8s-executor.service.js";
import MetricsService from "./metrics.service.js";

class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50;
    this.RESILIENCE_THRESHOLD = Number(process.env.RESILIENCE_THRESHOLD || 0.7);
  }

  getMode() {
    return process.env.EXECUTION_MODE || "LOCAL";
  }

  validate(obj) {
    if (!obj.deployment || typeof obj.deployment !== "string" || obj.deployment.trim() === "") {
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
   * Scale + metrics-based validation + rollback
   */
  async scaleOneWithMetrics({ deployment, request_pods, metrics }) {
    this.validate({ deployment, request_pods });
    const additionalPods = this.calculatePods(request_pods);
    const mode = this.getMode();

    // Step 1: Apply scale
    let baseResult =
      mode === "K8S"
        ? await K8sExecutor.scaleDeploymentIncremental(deployment, additionalPods)
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
          reason: "Scaling failed before validation"
        }
      };
    }

    // Step 2: Validate metrics
    const extracted = MetricsService.extractFromPayload(metrics || {});
    const stability = MetricsService.evaluateStability(extracted);
    const scoreData = MetricsService.calculateResilienceScore(extracted);

    const scorePassed = scoreData.score >= this.RESILIENCE_THRESHOLD;
    const passed = stability.isStable && scorePassed;

    // Step 3: LOCAL MODE → NO rollback
    if (mode !== "K8S") {
      return {
        deployment,
        previous_replicas: baseResult.previous_replicas,
        attempted_additional_replicas: attemptedAdditional,
        additional_replicas: attemptedAdditional,
        required_replicas: baseResult.required_replicas,
        status: passed ? "SUCCESS_VALIDATED_LOCAL" : "SUCCESS_VALIDATION_FAILED_LOCAL",
        message: baseResult.message,
        validation: {
          ...scoreData,
          passed,
          rolledBack: false,
          threshold: this.RESILIENCE_THRESHOLD
        }
      };
    }

    // Step 4: PASS → keep scale (K8S)
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
          threshold: this.RESILIENCE_THRESHOLD
        }
      };
    }

    // Step 5: FAIL → rollback (K8S)
    await K8sExecutor.scaleDeployment(deployment, baseResult.previous_replicas);

    return {
      deployment,
      previous_replicas: baseResult.previous_replicas,
      attempted_additional_replicas: attemptedAdditional,
      additional_replicas: 0,
      required_replicas: baseResult.previous_replicas,
      status: "ROLLED_BACK",
      message: "Resilience validation failed – scale rolled back",
      rollback_reason: stability.reasons,   // IMPORTANT
      validation: {
        ...scoreData,
        passed: false,
        rolledBack: true,
        threshold: this.RESILIENCE_THRESHOLD
      }
    };
  }

  async scaleMultipleWithMetrics(services) {
    const results = [];
    for (const svc of services) results.push(await this.scaleOneWithMetrics(svc));
    return { mode: this.getMode(), results };
  }
}

export default new ScalingService();
