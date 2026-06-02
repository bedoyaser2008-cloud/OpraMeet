"use client";

import { useState } from "react";
import { Video, Copy, Check, Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { generateRoomId } from "@/lib/roomId";
import { hashPasscode } from "@/lib/crypto-client";
import toast from "react-hot-toast";

/**
 * CreateMeetingCard handles configuration of a new meeting room (waiting room, PIN, passcode hashing).
 * Saves room parameters to the database via API routes.
 */
export function CreateMeetingCard() {
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [passcode, setPasscode] = useState("");
  
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateMeeting = async () => {
    if (isPrivate && (!passcode || passcode.length < 4)) {
      toast.error("Please enter a private passcode of at least 4 characters");
      return;
    }

    setLoading(true);
    const roomId = generateRoomId();

    try {
      let passcodeHash = null;
      if (isPrivate) {
        passcodeHash = await hashPasscode(passcode);
      }

      const hostId = `host_${Math.random().toString(36).substring(2, 11)}`;

      // Save configurations to sheets database via Serverless API route
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          hostId,
          isPrivate,
          passcodeHash,
          waitingRoom,
        }),
      });

      if (res.ok) {
        const origin = window.location.origin;
        const link = `${origin}/${roomId}`;
        
        // Store host status for this room locally
        localStorage.setItem(`host_${roomId}`, hostId);
        
        setGeneratedLink(link);
        toast.success("Meeting room created!");
      } else {
        const err = await res.json();
        toast.error(`Creation failed: ${err.error || "Server issue."}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error creating meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Meeting link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass border border-glass-border p-6 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-5 bg-glass-bg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Create a Meeting</h2>
          <p className="text-[11px] text-text-secondary">Set up secure, private meetings instantly.</p>
        </div>
      </div>

      {!generatedLink ? (
        /* Configuration Form */
        <div className="flex flex-col gap-4">
          {/* Toggle Private Meeting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-app/40 border border-border-subtle">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-text-secondary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Private Meeting</span>
                <span className="text-[9px] text-text-tertiary">Requires a PIN passcode</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:height-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary" />
            </label>
          </div>

          {/* Toggle Waiting Room */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-bg-app/40 border border-border-subtle">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-text-secondary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-primary">Waiting Room</span>
                <span className="text-[9px] text-text-tertiary">Host manually admits entries</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={waitingRoom}
                onChange={(e) => setWaitingRoom(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:height-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary" />
            </label>
          </div>

          {/* passcode input conditional */}
          {isPrivate && (
            <div className="flex flex-col gap-1.5 animate-slide-in-right">
              <label htmlFor="passcode-input" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Passcode PIN
              </label>
              <input
                id="passcode-input"
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Choose meeting PIN (e.g. 1234)"
                maxLength={12}
                className="w-full px-3.5 py-2 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-xs text-text-primary transition-all font-mono"
              />
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleCreateMeeting}
            disabled={loading}
            className="w-full py-2.5 bg-accent-primary hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-text-tertiary text-text-on-accent text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <span>{loading ? "Generating..." : "Get Meeting Link"}</span>
          </button>
        </div>
      ) : (
        /* Results Presentation Card */
        <div className="flex flex-col gap-4 animate-scale-in">
          <div className="flex flex-col gap-1 bg-bg-app/40 border border-border-subtle p-3.5 rounded-xl">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Share link with participants
            </span>
            <div className="flex items-center justify-between gap-3 mt-1.5">
              <span className="text-xs font-mono text-text-primary truncate select-all">
                {generatedLink}
              </span>
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-elevated hover:bg-white/5 border border-white/5 text-text-secondary hover:text-text-primary cursor-pointer active:scale-90 transition-all"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isPrivate && (
            <div className="px-3 py-2 bg-amber-500/10 border border-amber-400/20 rounded-xl text-[10px] text-amber-400 leading-relaxed">
              🔑 This meeting is protected by passcode PIN: <strong>{passcode}</strong>
            </div>
          )}

          <a
            href={generatedLink}
            className="w-full py-2.5 bg-success hover:brightness-110 text-white text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5 text-center"
          >
            <span>Enter Lobby</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
