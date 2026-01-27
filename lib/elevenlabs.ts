export async function synthesizeSpeech(text: string): Promise<Buffer> {
    const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
        {
            method: "POST",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
        }
    );

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
            `ElevenLabs TTS failed: ${res.status} ${res.statusText} - ${JSON.stringify(errorData)}`
        );
    }

    return Buffer.from(await res.arrayBuffer());
}
