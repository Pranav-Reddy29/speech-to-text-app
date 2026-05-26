import { useCallback, useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [audio, setAudio] = useState(null);

  const [transcription, setTranscription] =
    useState("");

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);

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

  // LOAD HISTORY ON PAGE LOAD
  useEffect(() => {
    const loadHistory = async () => {
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
    };

    loadHistory();
  }, [token]);

  // HANDLE AUDIO UPLOAD
  const handleUpload = async () => {
    if (!audio) {
      alert("Please select audio");

      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("audio", audio);

      // STEP 1: Upload Audio
      const uploadRes = await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );

      // STEP 2: Transcribe Audio
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

      // REFRESH HISTORY
      fetchHistory();

      setLoading(false);
    } catch (error) {
      console.log(error);

      setLoading(false);

      alert("Transcription failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* TITLE */}
      <h1 className="text-5xl font-bold text-center mb-10">
        AI Speech To Text
      </h1>

      {/* UPLOAD SECTION */}
      <div className="flex flex-col items-center gap-6">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) =>
            setAudio(e.target.files[0])
          }
          className="border p-3 rounded"
        />

        <button
          onClick={handleUpload}
          className="bg-blue-500 px-6 py-3 rounded hover:bg-blue-600 transition"
        >
          Upload & Transcribe
        </button>

        {loading && (
          <p className="text-yellow-400 text-xl">
            Transcribing Audio...
          </p>
        )}

        {/* LATEST TRANSCRIPTION */}
        {transcription && (
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">
              Latest Transcription
            </h2>

            <p className="text-lg leading-8 text-gray-300">
              {transcription}
            </p>
          </div>
        )}
      </div>

      {/* HISTORY SECTION */}
      <div className="mt-16">
        <h2 className="text-4xl font-bold mb-8">
          History
        </h2>

        <div className="grid gap-6">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item._id}
                className="bg-gray-900 p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-xl font-bold mb-3">
                  {item.filename}
                </h3>

                {/* AUDIO PLAYER */}
                <audio
                  controls
                  className="w-full mb-4"
                >
                  <source
                    src={`http://localhost:5000/${item.audioPath}`}
                  />
                </audio>

                {/* TRANSCRIPTION */}
                <p className="text-gray-300 leading-7">
                  {item.transcription}
                </p>

                {/* DATE */}
                <p className="text-sm text-gray-500 mt-4">
                  {new Date(
                    item.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-lg">
              No transcription history found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;