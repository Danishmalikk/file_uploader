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
    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    // Download video from Cloudinary
    const fileBuffer = await fetchAsFile(videoUrl);

    // Convert to a temp File object for Whisper
    const file = new File([fileBuffer], "video.mp4", { type: "video/mp4" });

    // Send to Whisper model
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      // language: "en", // optional: force language
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: err.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
