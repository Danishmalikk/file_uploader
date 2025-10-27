"use client";

import axios from "axios";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const MAX_SIZE =
    Number(process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE_MB) * 1024 * 1024;

  const onDrop = async (acceptedFiles) => {
    const selected = acceptedFiles[0];
    if (!selected) return;

    if (!selected.type.startsWith("video/")) {
      setError("Only video files are allowed");
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError(
        `Max file size is ${process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE_MB} MB.`
      );
      return;
    }

    setError("");
    setFile(selected);
    await uploadToCloudinary(selected);
  };

  const uploadToCloudinary = async (file) => {
    console.log("file", file)
    try {
      setProgress(0);
      const res = await fetch("/api/sign-upload");
      const data = await res.json();
      console.log("sign-upload response", data)


      const formData = new FormData(); 
      formData.append('file', file)
      formData.append('signature', data.signature);
      formData.append('timestamp', data.timestamp);
      formData.append('api_key', data.apiKey);

      console.log("form data", formData)

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${data.cloudName}/video/upload`,
        formData,
        {
          onUploadProgress: (e) => {
            setProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
          },
        }
      );

      console.log("Cloudinary upload:", uploadRes.data);
      // setVideoUrl(uploadRes?.data.secure_url || " ");
    } catch (error) {
      setError("Upload failed: " + error.message);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleTranscribe = async () => {
    try {
      setIsTranscribing(true);
      const { data } = await axios.post("/api/transcribe", { videoUrl });
      setTranscript(data.text);
    } catch (err) {
      setError("Transcription failed: " + err.message);
    } finally {
      setIsTranscribing(false);
    }
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <h1 className="text-2xl font-semibold mb-6">Video Transcriber</h1>
      <div
        {...getRootProps()}
        className={`w-full max-w-md border-2 border-dashed rounded-xl p-10 text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? "Drop your video here"
            : "Drag & drop a video file, or click to select"}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Max size: {process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE_MB} MB
        </p>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {file && !videoUrl && (
        <div className="mt-6 w-full max-w-md">
          <p className="text-sm text-gray-600 mb-1">Uploading: {file.name}</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress}%</p>
        </div>
      )}

      {videoUrl && (
        <div className="mt-6 text-center">
          <video
            controls
            src={videoUrl}
            className="rounded-xl w-full max-w-md"
          />
          <p className="text-green-600 mt-2">Upload complete ✅</p>
        </div>
      )}

      {videoUrl && !transcript && (
        <button
          onClick={handleTranscribe}
          disabled={isTranscribing}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isTranscribing ? "Transcribing..." : "Generate Transcript"}
        </button>
      )}

      {transcript && (
        <div className="mt-6 w-full max-w-md bg-white shadow p-4 rounded-lg text-left">
          <h2 className="font-semibold mb-2">Transcript</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </main>
  );
}
