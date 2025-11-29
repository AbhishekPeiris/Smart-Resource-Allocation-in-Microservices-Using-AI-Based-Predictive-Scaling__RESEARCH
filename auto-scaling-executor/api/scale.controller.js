import express from "express";
import ScalingService from "../services/scaling.service.js";

const router = express.Router();

router.post("/scale", async (req, res) => {
  try {
    const body = req.body;

    // Multi-service request
    if (Array.isArray(body.services)) {
      const result = await ScalingService.scaleMultiple(body.services);
      return res.status(200).json(result);
    }

    // Single service request
    const singleService = [{
      deployment: body.deployment,
      request_pods: body.request_pods
    }];

    const result = await ScalingService.scaleMultiple(singleService);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/scale-with-metrics
router.post("/scale-with-metrics", async (req, res) => {
  try {
    const body = req.body;

    // Multi-service with metrics
    if (Array.isArray(body.services)) {

      const results = [];
      for (const svc of body.services) {
        const r = await ScalingService.scaleOneWithMetrics(svc);
        results.push(r);
      }

      return res.status(200).json({
        mode: ScalingService.mode,
        results
      });
    }

    // Single service with metrics
    const result = await ScalingService.scaleOneWithMetrics({
      deployment: body.deployment,
      request_pods: body.request_pods,
      metrics: body.metrics || {}
    });

    return res.status(200).json({
      mode: ScalingService.mode,
      results: [result]
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
