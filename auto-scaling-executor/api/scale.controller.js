import express from "express";
import K8sExecutor from "../services/k8s-executor.service.js";

const router = express.Router();

/**
 * POST /api/v1/scale
 */
router.post("/scale", async (req, res) => {
  try {
    const { deployment, request_pods } = req.body;

    if (!deployment || !request_pods) {
      return res.status(400).json({
        error: "deployment and request_pods fields are required",
      });
    }

    // Calculation
    const POD_CAPACITY = 50;
    const requiredPods = Math.ceil(request_pods / POD_CAPACITY);

    // CONNECT K8s Executor
    const result = await K8sExecutor.performScaling(
      deployment,
      requiredPods
    );

    return res.json({
      service: deployment,
      previous_replicas: result.previous_replicas,
      required_replicas: result.new_replicas,
      scaled: result.scaling_applied,
      verification: result.verify,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Scaling failed" });
  }
});

export default router;
