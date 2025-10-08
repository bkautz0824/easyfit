export async function transcribeAudio(
  audioBlob: Blob
): Promise<{ text: string; duration: number }> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch("/api/eleven/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || "Transcription failed");
    }

    const data = await response.json() as { text: string; duration?: number };
    return {
      text: data.text,
      duration: data.duration || 0,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error(
      `Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function textToSpeech(
  text: string
): Promise<Blob> {
  try {
    const response = await fetch("/api/eleven/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || "Text-to-speech failed");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error converting text to speech:", error);
    throw new Error(
      `Failed to convert text to speech: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
