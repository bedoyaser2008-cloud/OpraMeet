"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Settings, Sparkles, User } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";

interface Device {
  deviceId: string;
  label: string;
}

interface LobbyPreviewProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  isMicOn: boolean;
  toggleMic: () => void;
  isCameraOn: boolean;
  toggleCamera: () => void;
  localStream: MediaStream | null;
  devices: {
    audioInputs: Device[];
    videoInputs: Device[];
    audioOutputs: Device[];
  };
  selectedAudioInput: string;
  selectedVideoInput: string;
  onSwitchDevice: (kind: "audioinput" | "videoinput" | "audiooutput", id: string) => void;
  bgMode: "none" | "blur-light" | "blur-heavy" | "image";
  onChangeBgMode: (mode: "none" | "blur-light" | "blur-heavy" | "image") => void;
  onChangeBgImage: (url: string) => void;
  onJoin: () => void;
}

/**
 * LobbyPreview renders a pre-meeting screen with device configurations and virtual effects picker.
 */
export function LobbyPreview({
  displayName,
  setDisplayName,
  isMicOn,
  toggleMic,
  isCameraOn,
  toggleCamera,
  localStream,
  devices,
  selectedAudioInput,
  selectedVideoInput,
  onSwitchDevice,
  bgMode,
  onChangeBgMode,
  onChangeBgImage,
  onJoin,
}: LobbyPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showEffects, setShowEffects] = useState(false);

  // Load stream in preview box
  useEffect(() => {
    if (!videoRef.current || !localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    videoRef.current.srcObject = new MediaStream([videoTracks[0]]);
    videoRef.current.play().catch((e) => {
      console.warn("Lobby camera preview play blocked:", e);
    });
  }, [localStream, isCameraOn]);

  const handleJoinClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter your display name");
      return;
    }
    onJoin();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 bg-bg-app text-text-primary min-h-[80vh]">
      {/* Left side: Camera Preview + Media Toggles */}
      <div className="flex-1 flex flex-col items-center gap-4 w-full">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border-default bg-black shadow-xl">
          {/* Avatar representation when cam is disabled */}
          {isCameraOn && localStream && localStream.getVideoTracks().length > 0 ? (
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
              <div className="w-20 h-20 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center shadow-lg text-text-secondary">
                <User className="w-8 h-8" />
              </div>
            </div>
          )}

          {/* Quick status overlays */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={clsx(
                "w-11 h-11 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md shadow cursor-pointer transition-all active:scale-95",
                isMicOn ? "bg-black/60 text-white" : "bg-danger text-white border-none"
              )}
            >
              {isMicOn ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
            </button>
            <button
              onClick={toggleCamera}
              className={clsx(
                "w-11 h-11 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md shadow cursor-pointer transition-all active:scale-95",
                isCameraOn ? "bg-black/60 text-white" : "bg-danger text-white border-none"
              )}
            >
              {isCameraOn ? <Video className="w-4.5 h-4.5" /> : <VideoOff className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Toggle Visual Effects Picker */}
        <button
          onClick={() => setShowEffects(!showEffects)}
          className={clsx(
            "px-4 py-2 border border-border-subtle hover:border-text-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95",
            showEffects ? "bg-accent-primary/10 border-accent-primary text-accent-primary" : "bg-bg-elevated/45 text-text-secondary"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>{showEffects ? "Hide Visual Effects" : "Choose Visual Effects"}</span>
        </button>

        {/* Dynamic Background Picker section */}
        {showEffects && (
          <div className="w-full">
            <BackgroundPickerWrapper
              bgMode={bgMode}
              onChangeMode={onChangeBgMode}
              onChangeImage={onChangeBgImage}
            />
          </div>
        )}
      </div>

      {/* Right side: Name Entry + Device Settings + Join Action */}
      <div className="w-full md:w-80 flex flex-col gap-6 bg-bg-surface/50 border border-border-subtle p-6 rounded-2xl backdrop-blur-md shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-text-primary leading-tight">Ready to join?</h1>
          <p className="text-xs text-text-secondary mt-1">Check your settings before entering.</p>
        </div>

        {/* Name input form */}
        <form onSubmit={handleJoinClick} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="display-name" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
            />
          </div>

          {/* Quick Hardware settings dropdowns */}
          <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5" />
              <span>Devices</span>
            </div>

            {/* Mic */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Mic</span>
              <select
                value={selectedAudioInput}
                onChange={(e) => onSwitchDevice("audioinput", e.target.value)}
                className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-primary cursor-pointer focus:outline-none"
              >
                {devices.audioInputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Camera</span>
              <select
                value={selectedVideoInput}
                onChange={(e) => onSwitchDevice("videoinput", e.target.value)}
                className="w-full px-2.5 py-1.5 bg-bg-elevated border border-border-subtle rounded-lg text-xs text-text-primary cursor-pointer focus:outline-none"
              >
                {devices.videoInputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-3 bg-accent-primary hover:bg-accent-hover text-text-on-accent text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            <span>Join Meeting</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// Inline mini Wrapper for BackgroundPicker to decouple imports cleanly
function BackgroundPickerWrapper({
  bgMode,
  onChangeMode,
  onChangeImage,
}: {
  bgMode: "none" | "blur-light" | "blur-heavy" | "image";
  onChangeMode: (mode: "none" | "blur-light" | "blur-heavy" | "image") => void;
  onChangeImage: (url: string) => void;
}) {
  const PRESETS = [
    { id: "office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=640&q=80" },
    { id: "nature", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=640&q=80" },
    { id: "abstract", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=640&q=80" },
  ];

  return (
    <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onChangeMode("none")}
        className={clsx(
          "px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all active:scale-95",
          bgMode === "none" ? "bg-accent-primary/10 border-accent-primary text-accent-primary" : "bg-bg-elevated border-border-subtle text-text-secondary"
        )}
      >
        Off
      </button>
      <button
        onClick={() => onChangeMode("blur-light")}
        className={clsx(
          "px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all active:scale-95",
          bgMode === "blur-light" ? "bg-accent-primary/10 border-accent-primary text-accent-primary" : "bg-bg-elevated border-border-subtle text-text-secondary"
        )}
      >
        Light Blur
      </button>
      <button
        onClick={() => onChangeMode("blur-heavy")}
        className={clsx(
          "px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all active:scale-95",
          bgMode === "blur-heavy" ? "bg-accent-primary/10 border-accent-primary text-accent-primary" : "bg-bg-elevated border-border-subtle text-text-secondary"
        )}
      >
        Heavy Blur
      </button>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => {
            onChangeImage(p.url);
            onChangeMode("image");
          }}
          className={clsx(
            "w-8 h-8 rounded-lg overflow-hidden border cursor-pointer hover:scale-105 active:scale-95 transition-all",
            bgMode === "image" ? "border-accent-primary" : "border-border-subtle"
          )}
        >
          <img src={p.url} className="w-full h-full object-cover" alt="" />
        </button>
      ))}
    </div>
  );
}
