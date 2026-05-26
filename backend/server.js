const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const connectDB = require("./config/db");

const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const transcriptionRoutes = require("./routes/transcriptionRoutes");

const app = express();

// CONNECT DATABASE
connectDB();

// MIDDLEWARES
app.use(cors());

app.use(express.json());

// SERVE UPLOADED AUDIO FILES
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ROUTES
app.use("/api/upload", uploadRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/transcribe", transcriptionRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

// PORT
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});