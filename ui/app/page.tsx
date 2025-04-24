"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Square } from "lucide-react";
import { SpeechToText } from "../utils/speechToText";
import { TextToSpeech } from "../utils/textToSpeech";
import { generateText, testOpenAI } from "../utils/generateText";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const speechToTextRef = useRef<SpeechToText | null>(null);
  const textToSpeechRef = useRef<TextToSpeech | null>(null);

  // Initialize text-to-speech once when component mounts
  useEffect(() => {
    textToSpeechRef.current = new TextToSpeech(
      () => {
        setIsSpeaking(true);
        // Stop speech recognition while speaking
        if (speechToTextRef.current) {
          speechToTextRef.current.stop();
          setIsRecording(false);
        }
      },
      () => {
        setIsSpeaking(false);
        // Restart speech recognition after speaking
        if (speechToTextRef.current) {
          speechToTextRef.current.start();
          setIsRecording(true);
        }
      },
      (error) => console.error("Text-to-speech error:", error)
    );
  }, []);

  const handleTranscript = useCallback(
    async (text: string) => {
      setTranscribedText(text);
      if (text.trim()) {
        setIsLoading(true);
        try {
          const conversationToSend = [
            { role: "user" as const, content: text },
            ...conversation,
          ];
          const response = await testOpenAI(text, conversationToSend);
          if (response) {
            // Add both user message and assistant response at the same time
            setConversation((prev) => [
              ...prev,
              { role: "user", content: text },
              { role: "assistant", content: response },
            ]);

            if (textToSpeechRef.current) {
              textToSpeechRef.current.speak(response);
            }
          }
        } catch (error: unknown) {
          console.error("Error getting LLM response:", error);
          const errorMessage: Message = {
            role: "assistant",
            content: "Error getting response from LLM. Please try again.",
          };
          setConversation((prev) => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [conversation]
  );

  const startRecording = useCallback(() => {
    if (!speechToTextRef.current) {
      speechToTextRef.current = new SpeechToText(
        handleTranscript,
        (error: string) => console.error("Speech recognition error:", error)
      );
    }
    speechToTextRef.current.start();
    setIsRecording(true);
  }, [handleTranscript]);

  const stopRecording = useCallback(() => {
    if (speechToTextRef.current) {
      speechToTextRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center mb-8">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isSpeaking}
            className={`flex items-center justify-center w-32 h-32 rounded-full ${
              isSpeaking ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
            } text-white shadow-lg transition-all duration-200`}
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

      {/* Current Speech Section */}
      {isRecording && !isSpeaking && (
        <div className="w-full max-w-2xl mb-8 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Currently Speaking:</h2>
          <p className="text-gray-700">{transcribedText || "Listening..."}</p>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="w-full max-w-2xl mb-8 p-4 bg-purple-100 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Assistant Speaking:</h2>
          <p className="text-gray-700">
            {conversation[conversation.length - 1]?.content}
          </p>
        </div>
      )}

      {/* Conversation History */}
      <div className="w-full max-w-2xl space-y-4">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === "user"
                ? "bg-blue-100 ml-auto"
                : "bg-gray-100 mr-auto"
            }`}
          >
            <p className="text-gray-800">{message.content}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="mt-4 text-gray-600">Processing...</div>}

      {/* Debug Button */}
      <button
        onClick={() => {
          console.log("Conversation History:", conversation);
          console.log("Current State:", {
            isRecording,
            isSpeaking,
            isLoading,
            transcribedText,
          });
        }}
        className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        Debug Info
      </button>
    </div>
  );
}
