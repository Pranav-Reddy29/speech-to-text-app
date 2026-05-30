import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import {
  FaMicrophone,
  FaUpload,
  FaSearch,
  FaCopy,
  FaDownload,
  FaTrash,
  FaSignOutAlt,
} from "react-icons/fa";

import axios from "axios";

import toast from "react-hot-toast";

function Dashboard() {
  const [audio, setAudio] = useState(null);

  const [transcription, setTranscription] =
    useState("");

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);

  const [recording, setRecording] =
    useState(false);

  const [mediaRecorder, setMediaRecorder] =
    useState(null);

  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  // FETCH HISTORY
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/transcribe`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setHistory(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [token]);

  useEffect(() => {
  socket.on("connect", () => {
    console.log(
      "Connected to Socket Server"
    );
  });

  return () => {
    socket.off("connect");
  };
}, []);

  useEffect(() => {
    // defer calling fetchHistory to avoid setting state synchronously inside an effect
    const id = setTimeout(() => {
      fetchHistory();
    }, 0);

    return () => clearTimeout(id);
  }, [fetchHistory]);

  // START RECORDING
  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);

      let audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, {
          type: "audio/mp4",
        });

        const audioFile = new File(
          [audioBlob],
          "recording.mp4",
          {
            type: "audio/mp4",
          }
        );

        setAudio(audioFile);

        toast.success("Recording completed");
      };

      recorder.start();

      setMediaRecorder(recorder);

      setRecording(true);

      toast.success("Recording started");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    mediaRecorder.stop();

    setRecording(false);
  };

  // HANDLE UPLOAD
  const handleUpload = async () => {
    if (!audio) {
      toast.error("Please select audio");

      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("audio", audio);

      // UPLOAD AUDIO
      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/upload`,
        formData
      );

      // TRANSCRIBE AUDIO
      const transcribeRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/transcribe`,
        {
          audioPath: uploadRes.data.audioPath,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTranscription(
        transcribeRes.data.transcription
      );

      toast.success(
        "Transcription completed"
      );

      fetchHistory();

      setAudio(null);

      setLoading(false);
    } catch (error) {
      console.log(error);

      setLoading(false);

      toast.error("Transcription failed");
    }
  };

  // DELETE TRANSCRIPTION
  const handleDelete = async (id) => {
    try {
      await axios.delete(
  `${import.meta.env.VITE_API_URL}/api/transcribe/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Deleted successfully");

      fetchHistory();
    } catch {
      toast.error("Delete failed");
    }
  };

  // COPY TEXT
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);

    toast.success("Copied to clipboard");
  };

  // DOWNLOAD TXT
  const handleDownload = (text) => {
    const blob = new Blob([text], {
      type: "text/plain",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "transcription.txt";

    a.click();

    window.URL.revokeObjectURL(url);

    toast.success("Download started");
  };

  // SEARCH FILTER
  const filteredHistory = useMemo(() => {
  return history.filter((item) => {
    return (
      item.transcription
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      item.filename
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
}, [history, search]);

const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("token");

  toast.success("Logged out successfully 👋");

  setTimeout(() => {
    navigate("/login");
  }, 1000);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      {/* LOGOUT */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/logo.png"
            alt="logo"
            className="w-10 h-10 rounded-xl"
          />

          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            VoiceScribe AI
          </h1>
        </div>

  <button
  onClick={handleLogout}
  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-5 py-3 rounded-xl transition"
>
  <FaSignOutAlt />
  Logout
</button>
</div>

      {/* TITLE */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          AI Speech To Text
        </h1>

        <p className="text-gray-400 mt-4 text-lg">
          Upload • Record • Transcribe • Manage
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-2xl mx-auto mb-10">
  <FaSearch className="absolute left-5 top-5 text-gray-400" />

  <input
    type="text"
    placeholder="Search files or transcriptions..."
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    className="w-full pl-14 p-4 rounded-2xl bg-gray-900/70 backdrop-blur-md border border-gray-700 focus:border-blue-500 outline-none"
  />
</div>

      {/* UPLOAD SECTION */}
      <div className="flex flex-col items-center gap-6">
        <label className="w-full max-w-2xl h-52 border-2 border-dashed border-blue-500 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-500/10 transition">
  <input
    type="file"
    accept="audio/*"
    onChange={(e) =>
      setAudio(e.target.files[0])
    }
    className="hidden"
  />

  <FaUpload className="text-5xl mb-4 text-blue-400" />

  <p className="text-2xl font-semibold">
    Upload Audio File
  </p>

  <p className="text-gray-400 mt-2">
    MP3 • WAV • M4A
  </p>

  {audio && (
    <p className="mt-4 text-green-400">
      {audio.name}
    </p>
  )}
</label>

        {/* RECORDING */}
        <div className="flex gap-4">
          {!recording ? (
            <button
  onClick={startRecording}
  className="flex items-center gap-2 bg-green-500 px-6 py-3 rounded-xl hover:bg-green-600 transition"
>
  <FaMicrophone />
  Start Recording
</button>
          ) : (
            <button
  onClick={stopRecording}
  className="flex items-center gap-2 bg-red-500 px-6 py-3 rounded-xl hover:bg-red-600 transition"
>
  <FaMicrophone />
  Stop Recording
</button>
          )}
        </div>

        {/* TRANSCRIBE */}
        <button
  onClick={handleUpload}
  className="bg-gradient-to-r from-blue-500 to-cyan-500 px-10 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition"
>
  Upload & Transcribe
</button>

        {/* LOADING */}
        {loading && (
          <p className="text-yellow-400 text-xl animate-pulse">
            Transcribing Audio...
          </p>
        )}

        {/* LATEST */}
        {transcription && (
          <div className="bg-gray-900/80 p-6 rounded-2xl shadow-xl w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">
              Latest Transcription
            </h2>

            <p className="text-lg leading-8 text-gray-300">
              {transcription}
            </p>
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-16 mb-10">
  <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-2xl">
    <h3 className="text-gray-400">
      Total Files
    </h3>

    <p className="text-4xl font-bold">
      {history.length}
    </p>
  </div>

  <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-2xl">
    <h3 className="text-gray-400">
      Latest Result
    </h3>

    <p className="text-2xl font-bold">
      {transcription
        ? "Available"
        : "None"}
    </p>
  </div>

  <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-2xl">
    <h3 className="text-gray-400">
      Search Results
    </h3>

    <p className="text-4xl font-bold">
      {filteredHistory.length}
    </p>
  </div>
</div>

      {/* HISTORY */}
      <div className="mt-16">
        <h2 className="text-4xl font-bold mb-8">
          History
        </h2>

        <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-gray-800 hover:border-blue-500 transition">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div
                key={item._id}
                className="bg-gray-900/80 p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition duration-300"
              >
                <h3 className="text-xl font-bold mb-3">
                  {item.filename}
                </h3>

                <audio
                  controls
                  className="w-full mb-4"
                >
                  <source
                    src={`${import.meta.env.VITE_API_URL}/${item.audioPath}`}
                  />
                </audio>

                <p className="text-gray-300 leading-7 mb-4">
                  {item.transcription}
                </p>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-3">
                  <button
  onClick={() =>
    handleCopy(item.transcription)
  }
  className="flex items-center gap-2 bg-blue-500 px-4 py-2 rounded-xl"
>
  <FaCopy />
  Copy
</button>

                  <button
  onClick={() =>
    handleDownload(item.transcription)
  }
  className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-xl"
>
  <FaDownload />
  Download
</button>

                  <button
  onClick={() =>
    handleDelete(item._id)
  }
  className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-xl"
>
  <FaTrash />
  Delete
</button>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  {new Date(
                    item.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-gray-900 p-8 rounded-lg text-center">
              <p className="text-gray-400 text-xl">
                No transcription history
                found 🎙️
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;