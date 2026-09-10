"use client";

import React, { useEffect } from "react";
import { Lock, ShieldAlert, CheckSquare, Clock } from "lucide-react";
import { Prize } from "@/lib/prizes";
import { narutoAudio } from "@/lib/audio";

interface AlreadyClaimedCardProps {
  tokenCode?: string;
  claimedAt?: string;
  prizeWon?: Prize | null;
}

export const AlreadyClaimedCard: React.FC<AlreadyClaimedCardProps> = ({
  claimedAt,
  prizeWon,
}) => {
  useEffect(() => {
    narutoAudio.playWarningGong();
  }, []);

  return (
    <div className="w-full max-w-md bg-konoha-cardBg border-2 border-konoha-red/60 rounded-2xl shadow-[0_0_30px_rgba(230,0,0,0.3)] overflow-hidden text-gray-100 p-6 space-y-6 text-center animate-fade-in relative my-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-konoha-red to-konoha-crimson -mx-6 -mt-6 p-4 text-white flex items-center justify-center gap-2 font-black uppercase text-sm tracking-wider shadow-md">
        <ShieldAlert className="w-5 h-5 text-konoha-gold animate-bounce" />
        <span>SINGLE-USE LIMIT REACHED</span>
      </div>

      <div className="relative inline-block my-2">
        <div className="w-24 h-24 bg-red-950/60 rounded-full border-4 border-konoha-red flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-12 h-12 text-konoha-red animate-pulse" />
        </div>
        <div className="absolute -bottom-1 right-0 bg-konoha-gold text-black font-black text-xs px-2 py-0.5 rounded-full border border-black uppercase shadow">
          USED
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-extrabold text-konoha-red tracking-tight">
          Single-Spin Limit Reached!
        </h3>
        <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
          You have already completed your single-use spin. Re-spinning or unsealing again is strictly forbidden.
        </p>
      </div>

      {/* Previously Won Reward */}
      {prizeWon && (
        <div className="bg-[#1C2133] p-4 rounded-xl border border-konoha-orange/40 text-left space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-widest text-konoha-gold font-bold flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-green-400" />
              YOUR RECORDED REWARD
            </span>
            <span className="text-xs font-bold text-gray-400">{prizeWon.character || prizeWon.badge}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl">{prizeWon.icon}</span>
            <div>
              <div className="font-extrabold text-base text-konoha-orange">
                {prizeWon.name}
              </div>
              <div className="text-xs text-gray-400 line-clamp-1">
                {prizeWon.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {claimedAt && (
        <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-left text-xs font-mono text-gray-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-konoha-cyan" /> Claimed:
          </span>
          <span className="text-gray-200">
            {new Date(claimedAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
