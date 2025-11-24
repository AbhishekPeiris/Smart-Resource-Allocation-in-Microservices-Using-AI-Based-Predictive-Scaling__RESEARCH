import { KubeConfig, AppsV1Api } from "@kubernetes/client-node";
import logger from "../utils/logger.js";

class K8sExecutor {
  constructor() {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    this.appsApi = kc.makeApiClient(AppsV1Api);
    this.ns = process.env.K8S_NAMESPACE || "default";
  }

  async getCurrentReplicas(deployment) {
    try {
      const res = await this.appsApi.readNamespacedDeployment(deployment, this.ns);
      return res.body?.spec?.replicas ?? 0;
    } catch (err) {
      logger.error({ event: "K8S_GET_FAILED", deployment, error: err.message });
      return 0;
    }
  }

  async scaleDeployment(deployment, replicas) {
    const previous = await this.getCurrentReplicas(deployment);
    const patchBody = { spec: { replicas } };

    try {
      await this.appsApi.patchNamespacedDeployment(
        deployment,
        this.ns,
        patchBody,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { "Content-Type": "application/strategic-merge-patch+json" } }
      );

      logger.info({
        event: "SCALING_EXECUTED_K8S",
        deployment,
        previous_replicas: previous,
        required_replicas: replicas,
        status: "SUCCESS"
      });

      return {
        deployment,
        previous_replicas: previous,
        required_replicas: replicas,
        status: "SUCCESS"
      };

    } catch (err) {
      logger.error({
        event: "SCALING_FAILED_K8S",
        deployment,
        previous_replicas: previous,
        required_replicas: replicas,
        error: err.message
      });

      return {
        deployment,
        previous_replicas: previous,
        required_replicas: replicas,
        status: "FAILED",
        error: err.message
      };
    }
  }
}

export default new K8sExecutor();
