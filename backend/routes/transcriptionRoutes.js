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

module.exports = router;