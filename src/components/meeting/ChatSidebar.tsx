"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myPeerId: string;
}

/**
 * Slide-in chat panel styled using the Dark Cinema theme.
 * Handles auto-scroll, copy actions, and custom alignments.
 */
export function ChatSidebar({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  myPeerId,
}: ChatSidebarProps) {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    toast.success("Message copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed top-0 right-0 h-full w-full md:w-[360px] bg-bg-surface border-l border-border-subtle z-sidebar flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border-default">
        <h2 className="text-base font-semibold text-text-primary">In-meeting messages</h2>
        <button
          onClick={onClose}
          aria-label="Close Chat Panel"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all text-text-secondary cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info warning alert */}
      <div className="p-3 bg-bg-elevated/40 border-b border-border-subtle text-[11px] text-text-secondary">
        Messages are only visible to active participants and are deleted when the meeting ends.
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-tertiary">
            <MessageSquarePlaceholder className="w-12 h-12 opacity-35 mb-2" />
            <p className="text-xs">No messages yet. Send one below!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === myPeerId;
            const msgId = `${msg.timestamp}-${index}`;
            const initials = msg.senderName
              ? msg.senderName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
              : "?";

            return (
              <div
                key={msgId}
                className={`flex gap-3 max-w-[85%] group ${isMe ? "self-end flex-row-reverse" : "self-start"}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-text-secondary select-none">
                  {initials}
                </div>

                {/* Message Bubble Column */}
                <div className="flex flex-col gap-1">
                  <div className={`flex items-center gap-2 text-[10px] text-text-secondary ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="font-medium truncate max-w-[100px]">{msg.senderName}</span>
                    <span className="font-mono text-text-tertiary">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="relative">
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm break-words ${
                        isMe
                          ? "bg-accent-primary text-text-on-accent rounded-tr-none"
                          : "bg-bg-elevated text-text-primary rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Copy action triggered on message hover */}
                    <button
                      onClick={() => handleCopy(msg.text, msgId)}
                      className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-bg-app border border-white/10 flex items-center justify-center text-text-secondary shadow-md hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer ${
                        isMe ? "-left-9" : "-right-9"
                      }`}
                      title="Copy message"
                    >
                      {copiedId === msgId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input section */}
      <form onSubmit={handleSend} className="p-4 border-t border-border-default flex gap-2.5 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          className="flex-1 px-4 py-2.5 bg-bg-elevated/60 hover:bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
        />
        <button
          type="submit"
          aria-label="Send Message"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-xl bg-accent-primary hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-text-tertiary flex items-center justify-center text-text-on-accent transition-all duration-150 cursor-pointer active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-md"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </motion.div>
  );
}

function MessageSquarePlaceholder(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
