// code for whisper

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: fetch remote video as a stream
async function fetchAsFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer;
}

export async function POST(req) {
  try {
    const { videoUrl } = await req.json();
    console.log("OpenAI API Key prefix:", process.env.OPENAI_API_KEY?.slice(0, 6));

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }
    const fileBuffer = await fetchAsFile(videoUrl);
    console.log("Fetched video bytes:", fileBuffer.length);
    const file = new File([fileBuffer], "video.mp4", { type: "video/mp4" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {

  if (err.code === "insufficient_quota") {
    return NextResponse.json(
      {
        error:
          "Your OpenAI API quota has been exceeded. Please check your billing plan or add more credits.",
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: err.message || "Transcription failed" },
    { status: 500 }
  );
  }
}


// import { NextResponse } from "next/server";
// import fetch from "node-fetch";
// import { createWriteStream, unlinkSync } from "fs";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);
// const FFMPEG_PATH = process.env.FFMPEG_PATH;
// const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;

// async function downloadVideo(url, path) {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch video: ${res.status}`);
//   const fileStream = createWriteStream(path);
//   await new Promise((resolve, reject) => {
//     res.body.pipe(fileStream);
//     res.body.on("error", reject);
//     fileStream.on("finish", resolve);
//   });
// }

// async function extractAudio(videoPath, audioPath) {
//   const cmd = `"${FFMPEG_PATH}" -i "${videoPath}" -vn -ar 16000 -ac 1 "${audioPath}" -y`;
//   await execAsync(cmd);
// }

// async function uploadAudio(audioPath) {
//   const audioData = await fetch(`file://${audioPath}`);
//   const res = await fetch("https://api.assemblyai.com/v2/upload", {
//     method: "POST",
//     headers: { Authorization: ASSEMBLYAI_KEY },
//     body: await audioData.arrayBuffer(),
//   });
//   const data = await res.json();
//   if (!data.upload_url) throw new Error("Upload failed.");
//   return data.upload_url;
// }

// async function transcribeAudio(uploadUrl) {
//   const res = await fetch("https://api.assemblyai.com/v2/transcript", {
//     method: "POST",
//     headers: {
//       Authorization: ASSEMBLYAI_KEY,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ audio_url: uploadUrl }),
//   });
//   const data = await res.json();
//   return data.id;
// }

// async function getTranscriptionResult(transcriptId) {
//   let status = "queued";
//   let transcript;
//   while (status === "queued" || status === "processing") {
//     await new Promise((r) => setTimeout(r, 5000));
//     const res = await fetch(
//       `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
//       { headers: { Authorization: ASSEMBLYAI_KEY } }
//     );
//     transcript = await res.json();
//     status = transcript.status;
//   }
//   if (transcript.status === "failed") throw new Error("Transcription failed");
//   return transcript.text;
// }

// export async function POST(req) {
//   try {
//     const { videoUrl } = await req.json();
//     if (!videoUrl)
//       return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });

//     const videoPath = "temp_video.mp4";
//     const audioPath = "temp_audio.wav";

//     await downloadVideo(videoUrl, videoPath);
//     await extractAudio(videoPath, audioPath);

//     const uploadUrl = await uploadAudio(audioPath);
//     const transcriptId = await transcribeAudio(uploadUrl);
//     const transcriptText = await getTranscriptionResult(transcriptId);

//     unlinkSync(videoPath);
//     unlinkSync(audioPath);

//     return NextResponse.json({ text: transcriptText });
//   } catch (err) {
//     console.error("Transcription error:", err);
//     return NextResponse.json(
//       { error: err.message || "Transcription failed" },
//       { status: 500 }
//     );
//   }
// }
