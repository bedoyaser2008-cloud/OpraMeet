"use client";

import { useState, useEffect, useRef } from "react";
import { X, Volume2, Mic, Video, Settings as SettingsIcon } from "lucide-react";
import toast from "react-hot-toast";

interface Device {
  deviceId: string;
  label: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: {
    audioInputs: Device[];
    videoInputs: Device[];
    audioOutputs: Device[];
  };
  selectedAudioInput: string;
  selectedVideoInput: string;
  selectedAudioOutput: string;
  onSwitchDevice: (kind: "audioinput" | "videoinput" | "audiooutput", id: string) => void;
  localStream: MediaStream | null;
}

/**
 * SettingsModal using custom dialog component with live previews.
 * Features tabs, device selectors, volume meters, and camera test grids.
 */
export function SettingsModal({
  isOpen,
  onClose,
  devices,
  selectedAudioInput,
  selectedVideoInput,
  selectedAudioOutput,
  onSwitchDevice,
  localStream,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "video" | "general">("audio");
  const [micVolume, setMicVolume] = useState(0);
  
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Synchronize live camera preview of local stream in Settings
  useEffect(() => {
    if (!isOpen || activeTab !== "video" || !localStream || !videoPreviewRef.current) return;

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    videoPreviewRef.current.srcObject = new MediaStream([videoTracks[0]]);
    videoPreviewRef.current.play().catch((err) => {
      console.warn("Settings camera preview play error:", err);
    });
  }, [isOpen, activeTab, localStream]);

  // Synchronize live mic volume check
  useEffect(() => {
    if (!isOpen || activeTab !== "audio" || !localStream) {
      setMicVolume(0);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setMicVolume(0);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      
      const source = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      source.connect(analyser);

      audioContextRef.current = ctx;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteTimeDomainData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Scale and smooth volume bar response
        setMicVolume(Math.min(100, rms * 400));
        animationFrameIdRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameIdRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.error("Audio preview failed in Settings:", e);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    };
  }, [isOpen, activeTab, localStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-bg-surface w-full max-w-lg rounded-2xl border border-border-default shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border-default">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-accent-primary" />
            <h2 className="text-base font-semibold text-text-primary">Settings</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings Panel"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-secondary active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout (Sidebar + Form) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-36 border-r border-border-subtle bg-bg-app/40 p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("audio")}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === "audio"
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-secondary hover:bg-white/5"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === "video"
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-secondary hover:bg-white/5"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
          </div>

          {/* Form Pane */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "audio" && (
              <div className="flex flex-col gap-5">
                {/* Microphone Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="mic-select" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Microphone
                  </label>
                  <select
                    id="mic-select"
                    value={selectedAudioInput}
                    onChange={(e) => onSwitchDevice("audioinput", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary transition-all cursor-pointer"
                  >
                    {devices.audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Microphone Volume Test indicator */}
                <div className="flex flex-col gap-2 bg-bg-app/40 border border-border-subtle p-4 rounded-xl">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Test Microphone
                  </span>
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <div className="flex-1 h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-75"
                        style={{ width: `${micVolume}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Speaker Output Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="speaker-select" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Audio Output (Speaker)
                  </label>
                  <select
                    id="speaker-select"
                    value={selectedAudioOutput}
                    onChange={(e) => onSwitchDevice("audiooutput", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary transition-all cursor-pointer"
                  >
                    {devices.audioOutputs.length === 0 ? (
                      <option value="">Default system speaker</option>
                    ) : (
                      devices.audioOutputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

            {activeTab === "video" && (
              <div className="flex flex-col gap-5">
                {/* Camera Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="camera-select" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Camera
                  </label>
                  <select
                    id="camera-select"
                    value={selectedVideoInput}
                    onChange={(e) => onSwitchDevice("videoinput", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary transition-all cursor-pointer"
                  >
                    {devices.videoInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Video Preview Box */}
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-border-subtle">
                  <video
                    ref={videoPreviewRef}
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[10px] text-text-secondary border border-white/5">
                    Live Test Preview
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-bg-app/40 border-t border-border-default flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-accent-primary hover:bg-accent-hover text-text-on-accent transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
