import { useState, useRef, useCallback } from "react";

export function useMicrophone() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        setIsRecording(false);
        const mimeType = mediaRecorder.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        
        // Stop all tracks to release microphone icon in browser tab
        mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
        mediaRecorder.current = null;
        
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  return {
    isRecording,
    isProcessing,
    setIsProcessing,
    startRecording,
    stopRecording,
  };
}
