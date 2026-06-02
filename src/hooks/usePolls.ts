"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export interface PollOption {
  text: string;
  votes: string[]; // List of voter peerIds
}

export interface Poll {
  id: string;
  creatorId: string;
  question: string;
  options: PollOption[];
  isClosed: boolean;
  showResults: boolean;
  createdAt: number;
}

/**
 * Hook to manage real-time poll creation, voting, closures, and reports extraction.
 */
export function usePolls(dataChannel: any, isSenderHost?: (senderId: string) => boolean) {
  const [polls, setPolls] = useState<Poll[]>([]);

  // Launch a new poll
  const createPoll = useCallback((question: string, optionsText: string[]) => {
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      creatorId: dataChannel?.myPeerId || "local",
      question,
      options: optionsText.map(t => ({ text: t, votes: [] })),
      isClosed: false,
      showResults: true,
      createdAt: Date.now(),
    };

    setPolls(prev => [newPoll, ...prev]);
    dataChannel?.sendMessage("poll-create", { poll: newPoll });
    toast.success("Poll launched!");
  }, [dataChannel]);

  // Cast a vote for an option
  const vote = useCallback((pollId: string, optionIndex: number) => {
    const myId = dataChannel?.myPeerId || "local";
    
    setPolls(prev =>
      prev.map(poll => {
        if (poll.id === pollId) {
          const options = poll.options.map((opt, index) => {
            const cleanVotes = opt.votes.filter(v => v !== myId);
            if (index === optionIndex) {
              return { ...opt, votes: [...cleanVotes, myId] };
            }
            return { ...opt, votes: cleanVotes };
          });
          
          const updated = { ...poll, options };
          dataChannel?.sendMessage("poll-vote", { pollId, optionIndex, voterId: myId });
          return updated;
        }
        return poll;
      })
    );
    toast.success("Vote cast");
  }, [dataChannel]);

  // Terminate voting (Host control)
  const closePoll = useCallback((pollId: string) => {
    setPolls(prev =>
      prev.map(p => {
        if (p.id === pollId) {
          const updated = { ...p, isClosed: true };
          dataChannel?.sendMessage("poll-close", { pollId });
          return updated;
        }
        return p;
      })
    );
    toast.success("Poll closed");
  }, [dataChannel]);

  // Hide/Show results breakdown (Host control)
  const toggleResults = useCallback((pollId: string) => {
    setPolls(prev =>
      prev.map(p => {
        if (p.id === pollId) {
          const updated = { ...p, showResults: !p.showResults };
          dataChannel?.sendMessage("poll-toggle-results", { pollId, showResults: updated.showResults });
          return updated;
        }
        return p;
      })
    );
  }, [dataChannel]);

  // Download poll results as CSV
  const exportCsv = useCallback((pollId: string) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Question,${poll.question}\n`;
    csvContent += `Option,Votes,Percentage\n`;

    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
    
    poll.options.forEach(opt => {
      const count = opt.votes.length;
      const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : "0.0";
      csvContent += `"${opt.text.replace(/"/g, '""')}",${count},${pct}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poll_results_${pollId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported");
  }, [polls]);

  // Sync data events
  useEffect(() => {
    if (!dataChannel) return;

    const unbindCreate = dataChannel.onMessage("poll-create", (payload: any, senderId: string) => {
      if (isSenderHost && !isSenderHost(senderId)) return;
      setPolls(prev => [payload.poll, ...prev]);
      toast("New poll launched!", { icon: "📊" });
    });

    const unbindVote = dataChannel.onMessage("poll-vote", (payload: any) => {
      const { pollId, optionIndex, voterId } = payload;
      setPolls(prev =>
        prev.map(poll => {
          if (poll.id === pollId) {
            const options = poll.options.map((opt, idx) => {
              const cleanVotes = opt.votes.filter(v => v !== voterId);
              if (idx === optionIndex) {
                return { ...opt, votes: [...cleanVotes, voterId] };
              }
              return { ...opt, votes: cleanVotes };
            });
            return { ...poll, options };
          }
          return poll;
        })
      );
    });

    const unbindClose = dataChannel.onMessage("poll-close", (payload: any, senderId: string) => {
      if (isSenderHost && !isSenderHost(senderId)) return;
      const { pollId } = payload;
      setPolls(prev => prev.map(p => (p.id === pollId ? { ...p, isClosed: true } : p)));
      toast("The active poll has been closed.");
    });

    const unbindToggle = dataChannel.onMessage("poll-toggle-results", (payload: any, senderId: string) => {
      if (isSenderHost && !isSenderHost(senderId)) return;
      const { pollId, showResults } = payload;
      setPolls(prev => prev.map(p => (p.id === pollId ? { ...p, showResults } : p)));
    });

    return () => {
      unbindCreate();
      unbindVote();
      unbindClose();
      unbindToggle();
    };
  }, [dataChannel]);

  return {
    polls,
    createPoll,
    vote,
    closePoll,
    toggleResults,
    exportCsv,
  };
}
