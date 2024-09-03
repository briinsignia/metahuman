"use client";

import { encodeWAV } from "@/utils/wavEncoder";
import { useEffect, useState, useRef, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { extractRegions } from "@/utils/extractRegions";

const WaveSurferRecorderV2 = () => {
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | undefined>("default");
  const [bodyTranscript, setBodyTranscript] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const silenceCountRef = useRef<number>(0);
  const silenceThresholdRef = useRef<number>(150);

  const progressRef = useRef<HTMLParagraphElement | null>(null);

  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    createWaveSurfer();
    getMicrophones();
    handleRecord();

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [transcript]);

  const createWaveSurfer = async () => {
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

    recordRef.current.on("record-pause", async (blob: Blob) => {
      const wavBlob = await encodeWAV(blob); // Convert to WAV format
      const recordedUrl = URL.createObjectURL(wavBlob);

      setRecordingUrl(recordedUrl);
      wavesurferRef.current?.load(recordedUrl);
    });

    recordRef.current.on("record-progress", (time: number) => {
      updateProgress(time);
    });

    wavesurferRef.current.on("audioprocess", (time: number) => {
      updateProgress(time * 1000); // Convert seconds to milliseconds
    });

    // wavesurferRef.current.on("decode", (duration: any) => {
    //   const decodedData = wavesurferRef.current.decodedData;

    //   if (decodedData) {
    //     // console.log(decodedData);
    //     const regions = extractRegions(decodedData.getChannelData(0), duration);

    //     if (regions.length < 4) {
    //       silenceCountRef.current++;
    //       if (silenceCountRef.current >= silenceThresholdRef.current) {
    //         recordRef.current.stopRecording();
    //       }
    //     } else {
    //       silenceCountRef.current = 0;

    //       if (recordRef.current.isPaused()) {
    //         recordRef.current.startRecording();
    //         SpeechRecognition.startListening({
    //           language: "id-ID",
    //           continuous: true,
    //           // interimResults: true,
    //         });
    //       }

    //       //   handleRecord();
    //       //   recordRef.current = wavesurferRef.current.registerPlugin(
    //       //     RecordPlugin.create({ renderRecordedAudio: true })
    //       //   );
    //     }
    //   }
    // });
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

  const handleRecord = async () => {
    if (recordRef.current.isRecording() || recordRef.current.isPaused()) {
      console.log("hit here");
      recordRef.current.stopRecording();
      SpeechRecognition.stopListening();
      setIsRecording(false);
    } else {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl); // Release the previous recording URL
        setRecordingUrl(null);
      }
      setResponse("");

      recordRef.current.startRecording({
        deviceId: selectedMic,
      });
      SpeechRecognition.startListening({
        language: "id-ID",
        continuous: true,
        // interimResults: true,
      });
    }
  };

  const sendToBackend = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
        {
          method: "POST",
          credentials: "same-origin",

          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.NEXT_PUBLIC_API_KEY,
          },
          body: JSON.stringify({
            inputs: {
              name: "Metahuman",
            },
            query: bodyTranscript,
            conversation_id: "",
            response_mode: "blocking",
            user: "abc-123",
          }),
        }
      );

      const data = await response.json();
      setResponse(data.answer);

      setBodyTranscript("");
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      resetTranscript();
    }
  };

  //   const handleSilence = async () => {
  //     if (recordRef.current && recordRef.current.isRecording()) {
  //       recordRef.current.stopRecording();
  //     }

  //     if (isSpeaking) {
  //       console.log("hit here");
  //       sendToBackend();
  //     }
  //   };

  //   useEffect(() => {
  //     if (isRecording) {
  //       silenceTimerRef.current = setTimeout(handleSilence, 5000);
  //     }

  //     return () => {
  //       if (silenceTimerRef.current) {
  //         clearTimeout(silenceTimerRef.current);
  //       }
  //     };
  //   }, [transcript]);

  // const sendToBackendWithBlob = async (blob: Blob) => {
  //   try {
  //     setIsLoading(true);
  //     const formData = new FormData();
  //     formData.append("file", blob, "audio.wav");

  //     const response = await fetch(
  //       process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: "Bearer " + process.env.NEXT_PUBLIC_API_KEY,
  //         },
  //         body: formData,
  //       }
  //     );

  //     const data = await response.json();
  //     setResponse(data.answer);
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error("Error uploading file:", error as Error);
  //   }
  // };s

  return (
    <div className="max-w-2xl mx-auto p-4 text-left">
      <div className="flex items-center mb-4">
        {/* <button
          onClick={handleRecordClick}
          className={`py-2 px-4 rounded ${
            isRecording ? "bg-red-500" : "bg-blue-500"
          } text-white`}
        >
          {isRecording ? "Stop" : "Speak"}
        </button> */}
        <select
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
        </select>
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
            <p className="mt-2 text-gray-600">{response}</p>
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

export default WaveSurferRecorderV2;
