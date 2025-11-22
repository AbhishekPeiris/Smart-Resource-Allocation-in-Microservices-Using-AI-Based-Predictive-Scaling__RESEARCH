import express from "express";
import ScalingService from "../services/scaling.service.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * POST /api/v1/scale
 * Body:
 * {
 *   "deployment": "product-service",
 *   "request_pods": 250
 * }
 *
 * Response:
 * {
 *   "service": "product-service",
 *   "previous_replicas": 0,
 *   "required_replicas": 5,
 *   "message": "Scaled locally (simulation only)"
 * }
 */
router.post("/scale", async (req, res) => {
  try {
    const { deployment, request_pods } = req.body;

    const result = await ScalingService.handleScalingRequest(
      deployment,
      request_pods
    );

    return res.status(200).json(result);
  } catch (err) {
    logger.error({
      event: "SCALING_REQUEST_FAILED",
      error: err.message,
      body: req.body
    });

    return res.status(400).json({
      error: err.message || "Failed to process scaling request"
    });
  }
});

export default router;
