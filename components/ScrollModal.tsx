"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Prize } from "@/lib/prizes";
import { narutoAudio } from "@/lib/audio";
import { CheckCircle2, Scroll, X } from "lucide-react";

interface ScrollModalProps {
  isOpen: boolean;
  prize: Prize | null;
  onClose: () => void;
}

export const ScrollModal: React.FC<ScrollModalProps> = ({
  isOpen,
  prize,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && prize) {
      narutoAudio.playVictory();
      try {
        confetti({
          particleCount: 95,
          spread: 85,
          origin: { y: 0.6 },
          colors: ["#FF6B00", "#00F0FF", "#FFD700", "#E60000", "#E91E63"],
        });
      } catch {}
    }
  }, [isOpen, prize]);

  if (!isOpen || !prize) return null;

  const getCharacterImagePath = (p: Prize): string => {
    const char = (p.character || p.name).toLowerCase();
    if (char.includes("sakura")) return "/images/characters/sakura.jpg";
    if (char.includes("jiraiya")) return "/images/characters/jiraiya.jpg";
    if (char.includes("gaara")) return "/images/characters/gaara.jpg";
    if (char.includes("pain")) return "/images/characters/pain.jpg";
    if (char.includes("lee")) return "/images/characters/rock_lee.jpg";
    if (char.includes("sasuke")) return "/images/characters/sasuke.jpg";
    if (char.includes("itachi")) return "/images/characters/itachi.jpg";
    return "/images/characters/naruto.jpg";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#FBEFD5] border-8 border-[#B88A44] rounded-2xl shadow-[0_0_50px_rgba(255,107,0,0.6)] overflow-hidden text-[#3A2818] transform animate-scroll-unroll">
        {/* Scroll Wooden Handle Top */}
        <div className="h-4 bg-[#6E4718] border-b-2 border-[#3A2818] w-full flex items-center justify-center">
          <div className="w-16 h-2 bg-[#FFD700] rounded-full"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-4 text-[#3A2818] hover:text-konoha-orange p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Scroll className="w-5 h-5 text-konoha-darkOrange" />
            <span className="font-bold text-xs uppercase tracking-widest text-[#6E4718] font-mono">
              LEAF VILLAGE REWARD
            </span>
            <Scroll className="w-5 h-5 text-konoha-darkOrange" />
          </div>

          {/* Anime Character Portrait Image */}
          <div className="flex flex-col items-center justify-center space-y-2 my-2">
            <div className="relative w-28 h-28 rounded-full border-4 border-[#B88A44] shadow-[0_0_25px_rgba(255,107,0,0.5)] overflow-hidden bg-black/40">
              <img
                src={getCharacterImagePath(prize)}
                alt={prize.character || prize.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform"
              />
            </div>
            <div className="inline-block px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-konoha-darkOrange text-white shadow-md">
              {prize.character || prize.badge}
            </div>
          </div>

          {/* Prize Name & Wording */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-konoha-darkOrange tracking-tight leading-tight">
              {prize.name}
            </h2>
            <p className="text-sm font-medium text-[#4A3828] bg-[#FAF3E0] p-3 rounded-lg border border-[#D9C095] leading-relaxed">
              {prize.description}
            </p>

            {/* Frame Applicability Note */}
            <div className="text-xs font-bold text-[#8C2C00] bg-[#FFF8E7] p-2.5 rounded-lg border border-[#E6C994] font-mono flex items-start gap-1.5 text-left shadow-sm">
              <span className="text-base leading-none">📌</span>
              <div>
                <span className="font-extrabold uppercase text-[#6E2C00] block text-[10px]">Frame Rule:</span>
                {prize.name.includes("5%") && "Applicable for all frames."}
                {prize.name.includes("10%") && "Applicable for all frames except 4x6 (big frame)."}
                {prize.name.includes("MAGNETS") && "Applicable for Square & Rectangular frames only (3x3 and 3x4)."}
                {!prize.name.includes("5%") && !prize.name.includes("10%") && !prize.name.includes("MAGNETS") && "Single-use Leaf Village reward."}
              </div>
            </div>
          </div>

          {/* Claim Reward & Close Button ONLY */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-konoha-orange to-konoha-red hover:from-konoha-orangeLight hover:to-konoha-orange shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>CLAIM REWARD & CLOSE</span>
            </button>
          </div>
        </div>

        {/* Bottom Handle */}
        <div className="h-4 bg-[#6E4718] border-t-2 border-[#3A2818] w-full flex items-center justify-center">
          <div className="w-16 h-2 bg-[#FFD700] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
