// services/k8s-executor.service.js
import { KubeConfig, AppsV1Api } from "@kubernetes/client-node";
import logger from "../utils/logger.js";

class K8sExecutor {
  constructor() {
    const kc = new KubeConfig();
    // Reads from KUBECONFIG or in-cluster config
    kc.loadFromDefault();

    this.appsApi = kc.makeApiClient(AppsV1Api);
    this.namespace = process.env.K8S_NAMESPACE || "default";
  }

  async getCurrentReplicas(deployment) {
    try {
      const res = await this.appsApi.readNamespacedDeployment(
        deployment,
        this.namespace
      );
      return res.body?.spec?.replicas ?? 0;
    } catch (err) {
      logger.error({
        event: "K8S_GET_REPLICAS_FAILED",
        deployment,
        namespace: this.namespace,
        error: err.message,
      });
      // If cannot read, assume 0
      return 0;
    }
  }

  async scaleDeployment(deployment, replicas) {
    const previousReplicas = await this.getCurrentReplicas(deployment);

    const patchBody = {
      spec: {
        replicas,
      },
    };

    try {
      await this.appsApi.patchNamespacedDeployment(
        deployment,
        this.namespace,
        patchBody,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            "Content-Type": "application/strategic-merge-patch+json",
          },
        }
      );

      logger.info({
        event: "K8S_SCALING_EXECUTED",
        deployment,
        namespace: this.namespace,
        previous_replicas: previousReplicas,
        required_replicas: replicas,
        status: "SUCCESS",
      });

      return {
        status: "SUCCESS",
        previous_replicas: previousReplicas,
        required_replicas: replicas,
      };
    } catch (err) {
      logger.error({
        event: "K8S_SCALING_FAILED",
        deployment,
        namespace: this.namespace,
        previous_replicas: previousReplicas,
        required_replicas: replicas,
        error: err.message,
      });

      return {
        status: "FAILED",
        previous_replicas: previousReplicas,
        required_replicas: replicas,
        error: err.message,
      };
    }
  }
}

export default new K8sExecutor();
