interface TranscriptResult {
    text: string;
    language: string;
}

export async function transcribeAudio(
    audioBuffer: Buffer
): Promise<TranscriptResult> {
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
            Authorization: process.env.ASSEMBLYAI_API_KEY!,
        },
        body: new Uint8Array(audioBuffer),
    });

    const { upload_url } = await uploadRes.json();

    const transcriptRes = await fetch(
        "https://api.assemblyai.com/v2/transcript",
        {
            method: "POST",
            headers: {
                Authorization: process.env.ASSEMBLYAI_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ audio_url: upload_url }),
        }
    );

    let transcript = await transcriptRes.json();

    while (transcript.status !== "completed") {
        if (transcript.status === "error") {
            throw new Error(transcript.error);
        }
        await new Promise((r) => setTimeout(r, 1500));
        transcript = await (
            await fetch(
                `https://api.assemblyai.com/v2/transcript/${transcript.id}`,
                {
                    headers: {
                        Authorization: process.env.ASSEMBLYAI_API_KEY!,
                    },
                }
            )
        ).json();
    }

    return {
        text: transcript.text,
        language: transcript.language_code ?? "unknown",
    };
}
