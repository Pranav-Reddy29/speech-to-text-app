import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMicrophone,
  FaUpload,
  FaSearch,
  FaCopy,
  FaTrash,
  FaDownload,
  FaSignOutAlt,
} from "react-icons/fa";

import axios from "axios";

import toast from "react-hot-toast";

function Dashboard() {
  const [audio, setAudio] = useState(null);

  const [, setTranscription] = useState("");

  const [currentTranscript, setCurrentTranscript] =
  useState("");

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [liveTranscript, setLiveTranscript] =
  useState("");

const [isLiveRecording, setIsLiveRecording] =
  useState(false);
  
const recordingRef = useRef(false);

const recognitionRef = useRef(null);

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
    // defer calling fetchHistory to avoid setting state synchronously inside an effect
    const id = setTimeout(() => {
      fetchHistory();
    }, 0);

    return () => clearTimeout(id);
  }, [fetchHistory]);

const startLiveRecording = () => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    toast.error(
      "Speech Recognition is not supported in this browser"
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    recordingRef.current = true;
    setIsLiveRecording(true);
    setLiveTranscript("");

    toast.success(
      "Live transcription started"
    );
  };

  recognition.onresult = (event) => {
  let transcript = "";

  for (
    let i = 0;
    i < event.results.length;
    i++
  ) {
    transcript +=
      event.results[i][0].transcript +
      " ";
  }

  setLiveTranscript(transcript);

  setCurrentTranscript(transcript);
};

  recognition.onerror = (event) => {
    console.log(
      "Speech Recognition Error:",
      event.error
    );

    if (event.error !== "aborted") {
      toast.error(
        "Speech recognition error"
      );
    }
  };

  recognition.onend = () => {

  if (!recordingRef.current) return;

  setTimeout(() => {

    try {
      recognition.start();

      console.log(
        "Recognition restarted"
      );

    } catch (err) {

      console.log(
        "Restart failed",
        err
      );

    }

  }, 300);

};

  recognition.start();

  recognitionRef.current = recognition;
};

const stopLiveRecording = () => {
  recordingRef.current = false;

  if (recognitionRef.current) {
    recognitionRef.current.onend = null;
    recognitionRef.current.stop();
  }

  setIsLiveRecording(false);

  toast.success(
    "Live transcription stopped"
  );
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

      setCurrentTranscript(
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

const saveLiveTranscript = async () => {
  try {
    if (!liveTranscript.trim()) {
      toast.error("No transcript available");
      return;
    }

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/transcribe/save-live`,
      {
        transcript: liveTranscript,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast.success("Live transcript saved");

    setLiveTranscript("");
    setCurrentTranscript("");

    fetchHistory();
  } catch (error) {
    console.log(error);
    toast.error("Save failed");
  }
};

  // SEARCH FILTER
  const filteredHistory = useMemo(() => {
  const term = search.trim().toLowerCase();

  if (!term) return history;

  return history.filter((item) =>
    item.filename?.toLowerCase().includes(term) ||
    item.transcription?.toLowerCase().includes(term)
  );
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-6">
      {/* LOGOUT */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
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
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
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

{search.trim() ? (
  /* SEARCH MODE */
  <div className="mt-10">
    <h2 className="text-3xl font-bold text-cyan-400 mb-6">
      Search Results ({filteredHistory.length})
    </h2>

    <div className="space-y-6">
      {filteredHistory.length > 0 ? (
        filteredHistory.map((item) => (
          <div
            key={item._id}
            className="bg-gray-900/70 border border-cyan-500/20 p-6 rounded-2xl"
          >
            <h3 className="text-xl font-bold mb-4">
              {item.filename}
            </h3>

            {item.audioPath !== "live" && (
              <audio controls className="w-full mb-4">
                <source
                  src={`${import.meta.env.VITE_API_URL}/${item.audioPath}`}
                />
              </audio>
            )}

            <p className="text-gray-300 mb-4">
              {item.transcription}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  handleCopy(item.transcription)
                }
                className="bg-blue-500 px-4 py-2 rounded-xl"
              >
                Copy
              </button>

              <button
                onClick={() =>
                  handleDownload(item.transcription)
                }
                className="bg-green-500 px-4 py-2 rounded-xl"
              >
                Download
              </button>

              <button
                onClick={() =>
                  handleDelete(item._id)
                }
                className="bg-red-500 px-4 py-2 rounded-xl"
              >
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
        <div className="bg-gray-900 p-8 rounded-2xl text-center">
          <p className="text-gray-400 text-xl">
            No matching files found
          </p>
        </div>
      )}
    </div>
  </div>
) : (
  <>
  {/* MAIN SECTION */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">

  {/* LEFT PANEL */}

  <div className="space-y-6">

    <label className="w-full h-48 md:h-72 border-2 border-dashed border-cyan-500 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-500/10 transition">

      <input
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) =>
          setAudio(e.target.files[0])
        }
      />

      <FaUpload className="text-6xl text-cyan-400 mb-4" />

      <h2 className="text-2xl font-bold">
        Upload Audio File
      </h2>

      <p className="text-gray-400 mt-2">
        MP3 • WAV • M4A
      </p>

      {audio && (
        <p className="mt-4 text-green-400">
          {audio.name}
        </p>
      )}

    </label>

    <button
      onClick={
        isLiveRecording
          ? stopLiveRecording
          : startLiveRecording
      }
      className={`w-full py-4 rounded-2xl text-lg font-bold transition ${
        isLiveRecording
          ? "bg-red-500 hover:bg-red-600"
          : "bg-green-500 hover:bg-green-600"
      }`}
    >
      <FaMicrophone className="inline mr-2" />

      {isLiveRecording
        ? "Stop Recording"
        : "Start Recording"}
    </button>

    {isLiveRecording && (
      <div className="bg-gray-900/70 rounded-2xl p-6">

        <div className="flex justify-center items-end gap-2 h-20">

          <div className="w-2 bg-cyan-400 rounded animate-bounce h-8"></div>

          <div
            className="w-2 bg-cyan-400 rounded animate-bounce h-14"
            style={{
              animationDelay: "0.1s",
            }}
          ></div>

          <div
            className="w-2 bg-cyan-400 rounded animate-bounce h-10"
            style={{
              animationDelay: "0.2s",
            }}
          ></div>

          <div
            className="w-2 bg-cyan-400 rounded animate-bounce h-16"
            style={{
              animationDelay: "0.3s",
            }}
          ></div>

          <div
            className="w-2 bg-cyan-400 rounded animate-bounce h-8"
            style={{
              animationDelay: "0.4s",
            }}
          ></div>

        </div>

        <p className="text-center text-cyan-400 mt-4">
          Listening...
        </p>

      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      <button
        onClick={handleUpload}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 py-4 rounded-2xl font-bold hover:scale-105 transition"
      >
        Upload & Transcribe
      </button>

      <button
        onClick={saveLiveTranscript}
        className="bg-cyan-500 py-4 rounded-2xl font-bold hover:bg-cyan-600 transition"
      >
        Save Transcript
      </button>

    </div>

    {loading && (
      <div className="text-center text-yellow-400 animate-pulse">
        Transcribing Audio...
      </div>
    )}

  </div>

  {/* RIGHT PANEL */}

  <div className="bg-gray-900/70 backdrop-blur-md border border-cyan-500/20 rounded-3xl p-8">

    <div className="flex justify-between items-center mb-6">

      <h2 className="text-3xl font-bold text-cyan-400">
        Transcript
      </h2>

      <div className="flex gap-2">

        <button
          onClick={() =>
            handleCopy(
              currentTranscript
            )
          }
          className="bg-blue-500 px-4 py-2 rounded-xl"
        >
          <FaCopy />
        </button>

        <button
          onClick={() =>
            handleDownload(
              currentTranscript
            )
          }
          className="bg-green-500 px-4 py-2 rounded-xl"
        >
          <FaDownload />
        </button>

      </div>

    </div>

    <div className="min-h-[300px] max-h-[400px] md:min-h-[500px] md:max-h-[500px] overflow-y-auto">

      <p className="text-gray-300 leading-8 whitespace-pre-wrap">

        {currentTranscript ||

          "Upload an audio file or start recording to view transcription here..."}

      </p>

    </div>

  </div>

</div>

{/* STATS */}

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12 mb-10">

  <div className="bg-gray-900/70 p-6 rounded-2xl">
    <h3 className="text-gray-400">
      Total Files
    </h3>

    <p className="text-4xl font-bold">
      {history.length}
    </p>
  </div>

  <div className="bg-gray-900/70 p-6 rounded-2xl">
    <h3 className="text-gray-400">
      Current Transcript
    </h3>

    <p className="text-2xl font-bold">
      {currentTranscript
        ? "Ready"
        : "Empty"}
    </p>
  </div>

  <div className="bg-gray-900/70 p-6 rounded-2xl">
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

  <div className="space-y-6">
    {filteredHistory.length > 0 ? (
      filteredHistory.map((item) => (
        <div
          key={item._id}
          className="bg-gray-900/70 p-6 rounded-2xl"
        >
          <h3 className="text-xl font-bold mb-4">
            {item.filename}
          </h3>

          {item.audioPath !== "live" && (
            <audio
              controls
              className="w-full mb-4"
            >
              <source
                src={`${import.meta.env.VITE_API_URL}/${item.audioPath}`}
              />
            </audio>
          )}

          <p className="text-gray-300 mb-4">
            {item.transcription}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                handleCopy(item.transcription)
              }
              className="bg-blue-500 px-4 py-2 rounded-xl"
            >
              Copy
            </button>

            <button
              onClick={() =>
                handleDownload(item.transcription)
              }
              className="bg-green-500 px-4 py-2 rounded-xl"
            >
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
      <div className="bg-gray-900 p-8 rounded-xl text-center">
        No transcription history found
      </div>
    )}
  </div>
</div>
</>
)}
    </div>
  );
}

export default Dashboard;