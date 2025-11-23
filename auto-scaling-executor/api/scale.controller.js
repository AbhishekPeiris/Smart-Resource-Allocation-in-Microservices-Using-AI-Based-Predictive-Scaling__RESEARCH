import express from "express";
import ScalingService from "../services/scaling.service.js";

const router = express.Router();

router.post("/scale", async (req, res) => {
  try {
    const body = req.body;

    // MULTIPLE SERVICES
    if (Array.isArray(body.services)) {
      const result = await ScalingService.scaleMultiple(body.services);
      return res.status(200).json(result);
    }

    // SINGLE SERVICE
    const single = {
      deployment: body.deployment,
      request_pods: body.request_pods,
    };

    const result = await ScalingService.scaleMultiple([single]);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
