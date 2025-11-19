import express from "express";
import scaleRoutes from "./api/scale.controller.js";

const app = express();
app.use(express.json());

// Register routing group
app.use("/api/v1", scaleRoutes);

app.listen(6000, () => {
  console.log("Auto Scaling Executor running on port 6000");
});
