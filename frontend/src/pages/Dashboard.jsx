import {
  useCallback,
  useEffect,
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

  // LOAD HISTORY
  useEffect(() => {
    const loadHistory = async () => {
      await fetchHistory();
    };

    loadHistory();
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
    } catch (error) {
      console.log(error);

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

      {/* UPLOAD SECTION */}
      <div className="flex flex-col items-center gap-6">
        {/* FILE INPUT */}
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

        {/* RECORDING BUTTONS */}
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

        {/* TRANSCRIBE BUTTON */}
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

        {/* LATEST TRANSCRIPTION */}
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
          {history.length > 0 ? (
            history.map((item) => (
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

                <p className="text-gray-300 leading-7">
                  {item.transcription}
                </p>

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
                No transcription history yet 🎙️
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;