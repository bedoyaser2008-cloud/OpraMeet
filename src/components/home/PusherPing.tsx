"use client";

import { useEffect, useState } from "react";

type ServerState = {
  ping: number | null;
  status: "loading" | "online" | "warning" | "offline";
};

export function PusherPing() {
  const [videoServer, setVideoServer] = useState<ServerState>({ ping: null, status: "loading" });
  const [appServer, setAppServer] = useState<ServerState>({ ping: null, status: "loading" });

  useEffect(() => {
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";
    let isMounted = true;
    let videoInterval: NodeJS.Timeout;
    let appInterval: NodeJS.Timeout;

    const measureVideoPing = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const startTime = performance.now();

      try {
        await fetch(`https://sockjs-${cluster}.pusher.com/info?t=${Date.now()}`, {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        const duration = Math.round(performance.now() - startTime);
        let status: ServerState["status"] = "online";
        if (duration >= 350) status = "offline";
        else if (duration >= 150) status = "warning";

        setVideoServer({ ping: duration, status });
      } catch (err) {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        setVideoServer({ ping: null, status: "offline" });
      }
    };

    const measureAppPing = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const startTime = performance.now();

      try {
        await fetch(`/api/ping?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!isMounted) return;

        const duration = Math.round(performance.now() - startTime);
        let status: ServerState["status"] = "online";
        if (duration >= 350) status = "offline";
        else if (duration >= 150) status = "warning";

        setAppServer({ ping: duration, status });
      } catch (err) {
        clearTimeout(timeoutId);
        if (!isMounted) return;
        setAppServer({ ping: null, status: "offline" });
      }
    };

    // Initial runs
    measureVideoPing();
    measureAppPing();

    // Intervals
    videoInterval = setInterval(measureVideoPing, 1000);
    appInterval = setInterval(measureAppPing, 1000);

    return () => {
      isMounted = false;
      clearInterval(videoInterval);
      clearInterval(appInterval);
    };
  }, []);

  const getStyleProps = (state: ServerState) => {
    let dotColorClass = "bg-slate-400";
    let textColorClass = "text-text-secondary";
    let borderColorClass = "border-white/5";
    let bgClass = "bg-white/5";
    let pingText = "pinging...";

    if (state.status === "online" && state.ping !== null) {
      dotColorClass = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]";
      textColorClass = "text-emerald-400";
      borderColorClass = "border-emerald-500/20";
      bgClass = "bg-emerald-500/5";
      pingText = `${state.ping}ms`;
    } else if (state.status === "warning" && state.ping !== null) {
      dotColorClass = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
      textColorClass = "text-amber-400";
      borderColorClass = "border-amber-500/20";
      bgClass = "bg-amber-500/5";
      pingText = `${state.ping}ms`;
    } else if (state.status === "offline") {
      dotColorClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
      textColorClass = "text-rose-400";
      borderColorClass = "border-rose-500/20";
      bgClass = "bg-rose-500/5";
      pingText = "offline";
    }

    return { dotColorClass, textColorClass, borderColorClass, bgClass, pingText };
  };

  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";
  const videoStyles = getStyleProps(videoServer);
  const appStyles = getStyleProps(appServer);

  return (
    <div className="flex flex-col gap-1 items-center scale-90 sm:scale-100 transition-all duration-300">
      {/* Video Server Status */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 rounded-full border ${videoStyles.borderColorClass} ${videoStyles.bgClass} backdrop-blur-sm transition-all duration-300 font-mono text-[10px] font-semibold cursor-default`}
        title={`Live latency to Pusher cluster: ${cluster.toUpperCase()}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${videoStyles.dotColorClass} animate-pulse`} />
        <span className="hidden sm:inline text-[9px] text-text-tertiary select-none">Video Server ({cluster})</span>
        <span className="hidden sm:inline w-[1px] h-2.5 bg-white/10" />
        <span className={`${videoStyles.textColorClass} min-w-[32px] text-right`}>{videoStyles.pingText}</span>
      </div>

      {/* App Server Status */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 rounded-full border ${appStyles.borderColorClass} ${appStyles.bgClass} backdrop-blur-sm transition-all duration-300 font-mono text-[10px] font-semibold cursor-default`}
        title="Live latency to App Backend Server"
      >
        <div className={`w-1.5 h-1.5 rounded-full ${appStyles.dotColorClass} animate-pulse`} />
        <span className="hidden sm:inline text-[9px] text-text-tertiary select-none">Backend Server (API)</span>
        <span className="hidden sm:inline w-[1px] h-2.5 bg-white/10" />
        <span className={`${appStyles.textColorClass} min-w-[32px] text-right`}>{appStyles.pingText}</span>
      </div>
    </div>
  );
}
