import { useCallback, useEffect, useRef, useState } from "react";

const useVoiceActivation = (
  onVoiceDetected: () => void,
  threshold = 40,
  interval = 100
) => {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(() => {
    if (isListening) return;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        setIsListening(true);
      })
      .catch((err) => console.error("Error accessing microphone:", err));
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
  }, [isListening]);

  const checkAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isListening) return false;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    return dataArray.some((value) => value > threshold);
  }, [isListening, threshold]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isListening) {
      intervalId = setInterval(() => {
        const isSpeaking = checkAudioLevel();
        if (isSpeaking) {
          // Callback when voice is detected
          console.log("Voice detected!");
          // You can call your handleRecordClick() here
        }
      }, interval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isListening, checkAudioLevel, interval]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isListening) {
      intervalId = setInterval(() => {
        const isSpeaking = checkAudioLevel();
        if (isSpeaking) {
          onVoiceDetected();
        }
      }, interval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isListening, checkAudioLevel, interval, onVoiceDetected]);

  return { isListening, startListening, stopListening };
};

export default useVoiceActivation;
