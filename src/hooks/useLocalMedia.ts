"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";

export interface DeviceInfo {
  deviceId: string;
  label: string;
}

export interface DevicesState {
  audioInputs: DeviceInfo[];
  videoInputs: DeviceInfo[];
  audioOutputs: DeviceInfo[];
}

/**
 * Hook to manage local video and audio media tracks, devices listing, and toggling.
 */
export function useLocalMedia() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [devices, setDevices] = useState<DevicesState>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });

  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  const localStreamRef = useRef<MediaStream | null>(null);

  // Enumerate user's inputs/outputs
  const updateDevices = useCallback(async () => {
    try {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs: DeviceInfo[] = [];
      const videoInputs: DeviceInfo[] = [];
      const audioOutputs: DeviceInfo[] = [];
      
      deviceInfos.forEach((device) => {
        const info: DeviceInfo = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} (${device.deviceId.substring(0, 5)})`,
        };
        
        if (device.kind === "audioinput") {
          audioInputs.push(info);
        } else if (device.kind === "videoinput") {
          videoInputs.push(info);
        } else if (device.kind === "audiooutput") {
          audioOutputs.push(info);
        }
      });
      
      setDevices({ audioInputs, videoInputs, audioOutputs });
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  }, []);

  // Initializes user stream using constraints
  const initMedia = useCallback(async (audioId?: string, videoId?: string) => {
    try {
      // Clear previous track connections
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: audioId ? { exact: audioId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          deviceId: videoId ? { exact: videoId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Set enabled properties based on state variables
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });

      // Update list of devices
      await updateDevices();
      
      const activeAudio = stream.getAudioTracks()[0];
      const activeVideo = stream.getVideoTracks()[0];
      
      if (activeAudio?.getSettings().deviceId) {
        setSelectedAudioInput(activeAudio.getSettings().deviceId!);
      }
      if (activeVideo?.getSettings().deviceId) {
        setSelectedVideoInput(activeVideo.getSettings().deviceId!);
      }
    } catch (err: any) {
      console.error("Error acquiring user media:", err);
      toast.error(`Media access failed: ${err.message || "Please verify device access permissions."}`);
    }
  }, [isMicOn, isCameraOn, updateDevices]);

  // Run on mount
  useEffect(() => {
    initMedia();
    
    // Automatically re-enumerate devices when devices are plugged or unplugged
    navigator.mediaDevices.addEventListener("devicechange", updateDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", updateDevices);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Toggles the local microphone enabled state
  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => {
      const nextState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = nextState;
        });
      }
      return nextState;
    });
  }, []);

  // Toggles the local camera enabled state
  const toggleCamera = useCallback(() => {
    setIsCameraOn((prev) => {
      const nextState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = nextState;
        });
      }
      return nextState;
    });
  }, []);

  // Switches track source device
  const switchDevice = useCallback(async (kind: "audioinput" | "videoinput" | "audiooutput", deviceId: string) => {
    if (kind === "audioinput") {
      setSelectedAudioInput(deviceId);
      await initMedia(deviceId, selectedVideoInput);
      toast.success("Microphone updated");
    } else if (kind === "videoinput") {
      setSelectedVideoInput(deviceId);
      await initMedia(selectedAudioInput, deviceId);
      toast.success("Camera updated");
    } else if (kind === "audiooutput") {
      setSelectedAudioOutput(deviceId);
      toast.success("Audio output device updated");
    }
  }, [initMedia, selectedAudioInput, selectedVideoInput]);

  const audioTrack = localStream?.getAudioTracks()[0] || null;
  const videoTrack = localStream?.getVideoTracks()[0] || null;

  return {
    localStream,
    setLocalStream,
    audioTrack,
    videoTrack,
    isMicOn,
    isCameraOn,
    toggleMic,
    toggleCamera,
    switchDevice,
    devices,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
  };
}
