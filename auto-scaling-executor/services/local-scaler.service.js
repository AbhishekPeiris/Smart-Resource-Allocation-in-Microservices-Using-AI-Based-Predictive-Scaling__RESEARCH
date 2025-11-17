import logger from "../utils/logger.js";

export class LocalScaler {
  constructor() {
    this.services = {};
  }

  simulateScaling(serviceName, requiredPods) {
    const previousState = this.services[serviceName] || { current: 0 };

    const newState = { current: requiredPods };
    this.services[serviceName] = newState;

    logger.info({
      event: "LOCAL_SCALING_SIMULATION",
      service: serviceName,
      previous_replicas: previousState.current,
      new_replicas: requiredPods,
      status: "SUCCESS",
    });

    return {
      service: serviceName,
      previous_replicas: previousState.current,
      required_replicas: requiredPods,
      message: "Scaled locally (simulation only)"
    };
  }
}

export default new LocalScaler();
