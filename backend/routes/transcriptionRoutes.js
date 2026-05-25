const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
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

    res.status(200).json({
      transcription,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      message: "Transcription failed",
    });
  }
});

module.exports = router;