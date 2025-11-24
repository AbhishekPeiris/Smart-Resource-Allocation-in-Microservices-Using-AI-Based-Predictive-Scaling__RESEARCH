import LocalScaler from "./local-scaler.service.js";
import K8sExecutor from "./k8s-executor.service.js";

class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50;
    this.mode = process.env.EXECUTION_MODE || "LOCAL";
  }

  validate(obj) {
    if (!obj.deployment) throw new Error("deployment is required");
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
    const required = this.calculatePods(request_pods);

    if (this.mode === "K8S") {
      return await K8sExecutor.scaleDeployment(deployment, required);
    }

    return LocalScaler.simulateScaling(deployment, required);
  }

  async scaleMultiple(services) {
    const results = [];

    for (const svc of services) {
      const result = await this.scaleOne(svc);
      results.push(result);
    }

    return { mode: this.mode, results };
  }
}

export default new ScalingService();
