import logger from "../utils/logger.js";
import LocalScaler from "./local-scaler.service.js";
import K8sExecutor from "./k8s-executor.service.js";

class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50;
    this.executionMode = process.env.EXECUTION_MODE || "LOCAL";
  }

  validateService(obj) {
    if (!obj.deployment || typeof obj.deployment !== "string") {
      throw new Error("deployment is required");
    }
    if (!obj.request_pods || isNaN(Number(obj.request_pods))) {
      throw new Error("request_pods must be valid number");
    }
    if (obj.request_pods <= 0) {
      throw new Error("request_pods must be > 0");
    }
  }

  calculateRequiredPods(requestPods) {
    return Math.max(1, Math.ceil(requestPods / this.POD_CAPACITY));
  }

  async scaleOneService({ deployment, request_pods }) {
    const required = this.calculateRequiredPods(request_pods);

    logger.info({
      event: "SCALING_DECISION_CALCULATED",
      deployment,
      request_pods,
      required_pods: required,
      execution_mode: this.executionMode,
    });

    if (this.executionMode === "K8S") {
      const result = await K8sExecutor.scaleDeployment(deployment, required);
      return { deployment, request_pods, required_pods: required, ...result };
    }

    const result = LocalScaler.simulateScaling(deployment, required);
    return { deployment, request_pods, required_pods: required, ...result };
  }

  async scaleMultiple(servicesArray) {
    const results = [];

    for (const svc of servicesArray) {
      this.validateService(svc);
      const res = await this.scaleOneService(svc);
      results.push(res);
    }

    return {
      mode: this.executionMode,
      results,
    };
  }
}

export default new ScalingService();
