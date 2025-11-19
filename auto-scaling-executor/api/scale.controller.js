import express from "express";

const router = express.Router();

/**
 * POST /api/v1/scale
 * Request:
 * {
 *   "deployment": "product",
 *   "request_pods": 300
 * }
 *
 * Response:
 * {
 *   "service": "product",
 *   "required_pods": 6
 * }
 */
router.post("/scale", (req, res) => {
  const { deployment, request_pods } = req.body;

  if (!deployment || !request_pods) {
    return res.status(400).json({
      error: "deployment and request_pods are required",
    });
  }

  const POD_CAPACITY = 50;
  const requiredPods = Math.ceil(request_pods / POD_CAPACITY);

  return res.json({
    service: deployment,
    required_pods: requiredPods,
  });
});

export default router;
