export class TextToSpeech {
  private utterance: SpeechSynthesisUtterance | null = null;
  private onStart: () => void;
  private onEnd: () => void;
  private onError: (error: string) => void;

  constructor(
    onStart: () => void,
    onEnd: () => void,
    onError: (error: string) => void
  ) {
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.onError = onError;
  }

  speak(text: string) {
    if (!text) return;

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = 1;
    this.utterance.pitch = 1;
    this.utterance.volume = 1;
    this.utterance.voice = speechSynthesis.getVoices()[0];
    this.utterance.lang = "en-US";

    this.utterance.onstart = () => this.onStart();
    this.utterance.onend = () => this.onEnd();
    this.utterance.onerror = () => this.onError("Error speaking text");

    window.speechSynthesis.speak(this.utterance);
  }

  stop() {
    if (this.utterance) {
      window.speechSynthesis.cancel();
      this.onEnd();
    }
  }
}
