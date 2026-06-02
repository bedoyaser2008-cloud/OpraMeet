"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Undo2, Redo2, Trash2, Download, Square, Circle, Type, Eraser, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface DrawPayload {
  tool: string;
  x: number;
  y: number;
  prevX?: number;
  prevY?: number;
  color?: string;
  width?: number;
  text?: string;
  isEnd?: boolean;
}

interface WhiteboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  dataChannel: any;
}

const PRESET_COLORS = ["#ffffff", "#06b6d4", "#8b5cf6", "#10b981", "#f43f5e", "#fbbf24"];

/**
 * WhiteboardPanel renders a shared drawing board using WebRTC data channels for real-time syncing.
 */
export function WhiteboardPanel({
  isOpen,
  onClose,
  isHost,
  dataChannel,
}: WhiteboardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [activeTool, setActiveTool] = useState<"pen" | "eraser" | "rect" | "circle" | "text">("pen");
  const [strokeColor, setStrokeColor] = useState("#06b6d4"); // Cyan-500
  const [lineWidth, setLineWidth] = useState(3);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });

  const historyRef = useRef<string[]>([]);
  const historyStepRef = useRef<number>(-1);

  // Load and scale canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 680;
    canvas.height = 420;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    saveHistoryState();
  }, [isOpen]);

  const saveHistoryState = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    
    // Prune history forward if we had undone steps
    const cleanHistory = historyRef.current.slice(0, historyStepRef.current + 1);
    cleanHistory.push(dataUrl);

    // Limit to 50 steps
    if (cleanHistory.length > 50) {
      cleanHistory.shift();
    }

    historyRef.current = cleanHistory;
    historyStepRef.current = cleanHistory.length - 1;
  };

  const handleUndo = useCallback(() => {
    if (historyStepRef.current <= 0 || !canvasRef.current || !contextRef.current) return;

    historyStepRef.current -= 1;
    const img = new Image();
    img.src = historyRef.current[historyStepRef.current];
    img.onload = () => {
      contextRef.current?.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      contextRef.current?.drawImage(img, 0, 0);
    };
  }, []);

  const handleRedo = useCallback(() => {
    if (historyStepRef.current >= historyRef.current.length - 1 || !canvasRef.current || !contextRef.current) return;

    historyStepRef.current += 1;
    const img = new Image();
    img.src = historyRef.current[historyStepRef.current];
    img.onload = () => {
      contextRef.current?.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      contextRef.current?.drawImage(img, 0, 0);
    };
  }, []);

  const clearBoard = useCallback((shouldBroadcast = true) => {
    if (!canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistoryState();

    if (shouldBroadcast) {
      dataChannel?.sendMessage("whiteboard-draw", { tool: "clear", x: 0, y: 0 });
    }
  }, [dataChannel]);

  const handleClearTrigger = () => {
    if (!isHost) {
      toast.error("Only the host can clear the whiteboard");
      return;
    }
    const confirm = window.confirm("Are you sure you want to clear the whiteboard?");
    if (confirm) {
      clearBoard(true);
      toast.success("Board cleared");
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Scale coords in case element layout sizes don't match drawing dimensions
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    startPosRef.current = coords;
    lastPosRef.current = coords;
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    const coords = getCanvasCoords(e);
    const ctx = contextRef.current;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : strokeColor;

    if (activeTool === "pen" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      dataChannel?.sendMessage("whiteboard-draw", {
        tool: activeTool,
        x: coords.x,
        y: coords.y,
        prevX: lastPosRef.current.x,
        prevY: lastPosRef.current.y,
        color: activeTool === "eraser" ? "#ffffff" : strokeColor,
        width: lineWidth,
      } as DrawPayload);

      lastPosRef.current = coords;
    }
  };

  const handleEndDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    setIsDrawing(false);
    const coords = getCanvasCoords(e);
    const ctx = contextRef.current;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;

    if (activeTool === "rect") {
      const w = coords.x - startPosRef.current.x;
      const h = coords.y - startPosRef.current.y;
      ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
      
      dataChannel?.sendMessage("whiteboard-draw", {
        tool: "rect",
        x: coords.x,
        y: coords.y,
        prevX: startPosRef.current.x,
        prevY: startPosRef.current.y,
        color: strokeColor,
        width: lineWidth,
        isEnd: true,
      });
    } else if (activeTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(coords.x - startPosRef.current.x, 2) + Math.pow(coords.y - startPosRef.current.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPosRef.current.x, startPosRef.current.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      dataChannel?.sendMessage("whiteboard-draw", {
        tool: "circle",
        x: coords.x,
        y: coords.y,
        prevX: startPosRef.current.x,
        prevY: startPosRef.current.y,
        color: strokeColor,
        width: lineWidth,
        isEnd: true,
      });
    } else if (activeTool === "text") {
      const text = window.prompt("Enter text to write:");
      if (text) {
        ctx.font = `${lineWidth * 4 + 12}px sans-serif`;
        ctx.fillText(text, coords.x, coords.y);
        
        dataChannel?.sendMessage("whiteboard-draw", {
          tool: "text",
          x: coords.x,
          y: coords.y,
          color: strokeColor,
          width: lineWidth,
          text,
        });
      }
    }

    saveHistoryState();
  };

  // Setup broadcast listeners
  useEffect(() => {
    if (!dataChannel) return;

    const unbindDraw = dataChannel.onMessage("whiteboard-draw", (payload: DrawPayload) => {
      if (!contextRef.current || !canvasRef.current) return;
      const ctx = contextRef.current;

      if (payload.tool === "clear") {
        clearBoard(false);
        return;
      }

      ctx.save();
      ctx.lineWidth = payload.width || 3;
      ctx.strokeStyle = payload.color || "#000000";
      ctx.fillStyle = payload.color || "#000000";

      if (payload.tool === "pen" || payload.tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(payload.prevX!, payload.prevY!);
        ctx.lineTo(payload.x, payload.y);
        ctx.stroke();
      } else if (payload.tool === "rect" && payload.isEnd) {
        const w = payload.x - payload.prevX!;
        const h = payload.y - payload.prevY!;
        ctx.strokeRect(payload.prevX!, payload.prevY!, w, h);
        saveHistoryState();
      } else if (payload.tool === "circle" && payload.isEnd) {
        const radius = Math.sqrt(
          Math.pow(payload.x - payload.prevX!, 2) + Math.pow(payload.y - payload.prevY!, 2)
        );
        ctx.beginPath();
        ctx.arc(payload.prevX!, payload.prevY!, radius, 0, 2 * Math.PI);
        ctx.stroke();
        saveHistoryState();
      } else if (payload.tool === "text") {
        ctx.font = `${(payload.width || 3) * 4 + 12}px sans-serif`;
        ctx.fillText(payload.text || "", payload.x, payload.y);
        saveHistoryState();
      }

      ctx.restore();
    });

    return () => {
      unbindDraw();
    };
  }, [dataChannel, clearBoard]);

  const downloadWhiteboard = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `whiteboard_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Whiteboard downloaded as PNG");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      {/* Container Card */}
      <div className="bg-bg-surface w-full max-w-3xl rounded-2xl border border-border-default shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border-default bg-bg-app/40">
          <h2 className="text-sm font-semibold text-text-primary">Collaborative Whiteboard</h2>
          <button
            onClick={onClose}
            aria-label="Close Whiteboard"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-secondary active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-border-subtle bg-bg-surface flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-bg-elevated/45 p-1 rounded-xl border border-white/5">
            {/* Tools Selector */}
            <button
              onClick={() => setActiveTool("pen")}
              className={clsx("w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer", {
                "bg-accent-primary text-text-on-accent": activeTool === "pen",
                "text-text-secondary hover:bg-white/5": activeTool !== "pen",
              })}
              title="Pen"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool("eraser")}
              className={clsx("w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer", {
                "bg-accent-primary text-text-on-accent": activeTool === "eraser",
                "text-text-secondary hover:bg-white/5": activeTool !== "eraser",
              })}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool("rect")}
              className={clsx("w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer", {
                "bg-accent-primary text-text-on-accent": activeTool === "rect",
                "text-text-secondary hover:bg-white/5": activeTool !== "rect",
              })}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool("circle")}
              className={clsx("w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer", {
                "bg-accent-primary text-text-on-accent": activeTool === "circle",
                "text-text-secondary hover:bg-white/5": activeTool !== "circle",
              })}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTool("text")}
              className={clsx("w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer", {
                "bg-accent-primary text-text-on-accent": activeTool === "text",
                "text-text-secondary hover:bg-white/5": activeTool !== "text",
              })}
              title="Text"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* Color presets (Hidden if eraser active) */}
          {activeTool !== "eraser" && (
            <div className="flex items-center gap-1.5 bg-bg-elevated/45 p-1 px-2 rounded-xl border border-white/5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={clsx(
                    "w-5 h-5 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-all border border-black/10",
                    {
                      "ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-surface": strokeColor === color,
                    }
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Line weight slider */}
          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase">
            <span>Size</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
              className="w-24 accent-accent-primary cursor-pointer"
            />
            <span className="font-mono w-5">{lineWidth}</span>
          </div>

          {/* History + System operations */}
          <div className="flex items-center gap-1 bg-bg-elevated/45 p-1 rounded-xl border border-white/5">
            <button
              onClick={handleUndo}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-text-secondary hover:text-text-primary active:scale-95 cursor-pointer"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-text-secondary hover:text-text-primary active:scale-95 cursor-pointer"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={downloadWhiteboard}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-text-secondary hover:text-accent-primary active:scale-95 cursor-pointer"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>
            {isHost && (
              <button
                onClick={handleClearTrigger}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-danger/10 text-text-secondary hover:text-danger active:scale-95 cursor-pointer"
                title="Clear Board"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Board Canvas Wrapper */}
        <div className="bg-gray-200 p-6 flex justify-center items-center">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStartDraw}
            onMouseMove={handleDraw}
            onMouseUp={handleEndDraw}
            className="border border-gray-300 rounded-xl shadow-inner bg-white cursor-crosshair max-w-full"
          />
        </div>
      </div>
    </div>
  );
}
