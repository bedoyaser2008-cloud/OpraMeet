"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Hook to analyze audio stream volume levels and determine active speaker state.
 */
export function useAudioMeter(stream: MediaStream | null) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingStateRef = useRef(false);

  useEffect(() => {
    if (!stream) {
      setIsSpeaking(false);
      setVolume(0);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setIsSpeaking(false);
      setVolume(0);
      return;
    }

    const audioTrack = audioTracks[0];
    
    // Audio Context is initialized only if track is active and enabled
    if (!audioTrack.enabled) {
      setIsSpeaking(false);
      setVolume(0);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      
      const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingStartTimestamp = 0;

      const checkAudio = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Compute Root Mean Square (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128; // Normalize
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Set volume state
        setVolume(rms);

        // Threshold speaking validation (volume > 0.015 for > 300ms)
        const threshold = 0.015;
        const now = Date.now();

        if (rms > threshold) {
          if (speakingStartTimestamp === 0) {
            speakingStartTimestamp = now;
          } else if (now - speakingStartTimestamp > 300) {
            if (!isSpeakingStateRef.current) {
              isSpeakingStateRef.current = true;
              setIsSpeaking(true);
            }
          }
          
          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = null;
          }
        } else {
          speakingStartTimestamp = 0;
          if (isSpeakingStateRef.current && !speakingTimeoutRef.current) {
            // Debounce speaker indicator for 400ms after silence detected
            speakingTimeoutRef.current = setTimeout(() => {
              isSpeakingStateRef.current = false;
              setIsSpeaking(false);
            }, 400);
          }
        }

        animationFrameIdRef.current = requestAnimationFrame(checkAudio);
      };

      animationFrameIdRef.current = requestAnimationFrame(checkAudio);

    } catch (err) {
      console.error("Audio meter initialization failed:", err);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, [stream]);

  return { isSpeaking, volume };
}
