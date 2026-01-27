import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/assemblyai";
import { translateText } from "@/lib/translate";
import { synthesizeSpeech } from "@/lib/elevenlabs";
import { ProcessResponse } from "@/types/api";
import { getAuthUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 0. check authentication
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Please login to process audio" }, { status: 401 });
    }

    const formData = await req.formData();

    const audio = formData.get("audio") as Blob | null;
    const targetLanguagesRaw = formData.get("targetLanguages") as string | null;

    if (!audio || !targetLanguagesRaw) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const targetLanguages: string[] = JSON.parse(targetLanguagesRaw).slice(0, 1);

    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    // Validate audio duration and update usage
    const { parseBuffer } = await import("music-metadata");
    const metadata = await parseBuffer(audioBuffer, { mimeType: audio.type });
    const duration = metadata.format.duration || 0;

    if (duration > 30.5) { // Allowing a tiny margin for rounding
      return NextResponse.json({ error: "Audio length exceeds 30 seconds limit" }, { status: 400 });
    }

    // Check if user has reached the limit
    if (user.totalSeconds + duration > user.usageLimitSeconds) {
      return NextResponse.json({ error: "Usage limit reached. Please upgrade your plan." }, { status: 402 });
    }

    // 1. Speech → Text
    const transcript = await transcribeAudio(audioBuffer);

    // 2. Translate + TTS
    const translations = [];
    for (const lang of targetLanguages) {
      const translatedText = await translateText(transcript.text, lang);
      const voiceBuffer = await synthesizeSpeech(translatedText);

      translations.push({
        language: lang,
        text: translatedText,
        audioBase64: voiceBuffer.toString("base64"),
      });

      // 1-second delay between requests to avoid 429 errors
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update user usage
    user.totalSeconds += Math.round(duration);
    await updateUser(user);

    const response: ProcessResponse = {
      sourceLanguage: transcript.language,
      originalTranscript: transcript.text,
      originalAudioBase64: audioBuffer.toString("base64"),
      translations,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
