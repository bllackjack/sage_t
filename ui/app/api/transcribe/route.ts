// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { audioBase64 } = await req.json();
  const buffer = Buffer.from(audioBase64, "base64");

  // note the new method signature
  const transcription = await openai.audio.transcriptions.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file: buffer as any,
    model: "whisper-1",
  });

  return NextResponse.json({ text: transcription.text });
}
