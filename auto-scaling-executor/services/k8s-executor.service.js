import logger from "../utils/logger.js";
import { exec } from "child_process";

class K8sExecutor {
  constructor() {
    this.namespace = "default";
  }

  // Run shell command + return promise
  runCommand(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          logger.error({ event: "K8S_CMD_ERROR", error: stderr });
          return reject(stderr);
        }
        return resolve(stdout);
      });
    });
  }

  // STEP 1 — Get current replicas
  async getCurrentReplicas(deploymentName) {
    const cmd = `kubectl get deploy ${deploymentName} -o=jsonpath='{.spec.replicas}'`;

    logger.info({ event: "K8S_GET_REPLICAS", cmd });

    try {
      const output = await this.runCommand(cmd);
      return parseInt(output.replace(/'/g, ""));
    } catch (err) {
      return 0;
    }
  }

  // STEP 2 — Apply scaling
  async scaleDeployment(deploymentName, replicas) {
    const cmd = `kubectl scale deploy ${deploymentName} --replicas=${replicas}`;

    logger.info({
      event: "K8S_SCALE_CMD",
      cmd,
      deployment: deploymentName,
      replicas,
    });

    await this.runCommand(cmd);

    logger.info({
      event: "K8S_SCALE_SUCCESS",
      deployment: deploymentName,
      replicas,
    });

    return { success: true, newReplicas: replicas };
  }

  // STEP 3 — Verify scaling
  async verifyScaling(deploymentName) {
    const cmd = `kubectl get deploy ${deploymentName} -o=jsonpath='{.status.availableReplicas}'`;

    logger.info({ event: "K8S_VERIFY_CMD", cmd });

    const output = await this.runCommand(cmd);

    const available = parseInt(output.replace(/'/g, "")) || 0;

    return {
      available: available > 0,
      available_replicas: available,
    };
  }

  // HIGH-LEVEL method to call from controller
  async performScaling(deploymentName, replicas) {
    const previous = await this.getCurrentReplicas(deploymentName);

    await this.scaleDeployment(deploymentName, replicas);

    const verification = await this.verifyScaling(deploymentName);

    return {
      deployment: deploymentName,
      previous_replicas: previous,
      new_replicas: replicas,
      verification,
    };
  }
}

export default new K8sExecutor();
