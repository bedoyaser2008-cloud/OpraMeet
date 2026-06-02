"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreateMeetingCard } from "@/components/home/CreateMeetingCard";
import { JoinMeetingInput } from "@/components/home/JoinMeetingInput";
import toast from "react-hot-toast";
import Image from "next/image";
import BannerImage from "@/assests/OpraMeet-banner.png";

/**
 * OpraMeet Homepage using the Dark Cinema aesthetic.
 * Renders Create and Join cards with ambient animations.
 */
function HomeContent() {
  const searchParams = useSearchParams();

  // Show error toast on invalid redirects from middleware
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "invalid-room") {
      // Add a slight delay so the page transitions are complete
      setTimeout(() => {
        toast.error("Invalid meeting room ID format", {
          id: "invalid-room-toast",
        });
      }, 300);
    }
  }, [searchParams]);

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-bg-app select-none">
      {/* Dynamic Ambient Mesh Glow Background */}
      <div className="absolute inset-0 z-base pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] animate-pulse" />
      </div>

      {/* Header / Logo */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-tiles bg-bg-app/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-default">
            <Image
              src={BannerImage}
              alt="OpraMeet Logo"
              height={72}
              className="w-auto h-16 md:h-[72px] object-contain"
              priority
            />
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-text-tertiary">v1.0.0</span>
        </div>
      </header>

      {/* Main hero center */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-tiles max-w-5xl mx-auto w-full gap-8">
        <div className="text-center flex flex-col items-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight font-sans max-w-2xl"
          >
            Premium video meetings. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Free for everyone.
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-base text-text-secondary max-w-md font-medium"
          >
            Secure, serverless WebRTC video calls with real-time whiteboards, breakout rooms, and AI effects.
          </motion.p>
        </div>

        {/* Cards layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 150, delay: 0.3 }}
          className="flex flex-col md:flex-row gap-6 w-full items-stretch justify-center"
        >
          <CreateMeetingCard />
          <JoinMeetingInput />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/5 relative z-tiles bg-bg-app/40 text-center text-[10px] text-text-tertiary">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-3 font-medium">
          <span>OpraMeet — Built with Next.js, WebRTC, and Pusher</span>
          <div className="flex items-center gap-4">
            <span>Secure</span>
            <span>•</span>
            <span>Free</span>
            <span>•</span>
            <span>Open</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-primary/20 border-t-accent-primary animate-spin" />
        <span className="text-xs text-text-secondary mt-3">Loading OpraMeet...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
