import logger from "../utils/logger.js";

class LocalScaler {
  constructor() {
    // in-memory store for simulation
    this.services = {};
  }

  simulateScaling(serviceName, requiredPods) {
    const previousState = this.services[serviceName] || { current: 0 };

    const newState = {
      current: requiredPods
    };

    this.services[serviceName] = newState;

    // structured log
    logger.info({
      event: "LOCAL_SCALING_SIMULATION",
      service: serviceName,
      previous_replicas: previousState.current,
      required_replicas: requiredPods,
      status: "SUCCESS"
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
