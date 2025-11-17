import express from "express";
import LocalScaler from "../services/local-scaler.service.js";

const router = express.Router();

router.post("/scale", (req, res) => {
  const { deployment, request_pods } = req.body;

  if (!deployment || !request_pods) {
    return res.status(400).json({
      error: "deployment and request_pods are required",
    });
  }

  const POD_CAPACITY = 50;
  const requiredPods = Math.ceil(request_pods / POD_CAPACITY);

  // LOCAL scaling simulation
  const scalingResult = LocalScaler.simulateScaling(deployment, requiredPods);

  return res.json({
    ...scalingResult,
  });
});

export default router;
