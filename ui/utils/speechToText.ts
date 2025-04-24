interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionError) => void)
    | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const PAUSE_TIME = 500;

export class SpeechToText {
  private recognition: SpeechRecognition | null = null;
  private onTranscript: (text: string) => void;
  private onError: (error: string) => void;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private currentTranscript: string = "";

  constructor(
    onTranscript: (text: string) => void,
    onError: (error: string) => void
  ) {
    this.onTranscript = onTranscript;
    this.onError = onError;
  }

  private debouncedTranscript(text: string) {
    this.currentTranscript = text;

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.onTranscript(this.currentTranscript);
      this.currentTranscript = "";
    }, PAUSE_TIME);
  }

  start() {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        this.debouncedTranscript(transcript);
      };

      this.recognition.onerror = (event: SpeechRecognitionError) => {
        this.onError(event.error);
      };

      this.recognition.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      this.onError("Error starting speech recognition");
    }
  }

  stop() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
