import { useState } from "react";
import axios from "axios";

function App() {
  const [audio, setAudio] = useState(null);

  const handleUpload = async () => {
    if (!audio) {
      alert("Please select an audio file");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audio);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );

      alert("File uploaded successfully");
      console.log(res.data);
    } catch (error) {
      console.log(error);
      alert("Upload failed");
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-5">
      <h1 className="text-4xl font-bold">Speech To Text App</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setAudio(e.target.files[0])}
        className="border p-2 rounded"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-500 px-6 py-2 rounded hover:bg-blue-600"
      >
        Upload Audio
      </button>
    </div>
  );
}

export default App;