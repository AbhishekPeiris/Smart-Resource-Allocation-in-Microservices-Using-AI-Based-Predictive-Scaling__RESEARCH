import dotenv from "dotenv";
dotenv.config();               // MUST BE FIRST LINE

import express from "express";
import scaleRoutes from "./api/scale.controller.js";

console.log("MODE:", process.env.EXECUTION_MODE);

const app = express();
app.use(express.json());

app.use("/api/v1", scaleRoutes);

app.listen(6000, () => {
  console.log("Auto Scaling Executor running on port 6000");
});
