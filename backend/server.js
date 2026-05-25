const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const transcriptionRoutes = require("./routes/transcriptionRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transcribe", transcriptionRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});