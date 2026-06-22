const express = require("express");
const router = express.Router();
const Sos = require("../models/Sos");

// SOS SAVE
router.post("/", async (req, res) => {
  const { latitude, longitude, triage } = req.body;

  try {
    const sos = await Sos.create({
      latitude,
      longitude,
      triage: triage || 'medium',
    });

    res.json(sos);
  } catch (err) {
    console.error('Failed to create SOS', err);
    res.status(500).json({ error: 'Failed to create SOS' });
  }
});

// HISTORY
router.get("/", async (req, res) => {
  const data = await Sos.find().sort({ createdAt: -1 });
  res.json(data);
});

module.exports = router;