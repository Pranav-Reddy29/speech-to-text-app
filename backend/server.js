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
const { createClient } =
  require("@deepgram/sdk");

const deepgram = createClient(
  process.env.DEEPGRAM_API_KEY
);

io.on("connection", (socket) => {
  console.log("Client Connected");

  let deepgramConnection;

  socket.on(
  "audio-stream",
  async (audioChunk) => {

    console.log(
      "Audio chunk received:",
      audioChunk.byteLength
    );

    try {

        if (!deepgramConnection) {

          deepgramConnection =
            deepgram.listen.live({
              model: "nova-2",
              language: "en",
              smart_format: true,
            });

          deepgramConnection.on(
  "transcript",
  (data) => {

    console.log(
      "Deepgram Response:",
      JSON.stringify(data, null, 2)
    );

    const transcript =
      data.channel?.alternatives?.[0]
        ?.transcript;

    if (
      transcript &&
      transcript.length > 0
    ) {

      console.log(
        "Transcript:",
        transcript
      );

      socket.emit(
        "transcript",
        transcript
      );
    }
  }
);
        }

        deepgramConnection.send(
          Buffer.from(audioChunk)
        );

      } catch (error) {
        console.log(error);
      }
    }
  );

  socket.on("disconnect", () => {

    if (deepgramConnection) {
      deepgramConnection.finish();
    }

    console.log(
      "Client Disconnected"
    );
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