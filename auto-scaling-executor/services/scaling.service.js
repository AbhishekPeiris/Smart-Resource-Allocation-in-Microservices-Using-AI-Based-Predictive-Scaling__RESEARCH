import LocalScaler from "./local-scaler.service.js"
import K8sExecutor from "./k8s-executor.service.js"
import MetricsService from "./metrics.service.js";


class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50
    // Read mode dynamically instead of in constructor
  }

  getMode() {
    return process.env.EXECUTION_MODE || "LOCAL"
  }

  validate(obj) {
    if (!obj.deployment || typeof obj.deployment !== "string" || obj.deployment.trim() === "") {
      throw new Error("deployment is required and must be a non-empty string")
    }
    if (!obj.request_pods || isNaN(Number(obj.request_pods))) {
      throw new Error("request_pods must be a valid number")
    }
    if (obj.request_pods <= 0) throw new Error("request_pods must be > 0")
  }

  calculatePods(requestPods) {
    return Math.max(1, Math.ceil(requestPods / this.POD_CAPACITY))
  }

  async scaleOne({ deployment, request_pods }) {
    this.validate({ deployment, request_pods })
    const additionalPods = this.calculatePods(request_pods)
    const mode = this.getMode()

    console.log("ScalingService executing in mode:", mode)

    if (mode === "K8S") {
      return await K8sExecutor.scaleDeploymentIncremental(deployment, additionalPods)
    }

    return LocalScaler.simulateScaling(deployment, additionalPods)
  }

  async scaleMultiple(services) {
    const results = []

    for (const svc of services) {
      const result = await this.scaleOne(svc)
      results.push(result)
    }

    return { mode: this.getMode(), results }
  }


   async scaleOneWithMetrics({ deployment, request_pods, metrics }) {

    // -------------------------------
    // 1. Validate input
    // -------------------------------
    this.validate({ deployment, request_pods });
    const additionalPods = this.calculatePods(request_pods);
    const mode = this.getMode();

    console.log("ScalingService (metrics) executing in mode:", mode);

    // -------------------------------
    // 2. Basic scaling (LOCAL / K8S)
    // -------------------------------
    let baseResult;

    if (mode === "K8S") {
      // Use SAME incremental behavior like scaleOne()
      baseResult = await K8sExecutor.scaleDeploymentIncremental(
        deployment,
        additionalPods
      );
    } else {
      baseResult = LocalScaler.simulateScaling(deployment, additionalPods);
    }

    // baseResult now includes:
    // previous_replicas
    // additional_replicas
    // required_replicas

    // -------------------------------
    // 3. Extract & process metrics
    // -------------------------------
    const extracted = MetricsService.extractFromPayload(metrics || {});
    const validation = MetricsService.calculateResilienceScore(extracted);

    // -------------------------------
    // 4. Return full enriched result
    // -------------------------------
    return {
      deployment,
      previous_replicas: baseResult.previous_replicas,
      additional_replicas: baseResult.additional_replicas ?? additionalPods,
      required_replicas: baseResult.required_replicas,
      status: baseResult.status,
      message: baseResult.message,
      validation
    };
  }

}



export default new ScalingService()
