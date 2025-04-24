"use client";

import { useState, useCallback, useRef } from "react";
import { Play, Square, Send, Volume2 } from "lucide-react";
import { SpeechToText } from "../utils/speechToText";
import { TextToSpeech } from "../utils/textToSpeech";
import { generateText, testOpenAI } from "../utils/generateText";

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

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechToTextRef = useRef<SpeechToText | null>(null);
  const textToSpeechRef = useRef<TextToSpeech | null>(null);

  const startRecording = useCallback(() => {
    if (!speechToTextRef.current) {
      speechToTextRef.current = new SpeechToText(
        (text: string) => setTranscribedText(text),
        (error: string) => console.error("Speech recognition error:", error)
      );
    }
    speechToTextRef.current.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (speechToTextRef.current) {
      speechToTextRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const sendToLLM = useCallback(async () => {
    if (!transcribedText) return;

    setIsLoading(true);
    try {
      const response = await generateText(transcribedText);
      setLlmResponse(response);
    } catch (error: unknown) {
      console.error("Error getting LLM response:", error);
      setLlmResponse("Error getting response from LLM. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [transcribedText]);

  const speakResponse = useCallback(() => {
    if (!llmResponse) return;

    if (!textToSpeechRef.current) {
      textToSpeechRef.current = new TextToSpeech(
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (error) => console.error("Text-to-speech error:", error)
      );
    }
    textToSpeechRef.current.speak(llmResponse);
  }, [llmResponse]);

  const handleTestOpenAI = useCallback(async () => {
    try {
      const response = await testOpenAI();
      console.log("OpenAI Response:", response);
    } catch (error) {
      console.error("OpenAI Error:", error);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center mb-8">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center justify-center w-32 h-32 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all duration-200"
          >
            <Play className="w-16 h-16" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all duration-200"
          >
            <Square className="w-16 h-16" />
          </button>
        )}
      </div>
      {transcribedText && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md max-w-2xl w-full">
          <h2 className="text-lg font-semibold mb-2">Transcribed Text:</h2>
          <p className="text-gray-700 mb-4">{transcribedText}</p>
          <button
            onClick={sendToLLM}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Processing..." : "Send to LLM"}
          </button>
        </div>
      )}
      {llmResponse && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md max-w-2xl w-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">LLM Response:</h2>
            <button
              onClick={speakResponse}
              disabled={isSpeaking}
              className="flex items-center gap-2 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              {isSpeaking ? "Speaking..." : "Speak"}
            </button>
          </div>
          <p className="text-gray-700">{llmResponse}</p>
        </div>
      )}
      <button
        onClick={handleTestOpenAI}
        className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
      >
        Test OpenAI
      </button>
    </div>
  );
}
