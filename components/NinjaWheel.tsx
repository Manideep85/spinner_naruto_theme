"use client";

import React, { useEffect, useRef, useState } from "react";
import { Prize } from "@/lib/prizes";
import { narutoAudio } from "@/lib/audio";

interface NinjaWheelProps {
  prizes: Prize[];
  targetSliceIndex: number | null;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinComplete: () => void;
  disabled?: boolean;
}

export const NinjaWheel: React.FC<NinjaWheelProps> = ({
  prizes,
  targetSliceIndex,
  isSpinning,
  onSpinStart,
  onSpinComplete,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef<number>(-1);
  const [sharinganAngle, setSharinganAngle] = useState<number>(0);

  const numSlices = prizes.length;
  const sliceAngle = (Math.PI * 2) / numSlices;

  // Sharingan idle rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSharinganAngle((prev) => (prev + 2) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Main canvas render loop
  const drawWheel = (angleOffset: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Outer Chakra Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, Math.PI * 2);
    ctx.fillStyle = "#141724";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#FF6B00";
    ctx.shadowColor = "#FF6B00";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    // 2. Draw Wheel Slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angleOffset);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const prize = prizes[i];

      // Slice sector
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = prize.color;
      ctx.fill();

      // Slice border line (Gold scroll pattern)
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#B88A44";
      ctx.stroke();

      // Draw Slice Text & Icon
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      // Icon & Text placement
      ctx.textAlign = "right";
      ctx.fillStyle = prize.textColor;
      ctx.font = "bold 15px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;

      // Draw Emoji/Icon
      ctx.font = "22px sans-serif";
      ctx.fillText(prize.icon, radius - 20, 7);

      // Draw Label
      ctx.font = "bold 11px sans-serif";
      const nameStr = prize.name;
      ctx.fillText(nameStr, radius - 52, 4);

      ctx.restore();
    }
    ctx.restore();

    // 3. Draw Gold Outer Rim Details
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFD700";
    ctx.stroke();
    ctx.restore();

    // 4. Draw Center Sharingan Hub
    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = "#E60000";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FFD700";
    ctx.stroke();

    ctx.rotate((sharinganAngle * Math.PI) / 180);

    for (let t = 0; t < 3; t++) {
      ctx.save();
      ctx.rotate((t * Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(0, -18, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#0B0D14";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(2, -16, 4, 0, Math.PI);
      ctx.fillStyle = "#0B0D14";
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0D14";
    ctx.fill();

    ctx.restore();

    // 5. Top Konoha Pointer (pointing down at top 270 degrees)
    ctx.save();
    ctx.translate(centerX, centerY - radius - 8);
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(16, -20);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#CC5500";
    ctx.shadowColor = "#FF6B00";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [prizes, sharinganAngle]);

  // Handle Wheel Spin Animation when targetSliceIndex is provided
  useEffect(() => {
    if (!isSpinning || targetSliceIndex === null) return;

    narutoAudio.playSpinStart();

    const startAngle = currentAngleRef.current;
    
    // Mathematical alignment for top pointer (270 deg / 1.5 * PI)
    const targetSliceCenter = targetSliceIndex * sliceAngle + sliceAngle / 2;
    const pointerAngle = (3 * Math.PI) / 2;

    const desiredFinalMod = (pointerAngle - targetSliceCenter) % (2 * Math.PI);
    const positiveMod = desiredFinalMod < 0 ? desiredFinalMod + 2 * Math.PI : desiredFinalMod;
    const currentMod = startAngle % (2 * Math.PI);

    let deltaAngle = positiveMod - currentMod;
    if (deltaAngle <= 0) {
      deltaAngle += 2 * Math.PI;
    }

    // 5 Full Rotations + Exact Slice Offset
    const finalAngle = startAngle + 5 * (2 * Math.PI) + deltaAngle;

    const startTime = performance.now();
    const duration = 5000;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease Out Cubic for realistic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (finalAngle - startAngle) * easeOut;

      currentAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      // Audio tick check
      const normalizedAngle = (pointerAngle - currentAngle) % (Math.PI * 2);
      const positiveAngle = normalizedAngle < 0 ? normalizedAngle + Math.PI * 2 : normalizedAngle;
      const currentSliceUnderPointer = Math.floor(positiveAngle / sliceAngle);

      if (currentSliceUnderPointer !== lastTickSliceRef.current) {
        lastTickSliceRef.current = currentSliceUnderPointer;
        narutoAudio.playTick(1.0 - progress * 0.4);
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animateSpin);
      } else {
        onSpinComplete();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animateSpin);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isSpinning, targetSliceIndex]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="w-[310px] h-[310px] sm:w-[360px] sm:h-[360px] drop-shadow-[0_0_25px_rgba(255,107,0,0.4)]"
        />

        <button
          onClick={() => {
            if (!isSpinning && !disabled) {
              onSpinStart();
            }
          }}
          disabled={isSpinning || disabled}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full font-black text-xs uppercase tracking-wider shadow-2xl transition-all duration-300 flex flex-col items-center justify-center z-10 border-2 ${
            isSpinning || disabled
              ? "bg-gray-800 text-gray-400 border-gray-600 cursor-not-allowed opacity-80"
              : "bg-gradient-to-br from-konoha-orange to-konoha-red text-white border-konoha-gold hover:scale-110 active:scale-95 animate-pulse-flame shadow-[0_0_30px_rgba(255,107,0,0.8)]"
          }`}
        >
          <span className="text-base">🌀</span>
          <span>{isSpinning ? "JUTSU..." : "SPIN!"}</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-konoha-cyan flex items-center gap-1 font-mono tracking-wide">
        <span className="animate-pulse">✦</span>
        <span>SHINOBI CHAKRA WHEEL • SECURE SERVER PROBABILITY</span>
        <span className="animate-pulse">✦</span>
      </div>
    </div>
  );
};
