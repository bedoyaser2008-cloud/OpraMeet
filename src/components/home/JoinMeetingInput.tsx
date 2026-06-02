"use client";

import { useState, useMemo } from "react";
import { Keyboard, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { isValidRoomId } from "@/lib/roomId";
import toast from "react-hot-toast";

/**
 * JoinMeetingInput handles parsing and validating meeting codes/URLs.
 * Redirects the browser to target meeting path.
 */
export function JoinMeetingInput() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  // Extract room ID from URL or raw text input
  const parsedRoomId = useMemo(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return "";

    try {
      // If it looks like a URL, parse it
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const path = url.pathname.substring(1); // Remove leading slash
        return path;
      }
    } catch (e) {
      // parsing failed, treat as raw code
    }

    return trimmed;
  }, [inputValue]);

  const isValid = useMemo(() => {
    return isValidRoomId(parsedRoomId);
  }, [parsedRoomId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please enter a valid meeting code in format abc-abcd-abc");
      return;
    }
    
    // Redirect browser to room lobby page
    router.push(`/${parsedRoomId}`);
  };

  return (
    <div className="glass border border-glass-border p-6 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-5 bg-glass-bg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary border border-accent-primary/20">
          <Keyboard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Join a Meeting</h2>
          <p className="text-[11px] text-text-secondary">Enter a meeting code or sharing link below.</p>
        </div>
      </div>

      {/* Input section */}
      <form onSubmit={handleJoin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="join-code" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Meeting Link or Code
          </label>
          <input
            id="join-code"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. abc-abcd-abc"
            className="w-full px-3.5 py-2.5 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
          />
        </div>

        {/* Info feedback */}
        {inputValue.trim() !== "" && (
          <div className="text-[11px] font-medium transition-all px-1">
            {isValid ? (
              <span className="text-success">✓ Valid meeting code: {parsedRoomId}</span>
            ) : (
              <span className="text-text-tertiary">Format should be: abc-abcd-abc</span>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid}
          className="w-full py-2.5 bg-accent-primary hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-text-tertiary text-text-on-accent text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-1.5"
        >
          <span>Join Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
