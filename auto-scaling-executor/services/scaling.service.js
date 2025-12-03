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

  async scaleOne({ deployment, request_pods }) {
    this.validate({ deployment, request_pods });
    const additionalPods = this.calculatePods(request_pods);
    const mode = this.getMode();

    console.log("ScalingService executing in mode:", mode);

    if (mode === "K8S") {
      return await K8sExecutor.scaleDeploymentIncremental(deployment, additionalPods);
    }

    return LocalScaler.simulateScaling(deployment, additionalPods);
  }

  async scaleMultiple(services) {
    const results = [];

    for (const svc of services) {
      const result = await this.scaleOne(svc);
      results.push(result);
    }

    return { mode: this.getMode(), results };
  }

  /**
   * Scale + metrics-based validation + rollback (K8S only)
   */
  async scaleOneWithMetrics({ deployment, request_pods, metrics }) {
    // 1. Validate + basic calculations
    this.validate({ deployment, request_pods });
    const additionalPods = this.calculatePods(request_pods);
    const mode = this.getMode();

    console.log("ScalingService (metrics) executing in mode:", mode);

    // 2. First perform the basic scaling
    let baseResult;
    if (mode === "K8S") {
      baseResult = await K8sExecutor.scaleDeploymentIncremental(
        deployment,
        additionalPods
      );
    } else {
      baseResult = LocalScaler.simulateScaling(deployment, additionalPods);
    }

    const attemptedAdditional =
      baseResult.additional_replicas ?? additionalPods;

    // If scaling itself failed → return as-is, mark validation skipped
    if (baseResult.status !== "SUCCESS") {
      return {
        ...baseResult,
        attempted_additional_replicas: attemptedAdditional,
        additional_replicas: 0,
        validation: {
          passed: false,
          rolledBack: false,
          skipped: true,
          reason: "Scaling failed before validation could run"
        }
      };
    }

    // 3. Metrics → score
    const extracted = MetricsService.extractFromPayload(metrics || {});
    const raw = MetricsService.calculateResilienceScore(extracted);
    const passed = raw.score >= this.RESILIENCE_THRESHOLD;

    const validation = {
      ...raw,
      threshold: this.RESILIENCE_THRESHOLD,
      passed,
      rolledBack: false
    };

    // 4. LOCAL mode – no rollback, just attach validation
    if (mode !== "K8S") {
      return {
        deployment,
        previous_replicas: baseResult.previous_replicas,
        attempted_additional_replicas: attemptedAdditional,
        additional_replicas: attemptedAdditional,
        required_replicas: baseResult.required_replicas,
        status: passed ? "SUCCESS_VALIDATED_LOCAL" : "SUCCESS_VALIDATION_FAILED_LOCAL",
        message: baseResult.message,
        validation
      };
    }

    // 5. K8S mode – validation pass → keep scale
    if (passed) {
      return {
        deployment,
        previous_replicas: baseResult.previous_replicas,
        attempted_additional_replicas: attemptedAdditional,
        additional_replicas: attemptedAdditional, // actually active
        required_replicas: baseResult.required_replicas,
        status: "SUCCESS_VALIDATED",
        message: "Scale kept – resilience validation passed",
        validation
      };
    }

    // 6. K8S mode – validation FAIL → rollback
    await K8sExecutor.scaleDeployment(
      deployment,
      baseResult.previous_replicas
    );
    validation.rolledBack = true;

    return {
      deployment,
      previous_replicas: baseResult.previous_replicas,
      attempted_additional_replicas: attemptedAdditional,
      additional_replicas: 0, // net extra now = 0 (rolled back)
      required_replicas: baseResult.previous_replicas,
      status: "ROLLED_BACK",
      message: "Resilience validation failed – scale rolled back",
      validation
    };
  }
}

export default new ScalingService();
