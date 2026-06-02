"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

export interface CaptionEntry {
  peerId: string;
  name: string;
  text: string;
  timestamp: number;
}

/**
 * Hook to manage real-time speech-to-text captions using the Web Speech API.
 * Broadcasts transcribed texts to all participants and cleans older captions.
 */
export function useCaptions(dataChannel: any, displayName: string) {
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [language, setLanguageState] = useState("en-US");

  const recognitionRef = useRef<any>(null);
  const isEnabledRef = useRef(isEnabled);

  // Sync state ref
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  const toggleCaptions = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      
      if (next) {
        // Initialize SpeechRecognition on request
        const SpeechRecognitionClass =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognitionClass) {
          toast.error("Live captions are not supported in this browser. Use Chrome or Safari.");
          return false;
        }

        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = language;

        rec.onresult = (event: any) => {
          let interim = "";
          let final = "";
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          
          const activeText = final || interim;
          if (activeText.trim()) {
            const myId = dataChannel?.myPeerId || "local";
            const now = Date.now();
            
            // Send caption over DataChannel
            dataChannel?.sendMessage("caption", { text: activeText, timestamp: now, senderName: displayName });
            
            // Append locally
            setCaptions((current) => {
              const clean = current.filter(c => !(c.peerId === myId && now - c.timestamp < 3000));
              return [...clean, { peerId: myId, name: displayName, text: activeText, timestamp: now }];
            });
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          if (err.error === "not-allowed") {
            toast.error("Microphone access blocked. Captions disabled.");
            setIsEnabled(false);
          }
        };

        rec.onend = () => {
          // Restart if captions are still intended to be enabled
          if (isEnabledRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Failed to restart speech recognition:", e);
            }
          }
        };

        recognitionRef.current = rec;
        
        try {
          recognitionRef.current.start();
          toast.success("Captions enabled");
        } catch (e) {
          console.error("Failed to start SpeechRecognition:", e);
        }
      } else {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        toast.success("Captions disabled");
      }
      return next;
    });
  }, [dataChannel, displayName, language]);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
      if (isEnabled) {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            if (isEnabledRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {
            console.error("Error toggling captions language:", e);
          }
        }, 200);
      }
    }
  }, [isEnabled]);

  // Sync data messages
  useEffect(() => {
    if (!dataChannel) return;

    const unbindCaption = dataChannel.onMessage("caption", (payload: any, senderId: string) => {
      const { text, timestamp, senderName } = payload;
      const peerName = senderName || `Participant_${senderId.substring(0, 4)}`;
      
      setCaptions((current) => {
        const clean = current.filter(c => !(c.peerId === senderId && timestamp - c.timestamp < 3000));
        return [...clean, { peerId: senderId, name: peerName, text, timestamp }];
      });
    });

    return () => {
      unbindCaption();
    };
  }, [dataChannel]);

  // Periodically clean up old captions to prevent screen fill
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCaptions((current) => current.filter(c => now - c.timestamp < 6000));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    captions,
    isEnabled,
    toggleCaptions,
    setLanguage,
  };
}
