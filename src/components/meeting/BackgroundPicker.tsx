"use client";

import { useState } from "react";
import { Plus, Sliders, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface BackgroundPickerProps {
  bgMode: "none" | "blur-light" | "blur-heavy" | "image";
  onChangeMode: (mode: "none" | "blur-light" | "blur-heavy" | "image") => void;
  onChangeImage: (url: string) => void;
}

const PRESET_BACKGROUNDS = [
  { id: "office", name: "Modern Office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=640&q=80" },
  { id: "nature", name: "Mountain Lake", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=640&q=80" },
  { id: "abstract", name: "Neon Glow", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=640&q=80" },
  { id: "studio", name: "Minimalist Loft", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=640&q=80" },
];

/**
 * BackgroundPicker renders virtual background options: none, blurs, presets, and uploads.
 */
export function BackgroundPicker({
  bgMode,
  onChangeMode,
  onChangeImage,
}: BackgroundPickerProps) {
  const [customBgs, setCustomBgs] = useState<string[]>([]);
  const [selectedBgId, setSelectedBgId] = useState<string>("none");

  const handleModeSelect = (mode: "none" | "blur-light" | "blur-heavy") => {
    setSelectedBgId(mode);
    onChangeMode(mode);
  };

  const handlePresetSelect = (id: string, url: string) => {
    setSelectedBgId(id);
    onChangeImage(url);
    onChangeMode("image");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCustomBgs((prev) => [base64, ...prev]);
        const customId = `custom-${Date.now()}`;
        setSelectedBgId(customId);
        onChangeImage(base64);
        onChangeMode("image");
        toast.success("Background uploaded");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-bg-surface border border-border-subtle rounded-2xl w-full max-w-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Virtual Effects
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {/* Disable Backgrounds */}
        <button
          onClick={() => handleModeSelect("none")}
          className={`aspect-video rounded-xl flex flex-col items-center justify-center border cursor-pointer active:scale-95 transition-all text-xs ${
            selectedBgId === "none"
              ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
              : "bg-bg-elevated border-border-subtle hover:border-text-secondary text-text-secondary"
          }`}
        >
          <EyeOff className="w-4.5 h-4.5 mb-1" />
          <span>None</span>
        </button>

        {/* Light Blur */}
        <button
          onClick={() => handleModeSelect("blur-light")}
          className={`aspect-video rounded-xl flex flex-col items-center justify-center border cursor-pointer active:scale-95 transition-all text-xs ${
            selectedBgId === "blur-light"
              ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
              : "bg-bg-elevated border-border-subtle hover:border-text-secondary text-text-secondary"
          }`}
        >
          <Sliders className="w-4.5 h-4.5 mb-1" />
          <span>Light Blur</span>
        </button>

        {/* Heavy Blur */}
        <button
          onClick={() => handleModeSelect("blur-heavy")}
          className={`aspect-video rounded-xl flex flex-col items-center justify-center border cursor-pointer active:scale-95 transition-all text-xs ${
            selectedBgId === "blur-heavy"
              ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
              : "bg-bg-elevated border-border-subtle hover:border-text-secondary text-text-secondary"
          }`}
        >
          <Sliders className="w-4.5 h-4.5 mb-1 rotate-90" />
          <span>Heavy Blur</span>
        </button>

        {/* Preset background thumbnails */}
        {PRESET_BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => handlePresetSelect(bg.id, bg.url)}
            className={`aspect-video rounded-xl overflow-hidden border cursor-pointer active:scale-95 transition-all relative ${
              selectedBgId === bg.id ? "border-accent-primary ring-1 ring-accent-primary" : "border-border-subtle hover:border-text-secondary"
            }`}
          >
            <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 hover:bg-black/0 transition-colors" />
          </button>
        ))}

        {/* Custom Upload trigger */}
        <label
          className="aspect-video rounded-xl bg-bg-elevated border border-dashed border-border-default hover:border-text-secondary flex flex-col items-center justify-center cursor-pointer text-text-secondary hover:text-text-primary active:scale-95 transition-all text-xs"
        >
          <Plus className="w-5 h-5 mb-1" />
          <span>Upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
