const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");

require("dotenv").config();

const connectDB = require("./config/db");

const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const transcriptionRoutes = require("./routes/transcriptionRoutes");

const app = express();

// CREATE HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// SOCKET EVENTS
io.on("connection", (socket) => {
  console.log("Client Connected");

  socket.on("disconnect", () => {
    console.log("Client Disconnected");
  });
});

// CONNECT DATABASE
connectDB();

// MIDDLEWARES
app.use(cors());

app.use(express.json());

// SERVE AUDIO FILES
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ROUTES
app.use("/api/upload", uploadRoutes);

app.use("/api/auth", authRoutes);

app.use(
  "/api/transcribe",
  transcriptionRoutes
);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send(
    "Backend Running Successfully 🚀"
  );
});

// PORT
const PORT =
  process.env.PORT || 5000;

// IMPORTANT:
// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});