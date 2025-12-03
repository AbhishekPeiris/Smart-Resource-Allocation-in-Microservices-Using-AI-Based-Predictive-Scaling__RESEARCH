import express from "express";
import ScalingService from "../services/scaling.service.js";

const router = express.Router();

router.post("/scale-with-metrics", async (req, res) => {
  try {
    const body = req.body;

    // Multi-service
    if (Array.isArray(body.services)) {
      const results = [];
      for (const svc of body.services) {
        const r = await ScalingService.scaleOneWithMetrics(svc);
        results.push(r);
      }
      return res.status(200).json({
        mode: ScalingService.getMode(),
        results
      });
    }

    // Single-service
    const result = await ScalingService.scaleOneWithMetrics({
      deployment: body.deployment,
      request_pods: body.request_pods,
      metrics: body.metrics || {}
    });

    return res.status(200).json({
      mode: ScalingService.getMode(),
      results: [result]
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
