"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface PinEntryProps {
  roomId: string;
  onSuccess: (passcodeHash: string) => void;
}

/**
 * PinEntry card renders PIN checks for private rooms.
 * Includes wrong passcode shake animations, IP rate limits, and lockout countdowns.
 */
export function PinEntry({ roomId, onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Manage lockout countdown timer
  useEffect(() => {
    if (!lockoutTime) return;

    const timer = setInterval(() => {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutTime(null);
        setSecondsLeft(0);
        setError(null);
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    if (lockoutTime) {
      toast.error(`Locked out. Try again in ${secondsLeft} seconds.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Hash the PIN in the browser using SHA-256 via Web Crypto
      const encoder = new TextEncoder();
      const data = encoder.encode(pin.trim());
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passcodeHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Verify hash against backend Sheets DB
      const res = await fetch("/api/room/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, passcodeHash }),
      });

      const result = await res.json();

      if (res.ok && result.granted) {
        if (result.peerToken) {
          sessionStorage.setItem(`peer_token_${roomId}`, result.peerToken);
        }
        toast.success("Passcode verified");
        onSuccess(passcodeHash);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (res.status === 429) {
          // Rate limited lockout
          const resetTime = result.lockedUntil || (Date.now() + 30000);
          setLockoutTime(resetTime);
          setSecondsLeft(Math.ceil((resetTime - Date.now()) / 1000));
          setError("Too many verification attempts. Please wait.");
        } else {
          const attempts = result.attemptsRemaining;
          setError(
            attempts !== undefined
              ? `Incorrect passcode PIN. ${attempts} attempts remaining.`
              : "Incorrect passcode PIN."
          );
        }
      }
    } catch (err) {
      console.error("Passcode verification error:", err);
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bg-app p-4">
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-bg-surface border border-border-subtle p-6 rounded-2xl shadow-xl flex flex-col items-center gap-5"
      >
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20 shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        {/* Info */}
        <div className="text-center">
          <h1 className="text-lg font-bold text-text-primary">Private Meeting</h1>
          <p className="text-xs text-text-secondary mt-1">
            This meeting requires a passcode PIN to enter.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="passcode-pin" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Passcode PIN
            </label>
            <input
              id="passcode-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN passcode"
              disabled={loading || lockoutTime !== null}
              className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-center font-mono text-lg tracking-widest text-text-primary transition-all disabled:opacity-50"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !pin.trim() || lockoutTime !== null}
            className="w-full py-3 bg-accent-primary hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-text-tertiary text-text-on-accent text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            {loading ? "Verifying..." : lockoutTime ? `Locked (${secondsLeft}s)` : "Enter Meeting"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
