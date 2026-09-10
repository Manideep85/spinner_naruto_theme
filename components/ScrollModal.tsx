"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Prize } from "@/lib/prizes";
import { narutoAudio } from "@/lib/audio";
import { generateWhatsAppLink } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, Scroll, X, MessageCircle } from "lucide-react";

interface ScrollModalProps {
  isOpen: boolean;
  prize: Prize | null;
  tokenCode: string;
  claimedAt?: string;
  phone?: string;
  customerName?: string;
  onClose: () => void;
}

export const ScrollModal: React.FC<ScrollModalProps> = ({
  isOpen,
  prize,
  tokenCode,
  claimedAt,
  phone,
  customerName,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && prize) {
      narutoAudio.playVictory();
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#FF6B00", "#00F0FF", "#FFD700", "#E60000"],
        });
      } catch {}
    }
  }, [isOpen, prize]);

  if (!isOpen || !prize) return null;

  const rarityColorClass = {
    Common: "bg-gray-800 text-gray-200 border-gray-600",
    Rare: "bg-blue-900/80 text-blue-200 border-blue-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]",
    Epic: "bg-purple-900/80 text-purple-200 border-purple-400 shadow-[0_0_20px_rgba(153,0,255,0.4)]",
    Legendary: "bg-amber-900/80 text-amber-200 border-amber-400 shadow-[0_0_25px_rgba(255,215,0,0.6)] animate-pulse",
  }[prize.rarity];

  const waLink = phone ? generateWhatsAppLink(phone, prize.name, customerName) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FBEFD5] border-8 border-[#B88A44] rounded-2xl shadow-[0_0_50px_rgba(255,107,0,0.5)] overflow-hidden text-[#3A2818] transform animate-scroll-unroll">
        <div className="h-4 bg-[#6E4718] border-b-2 border-[#3A2818] w-full flex items-center justify-center">
          <div className="w-16 h-2 bg-[#FFD700] rounded-full"></div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-4 text-[#3A2818] hover:text-konoha-orange p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Scroll className="w-6 h-6 text-konoha-darkOrange" />
            <span className="font-bold text-xs uppercase tracking-widest text-[#6E4718] font-mono">
              KONOHA SECRET SCROLL UNSEALED
            </span>
            <Scroll className="w-6 h-6 text-konoha-darkOrange" />
          </div>

          <div className="text-5xl my-2 animate-bounce">{prize.icon}</div>

          <div>
            <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${rarityColorClass}`}>
              {prize.rarity} • {prize.badge}
            </span>
          </div>

          <h2 className="text-2xl font-black text-konoha-darkOrange tracking-tight leading-tight">
            {prize.name}
          </h2>

          <p className="text-sm font-medium text-[#4A3828] bg-[#FAF3E0] p-3 rounded-lg border border-[#D9C095]">
            {prize.description}
          </p>

          <div className="bg-[#EFE2C6] p-3 rounded-lg border border-[#CBB080] text-left text-xs font-mono space-y-1">
            <div className="flex items-center gap-1 font-bold text-green-800">
              <ShieldCheck className="w-4 h-4 text-green-700" />
              <span>SINGLE-USE ACCESS VERIFIED</span>
            </div>
            <div className="flex justify-between text-[#5C452C] pt-1">
              <span>Token Code:</span>
              <span className="font-bold text-[#2A1808]">{tokenCode}</span>
            </div>
            {claimedAt && (
              <div className="flex justify-between text-[#5C452C]">
                <span>Unsealed At:</span>
                <span className="font-bold text-[#2A1808]">
                  {new Date(claimedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-green-600 hover:bg-green-500 shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp Thank You Message</span>
            </a>
          )}

          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-konoha-orange to-konoha-red hover:from-konoha-orangeLight hover:to-konoha-orange shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>CLAIM REWARD & CLOSE</span>
            </button>
          </div>
        </div>

        <div className="h-4 bg-[#6E4718] border-t-2 border-[#3A2818] w-full flex items-center justify-center">
          <div className="w-16 h-2 bg-[#FFD700] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
