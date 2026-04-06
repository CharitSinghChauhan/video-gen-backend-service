import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// In your main app
router.get("/health/cdc", (req, res) => {
  // Check if CDC worker is running
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
