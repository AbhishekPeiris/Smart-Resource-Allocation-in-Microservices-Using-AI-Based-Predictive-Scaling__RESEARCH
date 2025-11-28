import LocalScaler from "./local-scaler.service.js"
import K8sExecutor from "./k8s-executor.service.js"

class ScalingService {
  constructor() {
    this.POD_CAPACITY = 50
    // Read mode dynamically instead of in constructor
  }

  getMode() {
    return process.env.EXECUTION_MODE || "LOCAL"
  }

  validate(obj) {
    if (!obj.deployment || typeof obj.deployment !== "string" || obj.deployment.trim() === "") {
      throw new Error("deployment is required and must be a non-empty string")
    }
    if (!obj.request_pods || isNaN(Number(obj.request_pods))) {
      throw new Error("request_pods must be a valid number")
    }
    if (obj.request_pods <= 0) throw new Error("request_pods must be > 0")
  }

  calculatePods(requestPods) {
    return Math.max(1, Math.ceil(requestPods / this.POD_CAPACITY))
  }

  async scaleOne({ deployment, request_pods }) {
    this.validate({ deployment, request_pods })
    const additionalPods = this.calculatePods(request_pods)
    const mode = this.getMode()

    console.log("ScalingService executing in mode:", mode)

    if (mode === "K8S") {
      return await K8sExecutor.scaleDeploymentIncremental(deployment, additionalPods)
    }

    return LocalScaler.simulateScaling(deployment, additionalPods)
  }

  async scaleMultiple(services) {
    const results = []

    for (const svc of services) {
      const result = await this.scaleOne(svc)
      results.push(result)
    }

    return { mode: this.getMode(), results }
  }
}

export default new ScalingService()
