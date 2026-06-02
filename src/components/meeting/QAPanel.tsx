"use client";

import { useState, useMemo } from "react";
import { X, MessageSquare, ChevronUp, Check, ShieldCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

export interface Question {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  upvotes: string[]; // List of peerIds
  isAnswered: boolean;
  answerText?: string;
  timestamp: number;
}

interface QAPanelProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSubmitQuestion: (text: string) => void;
  onUpvoteQuestion: (qId: string) => void;
  onAnswerQuestion: (qId: string, answer?: string) => void;
  onDeleteQuestion: (qId: string) => void;
  isHost: boolean;
  myPeerId: string;
}

/**
 * QAPanel renders questions, supports sorting by votes, and moderation controls.
 */
export function QAPanel({
  isOpen,
  onClose,
  questions,
  onSubmitQuestion,
  onUpvoteQuestion,
  onAnswerQuestion,
  onDeleteQuestion,
  isHost,
  myPeerId,
}: QAPanelProps) {
  const [inputText, setInputText] = useState("");
  const [answeringQId, setAnsweringQId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitQuestion(inputText.trim());
    setInputText("");
    toast.success("Question posted");
  };

  const handleSendAnswer = (qId: string) => {
    if (!answerInput.trim()) return;
    onAnswerQuestion(qId, answerInput.trim());
    setAnsweringQId(null);
    setAnswerInput("");
    toast.success("Answer posted");
  };

  // Sort: unanswered + highest upvotes first, then answered at the bottom
  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (a.isAnswered && !b.isAnswered) return 1;
      if (!a.isAnswered && b.isAnswered) return -1;
      return b.upvotes.length - a.upvotes.length;
    });
  }, [questions]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full max-w-[360px] bg-bg-surface border-l border-border-subtle shadow-2xl">
      {/* Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border-default">
        <h2 className="text-base font-semibold text-text-primary">Q&A</h2>
        <button
          onClick={onClose}
          aria-label="Close Q&A Panel"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-secondary active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {sortedQuestions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-tertiary">
            <MessageSquare className="w-12 h-12 opacity-35 mb-2" />
            <p className="text-xs">No questions asked yet. Ask one below!</p>
          </div>
        ) : (
          sortedQuestions.map((q) => {
            const hasUpvoted = q.upvotes.includes(myPeerId);
            const initials = q.senderName
              ? q.senderName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
              : "?";

            return (
              <div
                key={q.id}
                className={clsx(
                  "p-4 bg-bg-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-3 transition-all",
                  q.isAnswered && "opacity-70 border-white/5 bg-bg-app/40"
                )}
              >
                {/* Meta Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-text-secondary truncate max-w-[120px]">
                        {q.senderName}
                      </span>
                      <span className="text-[9px] font-mono text-text-tertiary">
                        {new Date(q.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Upvote triggers */}
                  <button
                    onClick={() => onUpvoteQuestion(q.id)}
                    disabled={q.isAnswered}
                    className={clsx(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
                      hasUpvoted
                        ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                        : "bg-bg-elevated border-border-subtle hover:border-text-secondary text-text-secondary"
                    )}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>{q.upvotes.length}</span>
                  </button>
                </div>

                {/* Content */}
                <p className="text-sm text-text-primary break-words leading-snug">
                  {q.text}
                </p>

                {/* Answer State */}
                {q.isAnswered && q.answerText && (
                  <div className="p-3 rounded-xl bg-success/5 border border-success/15 flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1 text-success font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Answered by Host</span>
                    </div>
                    <p className="text-text-secondary break-words leading-normal">
                      {q.answerText}
                    </p>
                  </div>
                )}

                {/* Answering Input Trigger (Host) */}
                {answeringQId === q.id ? (
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1.5">
                    <textarea
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Type your answer..."
                      rows={2}
                      className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-xs text-text-primary transition-all resize-none"
                    />
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setAnsweringQId(null)}
                        className="px-2.5 py-1.5 bg-bg-elevated text-text-secondary text-[10px] font-semibold rounded-lg cursor-pointer hover:bg-white/5 active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendAnswer(q.id)}
                        className="px-2.5 py-1.5 bg-success text-white text-[10px] font-semibold rounded-lg cursor-pointer hover:brightness-110 active:scale-95 shadow-sm"
                      >
                        Submit Answer
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Admin actions row */
                  (isHost || q.senderId === myPeerId) && (
                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2.5 mt-1">
                      {isHost && !q.isAnswered && (
                        <button
                          onClick={() => setAnsweringQId(q.id)}
                          className="px-2.5 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-[10px] font-semibold rounded-lg cursor-pointer active:scale-95 transition-all"
                        >
                          Answer
                        </button>
                      )}
                      
                      <button
                        onClick={() => onDeleteQuestion(q.id)}
                        title="Delete Question"
                        className="w-7 h-7 bg-bg-elevated hover:bg-danger/10 text-text-tertiary hover:text-danger rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-border-subtle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input section */}
      <form onSubmit={handleSend} className="p-4 border-t border-border-default flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question..."
          maxLength={300}
          className="flex-1 px-4 py-2.5 bg-bg-elevated/60 hover:bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 bg-accent-primary hover:bg-accent-hover disabled:bg-bg-elevated disabled:text-text-tertiary text-text-on-accent text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-md"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
