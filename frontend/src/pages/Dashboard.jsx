import { useState } from "react";
import axios from "axios";

function Dashboard() {
  const [audio, setAudio] = useState(null);

  const [transcription, setTranscription] = useState("");

  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!audio) {
      alert("Please select audio");

      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("audio", audio);

      // STEP 1: Upload audio
      const uploadRes = await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );

      // STEP 2: Send uploaded file to Whisper
      const transcribeRes = await axios.post(
        "http://localhost:5000/api/transcribe",
        {
          audioPath: uploadRes.data.audioPath,
        }
      );

      setTranscription(transcribeRes.data.transcription);

      setLoading(false);
    } catch (error) {
      console.log(error);

      setLoading(false);

      alert("Transcription failed");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-5xl font-bold">
        AI Speech To Text
      </h1>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setAudio(e.target.files[0])}
        className="border p-3 rounded"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-500 px-6 py-3 rounded hover:bg-blue-600"
      >
        Upload & Transcribe
      </button>

      {loading && (
        <p className="text-yellow-400 text-xl">
          Transcribing Audio...
        </p>
      )}

      {transcription && (
        <div className="bg-gray-900 p-6 rounded-lg w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">
            Transcription
          </h2>

          <p className="text-lg leading-8">
            {transcription}
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;