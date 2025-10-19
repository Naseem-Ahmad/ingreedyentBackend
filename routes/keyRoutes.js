import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Here is your secure key (fetched from backend)",
    key: process.env.SECRET_KEY || "not found",
  });
});

// ✅ export router as the default export
export default router;
