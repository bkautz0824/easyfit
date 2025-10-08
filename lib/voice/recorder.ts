"use client";

export class VoiceRecorder {
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];
  private stream: any = null;

  async startRecording(): Promise<void> {
    if (typeof (globalThis as any).window === 'undefined') {
      throw new Error('Recording is only available in the browser');
    }

    try {
      this.stream = await (globalThis as any).navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new (globalThis as any).MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      throw new Error("Failed to start recording. Please check microphone permissions.");
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track: any) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
