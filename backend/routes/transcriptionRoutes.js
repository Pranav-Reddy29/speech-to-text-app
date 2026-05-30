const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const protect = require("../middleware/authMiddleware");

const Transcription = require("../models/Transcription");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const audioPath = path.join(
      __dirname,
      "..",
      req.body.audioPath
    );

    const audioFile = fs.readFileSync(audioPath);

    const response = await axios.post(
      "https://api.deepgram.com/v1/listen",
      audioFile,
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/mp4",
        },
      }
    );

    const transcription =
      response.data.results.channels[0]
        .alternatives[0].transcript;

    // SAVE TO DATABASE
    const savedTranscription =
      await Transcription.create({
        user: req.user,
        filename: path.basename(audioPath),
        audioPath: req.body.audioPath,
        transcription,
      });

    res.status(200).json({
      transcription,
      savedTranscription,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      message: "Transcription failed",
    });
  }
});


// GET USER HISTORY
router.get("/", protect, async (req, res) => {
  try {
    const transcriptions =
      await Transcription.find({
        user: req.user,
      }).sort({ createdAt: -1 });

    res.status(200).json(transcriptions);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// DELETE TRANSCRIPTION
router.delete("/:id", protect, async (req, res) => {
  try {
    const transcription =
      await Transcription.findById(req.params.id);

    if (!transcription) {
      return res.status(404).json({
        message: "Transcription not found",
      });
    }

    // CHECK USER OWNERSHIP
    if (
      transcription.user.toString() !== req.user
    ) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    await transcription.deleteOne();

    res.status(200).json({
      message: "Transcription deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post(
  "/save-live",
  protect,
  async (req, res) => {
    try {

      const saved =
        await Transcription.create({
          user: req.user,
          filename:
            `Live-${Date.now()}.txt`,
          audioPath: "live",
          transcription:
            req.body.transcript,
        });

      res.status(201).json(saved);

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;