// services/scaling.service.js
import logger from "../utils/logger.js";
import LocalScaler from "./local-scaler.service.js";
import K8sExecutor from "./k8s-executor.service.js";

class ScalingService {
  constructor() {
    // 1 pod can handle 50 "request_pods"
    this.POD_CAPACITY = 50;

    // "LOCAL" | "K8S"
    this.executionMode = process.env.EXECUTION_MODE || "LOCAL";
  }

  /**
   * 1. validate inputs
   * 2. calculate required pods
   * 3. delegate to LocalScaler or K8sExecutor
   * 4. return structured result
   */
  async handleScalingRequest(deployment, requestPods) {
    // 1) validate
    this.validate(deployment, requestPods);

    // 2) calculate required pods
    const requiredPods = this.calculateRequiredPods(requestPods);

    logger.info({
      event: "SCALING_DECISION_CALCULATED",
      deployment,
      request_pods: requestPods,
      required_pods: requiredPods,
      execution_mode: this.executionMode,
    });

    // 3) execute based on mode
    if (this.executionMode === "K8S") {
      // Real Kubernetes scaling
      const result = await K8sExecutor.scaleDeployment(deployment, requiredPods);

      return {
        mode: "K8S",
        deployment,
        request_pods: requestPods,
        required_pods: requiredPods,
        ...result,
      };
    } else {
      // Local simulation (your LocalScaler)
      const simulationResult = LocalScaler.simulateScaling(
        deployment,
        requiredPods
      );

      return {
        mode: "LOCAL",
        deployment,
        request_pods: requestPods,
        required_pods: requiredPods,
        ...simulationResult,
      };
    }
  }

  validate(deployment, requestPods) {
    if (!deployment || typeof deployment !== "string") {
      throw new Error("deployment name is required and must be a string");
    }

    if (
      requestPods === undefined ||
      requestPods === null ||
      Number.isNaN(Number(requestPods))
    ) {
      throw new Error("requestPods is required and must be a number");
    }

    if (requestPods <= 0) {
      throw new Error("requestPods must be greater than 0");
    }
  }

  calculateRequiredPods(requestPods) {
    const pods = Math.ceil(requestPods / this.POD_CAPACITY);
    return pods < 1 ? 1 : pods;
  }
}

export default new ScalingService();
