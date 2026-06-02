"use client";

import { useState } from "react";
import { Plus, Trash2, Download, CheckCircle, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface PollOption {
  text: string;
  votes: string[];
}

interface Poll {
  id: string;
  creatorId: string;
  question: string;
  options: PollOption[];
  isClosed: boolean;
  showResults: boolean;
  createdAt: number;
}

interface PollsPanelProps {
  polls: Poll[];
  onCreatePoll: (question: string, options: string[]) => void;
  onVote: (pollId: string, optionIndex: number) => void;
  onClosePoll: (pollId: string) => void;
  onToggleResults: (pollId: string) => void;
  onExportCsv: (pollId: string) => void;
  isHost: boolean;
  myPeerId: string;
}

/**
 * PollsPanel provides poll launcher forms and live-updating interactive charts.
 */
export function PollsPanel({
  polls,
  onCreatePoll,
  onVote,
  onClosePoll,
  onToggleResults,
  onExportCsv,
  isHost,
  myPeerId,
}: PollsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const handleAddOption = () => {
    if (options.length >= 10) {
      toast.error("Maximum 10 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("A poll must have at least 2 options");
      return;
    }
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions(options.map((opt, idx) => (idx === index ? val : opt)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter((o) => o !== "");
    if (cleanOptions.length < 2) {
      toast.error("Please provide at least 2 non-empty options");
      return;
    }

    onCreatePoll(question.trim(), cleanOptions);
    setQuestion("");
    setOptions(["", ""]);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[360px] bg-bg-surface border-l border-border-subtle shadow-2xl">
      {/* Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border-default">
        <h2 className="text-base font-semibold text-text-primary">Polls</h2>
        {isHost && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-hover text-text-on-accent text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Poll</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isCreating ? (
          /* Create Poll Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="poll-question" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Question
              </label>
              <input
                id="poll-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is your question?"
                className="px-3.5 py-2 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Options
              </span>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3.5 py-2 bg-bg-elevated border border-border-subtle focus:border-border-focus focus:outline-none rounded-xl text-sm text-text-primary placeholder:text-text-tertiary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 text-text-tertiary hover:text-danger active:scale-95 transition-all cursor-pointer border border-border-subtle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddOption}
                className="py-2 mt-1.5 border border-dashed border-border-default hover:border-text-secondary text-text-secondary hover:text-text-primary transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-2 rounded-xl bg-bg-elevated text-text-secondary text-xs font-semibold hover:bg-white/5 transition-all active:scale-95 cursor-pointer border border-border-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:brightness-110 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                Launch Poll
              </button>
            </div>
          </form>
        ) : (
          /* Poll List */
          <div className="flex flex-col gap-4">
            {polls.length === 0 ? (
              <div className="text-center text-text-tertiary py-10">
                <BarChart2 className="w-12 h-12 opacity-35 mx-auto mb-2" />
                <p className="text-xs">No active polls. Hosts can create one.</p>
              </div>
            ) : (
              polls.map((poll) => {
                const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
                const hasVoted = poll.options.some((opt) => opt.votes.includes(myPeerId));
                
                // Find index of option with highest vote count
                let maxVotes = -1;
                let winningIdx = -1;
                poll.options.forEach((opt, idx) => {
                  if (opt.votes.length > maxVotes && opt.votes.length > 0) {
                    maxVotes = opt.votes.length;
                    winningIdx = idx;
                  }
                });

                return (
                  <div
                    key={poll.id}
                    className="p-4 bg-bg-elevated/40 border border-border-subtle rounded-2xl flex flex-col gap-3"
                  >
                    {/* Poll Header info */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-text-tertiary">
                          {poll.isClosed ? "Ended" : "Active"} • {totalVotes} votes
                        </span>
                        <h3 className="text-sm font-semibold text-text-primary leading-tight">
                          {poll.question}
                        </h3>
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="flex flex-col gap-2">
                      {poll.options.map((opt, idx) => {
                        const votedThis = opt.votes.includes(myPeerId);
                        const voteCount = opt.votes.length;
                        const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                        const isWinner = winningIdx === idx;

                        return (
                          <div key={idx} className="relative flex flex-col gap-1">
                            {poll.isClosed || (poll.showResults && hasVoted) ? (
                              /* Read-only Results Bar chart */
                              <div className="relative h-10 w-full rounded-xl bg-bg-app border border-white/5 overflow-hidden flex items-center px-4 justify-between">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                  className={`absolute top-0 bottom-0 left-0 ${
                                    isWinner ? "bg-accent-primary/20 border-r border-accent-primary/40" : "bg-white/5"
                                  }`}
                                />
                                <div className="flex items-center gap-2 z-10 min-w-0">
                                  {votedThis && <CheckCircle className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />}
                                  <span className="text-xs text-text-primary truncate">{opt.text}</span>
                                </div>
                                <span className="text-xs font-mono text-text-secondary z-10 flex-shrink-0">
                                  {voteCount} ({percent.toFixed(0)}%)
                                </span>
                              </div>
                            ) : (
                              /* Interactive Voting Button */
                              <button
                                onClick={() => onVote(poll.id, idx)}
                                disabled={poll.isClosed}
                                className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs cursor-pointer transition-all active:scale-[0.98] ${
                                  votedThis
                                    ? "bg-accent-primary/10 border-accent-primary text-accent-primary font-medium"
                                    : "bg-bg-elevated border-border-subtle hover:border-text-secondary text-text-primary"
                                }`}
                              >
                                {opt.text}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Host Controls */}
                    {isHost && (
                      <div className="flex items-center gap-2 border-t border-white/5 pt-3 mt-1.5 justify-end">
                        {!poll.isClosed && (
                          <button
                            onClick={() => onClosePoll(poll.id)}
                            className="px-2.5 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                          >
                            Close Poll
                          </button>
                        )}
                        <button
                          onClick={() => onToggleResults(poll.id)}
                          className="px-2.5 py-1.5 bg-bg-elevated hover:bg-white/5 text-text-secondary text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                        >
                          {poll.showResults ? "Hide Results" : "Show Results"}
                        </button>
                        <button
                          onClick={() => onExportCsv(poll.id)}
                          title="Export CSV"
                          className="w-7 h-7 bg-bg-elevated hover:bg-white/5 text-text-secondary rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
