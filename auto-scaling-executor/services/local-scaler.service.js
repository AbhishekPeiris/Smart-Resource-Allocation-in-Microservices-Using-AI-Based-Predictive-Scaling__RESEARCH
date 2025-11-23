import logger from "../utils/logger.js";

class LocalScaler {
  constructor() {
    this.services = {};
  }

  simulateScaling(deployment, replicas) {
    const prev = this.services[deployment]?.current ?? 0;

    this.services[deployment] = { current: replicas };

    logger.info({
      event: "LOCAL_SCALING_SIMULATION",
      deployment,
      previous_replicas: prev,
      required_replicas: replicas,
      status: "SUCCESS",
    });

    return {
      status: "SUCCESS",
      previous_replicas: prev,
      required_replicas: replicas,
      message: "Scaled locally (simulation only)",
    };
  }
}

export default new LocalScaler();
