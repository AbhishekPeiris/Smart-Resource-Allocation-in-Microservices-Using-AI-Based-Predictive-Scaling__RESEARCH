import logger from "../utils/logger.js";
import LocalScaler from "./local-scaler.service.js";

class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50; // 1 pod can handle 50 "request_pods"
  }

  /**
   * Main function for this step:
   * 1. validate inputs
   * 2. calculate required pods
   * 3. delegate to LocalScaler
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
      required_pods: requiredPods
    });

    // 3) simulate local scaling (later replace with real K8s executor)
    const simulationResult = LocalScaler.simulateScaling(
      deployment,
      requiredPods
    );

    // 4) return unified response object
    return simulationResult;
  }

  validate(deployment, requestPods) {
    if (!deployment || typeof deployment !== "string") {
      throw new Error("deployment is required and must be a string");
    }

    if (
      requestPods === undefined ||
      requestPods === null ||
      isNaN(Number(requestPods)) ||
      Number(requestPods) <= 0
    ) {
      throw new Error("request_pods must be a positive number");
    }
  }

  calculateRequiredPods(requestPods) {
    return Math.ceil(Number(requestPods) / this.POD_CAPACITY);
  }
}

export default new ScalingService();
