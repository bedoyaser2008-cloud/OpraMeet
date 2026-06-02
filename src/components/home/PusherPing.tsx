"use client";

import { useEffect, useState } from "react";

export function PusherPing() {
  const [ping, setPing] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "online" | "warning" | "offline">("loading");

  useEffect(() => {
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const measurePing = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const startTime = performance.now();

      try {
        // Ping Pusher cluster's sockjs probe endpoint
        await fetch(`https://sockjs-${cluster}.pusher.com/info?t=${Date.now()}`, {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        const duration = Math.round(performance.now() - startTime);
        setPing(duration);
        
        if (duration < 150) {
          setStatus("online");
        } else if (duration < 350) {
          setStatus("warning");
        } else {
          setStatus("offline");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        setPing(null);
        setStatus("offline");
      }
    };

    // Initial ping
    measurePing();

    // Loop every 1 second
    intervalId = setInterval(measurePing, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Determine pill styling based on state
  let dotColorClass = "bg-slate-400";
  let textColorClass = "text-text-secondary";
  let borderColorClass = "border-white/5";
  let bgClass = "bg-white/5";
  let pingText = "pinging...";

  if (status === "online" && ping !== null) {
    dotColorClass = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
    textColorClass = "text-emerald-400";
    borderColorClass = "border-emerald-500/20";
    bgClass = "bg-emerald-500/5";
    pingText = `${ping}ms`;
  } else if (status === "warning" && ping !== null) {
    dotColorClass = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
    textColorClass = "text-amber-400";
    borderColorClass = "border-amber-500/20";
    bgClass = "bg-amber-500/5";
    pingText = `${ping}ms`;
  } else if (status === "offline") {
    dotColorClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    textColorClass = "text-rose-400";
    borderColorClass = "border-rose-500/20";
    bgClass = "bg-rose-500/5";
    pingText = "offline";
  }

  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border ${borderColorClass} ${bgClass} backdrop-blur-sm transition-all duration-300 font-mono text-[11px] font-semibold cursor-default`}
      title={`Live latency to Pusher cluster: ${cluster.toUpperCase()}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass} animate-pulse`} />
      <span className="hidden sm:inline text-[10px] text-text-tertiary select-none">Pusher ({cluster})</span>
      <span className="hidden sm:inline w-[1px] h-3 bg-white/10" />
      <span className={`${textColorClass} min-w-[32px] text-right`}>{pingText}</span>
    </div>
  );
}
