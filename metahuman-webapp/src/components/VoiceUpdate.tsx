import React, { useState, useEffect, useRef } from "react";
import WavEncoder from "wav-encoder";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  getResponseAudioText,
  getResponseAudio,
  // postTranscribeAudio,
  silentAI,
} from "@/api/transcribe-audio/post";

const AutoVoiceDetectionComponent: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [logMessage, setLogMessage] = useState<string>(""); // tambahan
  const [readyListening, setReadyListening] = useState(false); //tambahan

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const ballControls = useAnimation();

  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  useEffect(() => {
    startListening();
    return () => {
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (listening) {
      ballControls.start("listening");
      setIsListening(true);
      startRecording();
      signalAIToSilent();
    } else {
      ballControls.start("idle");
      setIsListening(false);
      stopRecording();
    }
  }, [listening, ballControls]);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true, language: "id-ID" });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const startRecording = async () => {
    setLogMessage("Ready Start Recording"); // Set the log message
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };
  
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
          await sendAudioToBackend(audioBlob);
        } catch (error) {
          console.error("Error sending audio:", error);
        } finally {
          mediaRecorderRef.current = null; // Reset media recorder
          audioChunks.current = []; // Clear audio chunks
        }
      };
    }
  };
  
  const signalAIToSilent = async () => {
    try {
      await silentAI();
    } catch (error) {
      console.error("Error signaling AI to be silent:", error);
    }
  };

  useEffect(() => {
    if (transcript) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(handleSilence, 2 * 1000); // 2 seconds
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [transcript]);

  const handleSilence = () => {
    if (transcript) {
      stopRecording();
      resetTranscript();
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      // const formData = new FormData();
      // formData.append("file", audioBlob, "audio.wav");
  
      console.log("text noice", transcript);
      // console.log("Audio size before sending:", audioBlob.size);
      
      const { message } = await getResponseAudioText(transcript);
      setResponse(message);
      startRecording();
    } catch (error) {
      console.error("Error sending audio to backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const ballVariants = {
    idle: {
      scale: 1,
      opacity: 0.5,
      boxShadow: "0 0 50px rgba(0, 255, 100, 0.3)",
    },
    listening: {
      scale: 1.05,
      opacity: 0.8,
      boxShadow: "0 0 60px rgba(0, 255, 100, 0.4)",
      transition: {
        scale: {
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        },
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        },
      },
    },
    speaking: {
      scale: 1.1,
      opacity: 1,
      boxShadow: "0 0 80px rgba(0, 255, 100, 0.6)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="w-screen h-screen bg-black flex flex-col justify-center items-center relative">
      <motion.div
        className="glowing-ball"
        variants={ballVariants}
        initial="idle"
        animate={ballControls}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
        }}
      />
      <AnimatePresence>
        {(transcript || response) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 max-w-2xl bg-black bg-opacity-50 backdrop-blur-md rounded-lg p-6 shadow-lg"
          >
            {transcript && (
              <>
                <h2 className="text-green-400 text-xl font-semibold mb-2">
                  Transcript
                </h2>
                <p className="text-white text-lg">{transcript}</p>
              </>
            )}
            {response && (
              <>
                <h2 className="text-green-400 text-xl font-semibold mt-4 mb-2">
                  Response
                </h2>
                <p className="text-white text-lg">{response}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}
    </div>
  );
};

export default AutoVoiceDetectionComponent;