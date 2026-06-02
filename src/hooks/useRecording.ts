"use client";

import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Hook to manage meeting recording capabilities.
 * Records the local stream and triggers a file download upon completion.
 */
export function useRecording(localStream: MediaStream | null, dataChannel: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!localStream) {
      toast.error("No active video stream available to record");
      return;
    }

    chunksRef.current = [];

    // Find supported recording MIME type
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    let selectedType = "";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedType = type;
        break;
      }
    }

    try {
      const recorder = new MediaRecorder(localStream, {
        mimeType: selectedType || undefined,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = selectedType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordingBlob(blob);
        
        // Auto trigger file download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `opra_recording_${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Meeting recording downloaded");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Slice data buffers every 1s

      setIsRecording(true);
      dataChannel?.sendMessage("recording-start", {});
      toast("Recording meeting...", { icon: "🔴" });
    } catch (e: any) {
      console.error("Recording init exception:", e);
      toast.error(`Recording failed: ${e.message}`);
    }
  }, [localStream, dataChannel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      dataChannel?.sendMessage("recording-stop", {});
      toast.success("Recording finished");
    }
  }, [dataChannel]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    recordingBlob,
  };
}
