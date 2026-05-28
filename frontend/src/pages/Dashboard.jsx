import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
        "http://localhost:5000/api/transcribe",
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
        "http://localhost:5000/api/upload",
        formData
      );

      // TRANSCRIBE AUDIO
      const transcribeRes = await axios.post(
        "http://localhost:5000/api/transcribe",
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
        `http://localhost:5000/api/transcribe/${id}`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      {/* LOGOUT */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            localStorage.removeItem("token");

            window.location.href = "/login";
          }}
          className="bg-red-500 px-5 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* TITLE */}
      <h1 className="text-5xl font-bold text-center mb-10">
        AI Speech To Text
      </h1>

      {/* SEARCH */}
      <div className="max-w-2xl mx-auto mb-10">
        <input
          type="text"
          placeholder="Search transcription history..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 outline-none"
        />
      </div>

      {/* UPLOAD SECTION */}
      <div className="flex flex-col items-center gap-6">
        <label className="border-2 border-dashed border-gray-500 p-10 rounded-xl cursor-pointer hover:border-blue-500 transition text-center w-full max-w-xl">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) =>
              setAudio(e.target.files[0])
            }
            className="hidden"
          />

          <p className="text-xl">
            Click To Upload Audio
          </p>

          {audio && (
            <p className="text-gray-400 mt-4">
              Selected: {audio.name}
            </p>
          )}
        </label>

        {/* RECORDING */}
        <div className="flex gap-4">
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-green-500 px-6 py-3 rounded hover:bg-green-600 transition"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 px-6 py-3 rounded hover:bg-red-600 transition"
            >
              Stop Recording
            </button>
          )}
        </div>

        {/* TRANSCRIBE */}
        <button
          onClick={handleUpload}
          className="bg-blue-500 px-8 py-3 rounded-xl hover:bg-blue-600 transition text-lg font-semibold"
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

      {/* HISTORY */}
      <div className="mt-16">
        <h2 className="text-4xl font-bold mb-8">
          History
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
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
                    src={`http://localhost:5000/${item.audioPath}`}
                  />
                </audio>

                <p className="text-gray-300 leading-7 mb-4">
                  {item.transcription}
                </p>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      handleCopy(
                        item.transcription
                      )
                    }
                    className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Copy
                  </button>

                  <button
                    onClick={() =>
                      handleDownload(
                        item.transcription
                      )
                    }
                    className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
                  >
                    Download
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(item._id)
                    }
                    className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
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