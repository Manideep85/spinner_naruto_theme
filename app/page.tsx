"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NinjaWheel } from "@/components/NinjaWheel";
import { ScrollModal } from "@/components/ScrollModal";
import { AlreadyClaimedCard } from "@/components/AlreadyClaimedCard";
import { Prize, INITIAL_PRIZES } from "@/lib/prizes";
import { narutoAudio } from "@/lib/audio";
import {
  Volume2,
  VolumeX,
  Flame,
  User,
  Phone,
  Settings,
} from "lucide-react";

function SpinnerPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenParam = searchParams.get("token") || "";

  const [activeToken, setActiveToken] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [isUsed, setIsUsed] = useState<boolean>(false);
  const [claimedAt, setClaimedAt] = useState<string | undefined>(undefined);
  const [prizeWon, setPrizeWon] = useState<Prize | null>(null);

  const [prizesList, setPrizesList] = useState<Prize[]>(INITIAL_PRIZES);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [targetSliceIndex, setTargetSliceIndex] = useState<number | null>(null);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Restore active token from URL or localStorage
  useEffect(() => {
    let token = tokenParam;
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("current_ninja_token") || "";
    }

    if (token) {
      setActiveToken(token);
    } else {
      setIsLoading(false);
    }
  }, [tokenParam]);

  // Fetch prizes & verify token status
  // Fetch prizes & verify token status
  useEffect(() => {
    if (!activeToken || activeToken === "CLAIMED_LOCKED") return;

    setIsLoading(true);
    setErrorMessage("");

    fetch(`/api/verify?token=${encodeURIComponent(activeToken)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.prizes) {
          setPrizesList(data.prizes);
        }
        if (data.valid) {
          setTokenValid(true);

          let localClaimed = false;
          let savedPrize: Prize | null = null;
          if (typeof window !== "undefined") {
            const localData = localStorage.getItem(`ninja_claimed_${activeToken}`);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                localClaimed = true;
                savedPrize = parsed.prize;
              } catch {}
            }
          }

          const claimedState = data.is_used || localClaimed;
          let finalPrize = data.prize_won || savedPrize;

          if (typeof finalPrize === "string") {
            const matched = INITIAL_PRIZES.find(
              (p) => p.name === finalPrize || p.id === finalPrize || p.character.includes(finalPrize as string)
            );
            finalPrize = matched || null;
          }

          const isBonusRespin = finalPrize?.id === "re-spin-chakra";

          if (claimedState && !isBonusRespin) {
            setIsUsed(true);
            setPrizeWon(finalPrize);
            setClaimedAt(data.claimed_at || new Date().toISOString());
          } else {
            setIsUsed(false);
          }
        } else {
          setTokenValid(false);
          setErrorMessage(data.error || "Invalid Spin Access.");
        }
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMessage("Network error connecting to server.");
      });
  }, [activeToken]);

  // Handle Form Registration with Phone Lock Check
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    narutoAudio.initCtx();

    if (!userName.trim() || !userPhone.trim()) {
      setErrorMessage("Please enter both your Name and Phone Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName.trim(),
          phone: userPhone.trim(),
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        // Strict Phone Lock Check: If phone is already registered and used
        if (data.is_used) {
          let matchedPrize: Prize | null = null;
          if (data.prize_won) {
            if (typeof data.prize_won === "string") {
              matchedPrize =
                INITIAL_PRIZES.find(
                  (p) => p.name === data.prize_won || p.id === data.prize_won || p.character.includes(data.prize_won as string)
                ) || null;
            } else {
              matchedPrize = data.prize_won;
            }
          }

          setIsUsed(true);
          setPrizeWon(matchedPrize);
          setClaimedAt(data.claimed_at || new Date().toISOString());
          setTokenValid(true);
          setActiveToken("CLAIMED_LOCKED");
          return;
        }

        setErrorMessage(data.error || "Registration failed.");
        return;
      }

      setTokenValid(true);
      setIsUsed(false);
      setActiveToken(data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("current_ninja_token", data.token);
      }
      router.push(`/?token=${data.token}`);
    } catch {
      setIsLoading(false);
      setErrorMessage("Error submitting registration.");
    }
  };

  // Handle Spin Execution
  const handleSpinStart = async () => {
    if (!activeToken || isSpinning || isUsed) return;
    narutoAudio.initCtx();

    setIsSpinning(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsSpinning(false);
        if (data.is_used) {
          setIsUsed(true);
          let matchedPrize = data.prize_won;
          if (typeof matchedPrize === "string") {
            matchedPrize = INITIAL_PRIZES.find((p) => p.name === matchedPrize || p.id === matchedPrize);
          }
          setPrizeWon(matchedPrize);
          setClaimedAt(data.claimed_at);
          if (typeof window !== "undefined") {
            localStorage.setItem(`ninja_claimed_${activeToken}`, JSON.stringify({ prize: data.prize_won }));
          }
        } else {
          setErrorMessage(data.error || "Failed to execute spin.");
        }
        return;
      }

      setTargetSliceIndex(data.sliceIndex);
      setWonPrize(data.prize);
    } catch {
      setIsSpinning(false);
      setErrorMessage("Connection error during spin.");
    }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);

    if (wonPrize) {
      setPrizeWon(wonPrize);
      setClaimedAt(new Date().toISOString());
      setShowModal(true);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          `ninja_claimed_${activeToken}`,
          JSON.stringify({ is_used: true, prize: wonPrize, claimed_at: new Date().toISOString() })
        );
      }

      if (wonPrize.id !== "re-spin-chakra") {
        setIsUsed(true);
      }
    }
  };

  const handleToggleMute = () => {
    const muted = narutoAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-6 max-w-lg mx-auto">
      {/* Header Bar (NO TOKEN CODES DISPLAYED FOR SECURITY) */}
      <header className="flex items-center justify-between py-2 border-b border-konoha-border/60">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-konoha-orange to-konoha-red flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,107,0,0.6)] animate-pulse">
            🍥
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              NARUTO <span className="text-konoha-orange">SPIN</span>
            </h1>
            <p className="text-[10px] text-konoha-cyan font-mono tracking-widest uppercase">
              Leaf Village Ninjutsu Rewards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-konoha-gold hover:border-konoha-gold transition-all"
            title="Admin Dashboard"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition-all"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-konoha-cyan" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center my-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-16 h-16 border-4 border-konoha-orange border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-konoha-cyan animate-pulse">
              Unsealing Shinobi Scroll...
            </p>
          </div>
        ) : !activeToken ? (
          /* STEP 1: Registration Form Page */
          <div className="w-full bg-konoha-cardBg border border-konoha-border rounded-2xl p-6 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-konoha-orange/20 to-konoha-red/20 border border-konoha-orange rounded-full flex items-center justify-center mx-auto text-3xl">
              📜
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Register to Spin</h2>
              <p className="text-xs text-gray-400">
                Enter your details to unseal your single-use Naruto Spin Scroll.
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Your Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-black/60 border border-gray-700 focus:border-konoha-orange rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">WhatsApp Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-black/60 border border-gray-700 focus:border-konoha-orange rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-konoha-orange to-konoha-red hover:from-konoha-orangeLight hover:to-konoha-orange text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>UNSEAL MY SPIN SCROLL 🍥</span>
              </button>
            </form>

            <div className="text-[11px] text-gray-500 font-mono italic">
              Automated thank you message & reward details will be sent via WhatsApp upon spinning.
            </div>
          </div>
        ) : !tokenValid && !isUsed ? (
          /* Invalid Token */
          <div className="w-full bg-konoha-cardBg border border-red-900/80 rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-950 border border-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              ❌
            </div>
            <h2 className="text-lg font-black text-red-500">Invalid Spin Access</h2>
            <p className="text-xs text-gray-300 font-mono">{errorMessage}</p>
            <button
              onClick={() => {
                setActiveToken("");
                if (typeof window !== "undefined") {
                  localStorage.removeItem("current_ninja_token");
                }
                router.push("/");
              }}
              className="py-2.5 px-5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Register Again
            </button>
          </div>
        ) : isUsed ? (
          /* STRICT SINGLE-USE LOCK (On Phone Re-registration, Refresh, or Rescan) */
          <AlreadyClaimedCard
            claimedAt={claimedAt}
            prizeWon={prizeWon}
          />
        ) : (
          /* ACTIVE UNUSED TOKEN SCREEN: SHOWS ONLY THE SPIN WHEEL */
          <div className="w-full flex flex-col items-center justify-center space-y-4 my-auto">
            {errorMessage && (
              <div className="w-full bg-red-950/80 border border-red-800 text-red-200 text-xs p-3 rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            {/* ONLY THE SPIN WHEEL IS DISPLAYED HERE */}
            <NinjaWheel
              prizes={prizesList}
              targetSliceIndex={targetSliceIndex}
              isSpinning={isSpinning}
              onSpinStart={handleSpinStart}
              onSpinComplete={handleSpinComplete}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pt-2 text-center text-[11px] text-gray-500 font-mono flex items-center justify-between border-t border-gray-800/60">
        <span>Leaf Village Wheel v1.0</span>
        <span className="text-konoha-cyan font-bold">100% Open Source • Server Probability</span>
      </footer>

      {/* Prize Reveal Scroll Modal (CLEAN & ANIME CHARACTER FOCUSED) */}
      <ScrollModal
        isOpen={showModal}
        prize={prizeWon}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-konoha-orange font-mono text-xs">
          Loading Shinobi Chakra Wheel...
        </div>
      }
    >
      <SpinnerPageContent />
    </Suspense>
  );
}
