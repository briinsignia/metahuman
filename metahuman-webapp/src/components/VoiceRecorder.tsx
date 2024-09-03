"use client";

import { encodeWAV } from "@/utils/wavEncoder";
import { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Markdown from "react-markdown";
import { postTranscribeAudio } from "@/api/transcribe-audio/post";

const WaveSurferRecorder = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | undefined>(undefined);
  const [bodyTranscript, setBodyTranscript] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<any>(null);
  const progressRef = useRef<HTMLParagraphElement | null>(null);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    createWaveSurfer();
    getMicrophones();
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  const createWaveSurfer = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    wavesurferRef.current = WaveSurfer.create({
      container: "#mic",
      waveColor: "rgb(200, 0, 200)",
      progressColor: "rgb(100, 0, 100)",
    });

    recordRef.current = wavesurferRef.current.registerPlugin(
      RecordPlugin.create({ renderRecordedAudio: true })
    );

    recordRef.current.on("record-end", async (blob: Blob) => {
      const wavBlob = await encodeWAV(blob); // Convert to WAV format
      const recordedUrl = URL.createObjectURL(wavBlob);

      setRecordingUrl(recordedUrl);
      wavesurferRef.current?.load(recordedUrl);
      sendToBackendWithBlob(wavBlob);
    });

    recordRef.current.on("record-progress", (time: number) => {
      updateProgress(time);
    });

    wavesurferRef.current.on("audioprocess", (time: number) => {
      updateProgress(time * 1000); // Convert seconds to milliseconds
    });
  };

  const getMicrophones = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(
      (device) => device.kind === "audioinput"
    );
    setMicrophones(audioDevices);
  };

  const updateProgress = (time: number) => {
    if (progressRef.current) {
      const formattedTime = [
        Math.floor((time % 3600000) / 60000), // minutes
        Math.floor((time % 60000) / 1000), // seconds
      ]
        .map((v) => (v < 10 ? "0" + v : v))
        .join(":");
      progressRef.current.textContent = formattedTime;
    }
  };

  const handleRecordClick = async () => {
    if (recordRef.current.isRecording() || recordRef.current.isPaused()) {
      recordRef.current.stopRecording();
      SpeechRecognition.stopListening();
      setIsRecording(false);
    } else {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl); // Release the previous recording URL
        setRecordingUrl(null);
      }
      setResponse("");
      resetTranscript(); // Reset the transcript for new recording
      recordRef.current.startRecording({
        deviceId: selectedMic,
      });
      SpeechRecognition.startListening({ language: "id-ID" }); // Set language to Indonesian
      setIsRecording(true);
    }
  };

  const sendToBackendWithBlob = async (blob: Blob) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", blob, "audio.wav");

      const response: any = await postTranscribeAudio(formData);

      // Read the response as text
      const textResponse = response;

      // Set the response
      setResponse(textResponse);
      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsLoading(false);
    } finally {
      setIsRecording(false);
    }
  };
  // const sendToBackend = async () => {
  //   try {
  //     setIsLoading(true);
  //     const response = await fetch(
  //       process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: "Bearer " + process.env.NEXT_PUBLIC_API_KEY,
  //         },
  //         body: JSON.stringify({
  //           inputs: {
  //             name: "Metahuman",
  //           },
  //           query: bodyTranscript,
  //           conversation_id: "",
  //           response_mode: "blocking",
  //           user: "abc-123",
  //         }),
  //       }
  //     );

  //     const data = await response.json();
  //     setResponse(data.answer);
  //     setIsLoading(false);
  //     setBodyTranscript("");
  //   } catch (error) {
  //     console.error("Error uploading file:", error);
  //   }
  // };

  // Call sendToBackend when user stops speaking
  // useEffect(() => {
  //   if (transcript) {
  //     setBodyTranscript(transcript);
  //   }
  // }, [isRecording, transcript]);

  const handleSilence = async () => {
    if (recordRef.current && recordRef.current.isRecording()) {
      recordRef.current.stopRecording();
      SpeechRecognition.stopListening();
    }
  };

  useEffect(() => {
    if (isRecording) {
      silenceTimerRef.current = setTimeout(handleSilence, 1500);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [transcript]);

  return (
    <div className="max-w-2xl mx-auto p-4 text-left">
      <div className="flex items-center mb-4">
        {!isRecording && (
          <button
            onClick={handleRecordClick}
            className={`py-2 px-4 rounded ${
              isRecording ? "bg-red-500" : "bg-blue-500"
            } text-white`}
          >
            Speak
          </button>
        )}
        {/* <select
          value={selectedMic}
          onChange={(e) => setSelectedMic(e.target.value)}
          className="py-2 px-4 ml-4 border border-gray-300 rounded text-black max-w-xs"
        >
          <option value="">Select Microphone</option>
          {microphones.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || mic.deviceId}
            </option>
          ))}
        </select> */}
      </div>
      <p className="mt-2 text-gray-600">
        {isRecording ? "Listening..." : "Not listening"}
      </p>
      <p className="mt-2 text-gray-800">You said: {transcript}</p>
      <div className="mt-4">
        {isLoading && (
          <p className="text-gray-800">Processing your request...</p>
        )}

        {response && (
          <>
            <p className="mt-2 text-gray-800">Response:</p>
            <p className="mt-2 text-gray-600">
              <Markdown>{response}</Markdown>
            </p>
          </>
        )}
      </div>
      <p ref={progressRef} className="mt-2 text-gray-600">
        00:00
      </p>
      <div id="mic" className="border border-gray-300 rounded mt-4"></div>
      {recordingUrl && (
        <audio controls className="mt-4">
          <source src={recordingUrl} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default WaveSurferRecorder;
