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
  const [pulseGlow, setPulseGlow] = useState<number>(0);

  const numSlices = prizes.length;
  const sliceAngle = (Math.PI * 2) / numSlices;

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseGlow((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Helper to draw character clan watermarks in slice background
  const drawClanWatermark = (
    ctx: CanvasRenderingContext2D,
    characterName: string,
    radius: number
  ) => {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 2;

    const lower = characterName.toLowerCase();

    if (lower.includes("sakura")) {
      // Sakura Blossom Petal
      ctx.beginPath();
      ctx.arc(radius * 0.65, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (lower.includes("jiraiya")) {
      // Toad Sage "油" (Oil) Kanji
      ctx.font = "bold 26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("油", radius * 0.65, 0);
    } else if (lower.includes("gaara")) {
      // Love "愛" Kanji
      ctx.font = "bold 26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("愛", radius * 0.65, 0);
    } else if (lower.includes("pain")) {
      // Rinnegan Concentric Circles
      ctx.beginPath();
      ctx.arc(radius * 0.65, 0, 22, 0, Math.PI * 2);
      ctx.arc(radius * 0.65, 0, 14, 0, Math.PI * 2);
      ctx.arc(radius * 0.65, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (lower.includes("lee")) {
      // Eight Gates Lotus Flame
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("蓮", radius * 0.65, 0);
    } else if (lower.includes("sasuke")) {
      // Uchiha Crest Fan
      ctx.beginPath();
      ctx.arc(radius * 0.65, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(radius * 0.65, -16);
      ctx.lineTo(radius * 0.65, 16);
      ctx.stroke();
    } else if (lower.includes("itachi")) {
      // Sharingan Tomoe Circle
      ctx.beginPath();
      ctx.arc(radius * 0.65, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Naruto Konoha Leaf Spiral
      ctx.beginPath();
      ctx.arc(radius * 0.65, 0, 18, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawWheel = (angleOffset: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 8;
    const innerWheelRadius = outerRadius - 18;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Outer Dark Frame with Red Akatsuki Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0D14";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#FF6B00";
    ctx.shadowColor = `rgba(255, 107, 0, ${0.4 + Math.sin((pulseGlow * Math.PI) / 180) * 0.2})`;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    // 2. Draw Wheel Slices with Character Colors & Emblems
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angleOffset);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const prize = prizes[i];

      // Slice sector fill
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, innerWheelRadius, startAngle, endAngle);
      ctx.closePath();

      // Multi-stop radial gradient matching reference image
      const grad = ctx.createRadialGradient(0, 0, 15, 0, 0, innerWheelRadius);
      grad.addColorStop(0, "#121520");
      grad.addColorStop(0.45, prize.color);
      grad.addColorStop(1, "#07090E");
      ctx.fillStyle = grad;
      ctx.fill();

      // Gold Scroll Divider Line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#FFD700";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Draw Clan Watermark
      const charNameStr = prize.character || prize.name;
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      drawClanWatermark(ctx, charNameStr, innerWheelRadius);
      ctx.restore();

      // Draw Character Avatar Icon & Bold Anime Typography
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Character Avatar Badge Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(innerWheelRadius - 22, 0, 15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#FFD700";
      ctx.stroke();

      // Avatar Emoji Icon
      ctx.font = "18px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 6;
      ctx.fillText(prize.icon, innerWheelRadius - 13, 1);
      ctx.restore();

      // Character Name in Bold Anime Typography
      const firstName = (prize.character || prize.name)
        .split(" ")[0]
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase();

      ctx.font = "900 13px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(firstName, innerWheelRadius - 44, -5);

      // Prize Short Subtext
      let subtext = prize.name.split(" ")[0];
      if (prize.name.includes("%")) {
        subtext = prize.name.match(/\d+%/)?.[0] || subtext;
      } else if (prize.name.includes("₹")) {
        subtext = prize.name.match(/₹\d+/)?.[0] || subtext;
      } else if (prize.name.includes("MAGNETS")) {
        subtext = "2 MAGNETS";
      } else if (prize.name.includes("BETTER")) {
        subtext = "NEXT TIME 🍃";
      } else if (prize.name.includes("RAMEN")) {
        subtext = "RAMEN 🍜";
      } else if (prize.name.includes("RE-SPIN")) {
        subtext = "RE-SPIN 🌀";
      } else if (prize.name.includes("FREE")) {
        subtext = "FREE MAGNET";
      }

      ctx.font = "800 9px sans-serif";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.fillText(subtext, innerWheelRadius - 44, 9);

      ctx.restore();
    }
    ctx.restore();

    // 3. Draw Outer Golden Ring Frame with Metallic Rivets
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerWheelRadius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFD700";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - 3, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#B88A44";
    ctx.stroke();

    // Draw 16 Metallic Rivets/Bolts on Golden Outer Rim
    const rivetCount = 16;
    const rivetRadius = (innerWheelRadius + outerRadius - 3) / 2;
    for (let r = 0; r < rivetCount; r++) {
      const rAngle = (r * Math.PI * 2) / rivetCount;
      const rx = centerX + Math.cos(rAngle) * rivetRadius;
      const ry = centerY + Math.sin(rAngle) * rivetRadius;

      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#3A2818";
      ctx.stroke();
    }
    ctx.restore();

    // 4. Center Red SPIN! Button Frame & Ring
    ctx.save();
    ctx.translate(centerX, centerY);

    // Center Gold Outer Ring
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0D14";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFD700";
    ctx.shadowColor = "#FF6B00";
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Inner Red Glossy Circle
    const redGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, 36);
    redGrad.addColorStop(0, "#FF3333");
    redGrad.addColorStop(0.7, "#CC0000");
    redGrad.addColorStop(1, "#660000");

    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = redGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FFAA00";
    ctx.stroke();

    // Konoha Leaf Symbol in Center Button
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 1.5);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // Text "SPIN!"
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 6;
    ctx.fillText(isSpinning ? "SPINNING" : "SPIN!", 0, 9);

    ctx.restore();

    // 5. Top Golden Pointer Arrow
    ctx.save();
    ctx.translate(centerX, centerY - outerRadius - 4);
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.lineTo(18, -20);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#B88A44";
    ctx.shadowColor = "#FF6B00";
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Pointer Inner Highlight
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(10, -16);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fillStyle = "#FFF099";
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [prizes, pulseGlow, isSpinning]);

  useEffect(() => {
    if (!isSpinning || targetSliceIndex === null) return;

    narutoAudio.initCtx();
    narutoAudio.playSpinStart();

    const startAngle = currentAngleRef.current;

    const targetSliceCenter = targetSliceIndex * sliceAngle + sliceAngle / 2;
    const pointerAngle = (3 * Math.PI) / 2;

    const desiredFinalMod = (pointerAngle - targetSliceCenter) % (2 * Math.PI);
    const positiveMod = desiredFinalMod < 0 ? desiredFinalMod + 2 * Math.PI : desiredFinalMod;
    const currentMod = startAngle % (2 * Math.PI);

    let deltaAngle = positiveMod - currentMod;
    if (deltaAngle <= 0) {
      deltaAngle += 2 * Math.PI;
    }

    const finalAngle = startAngle + 5 * (2 * Math.PI) + deltaAngle;

    const startTime = performance.now();
    const duration = 5000;

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (finalAngle - startAngle) * easeOut;

      currentAngleRef.current = currentAngle;
      drawWheel(currentAngle);

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

  const handleButtonClick = () => {
    narutoAudio.initCtx();
    if (!isSpinning && !disabled) {
      onSpinStart();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] drop-shadow-[0_0_35px_rgba(255,107,0,0.6)]"
        />

        <button
          onClick={handleButtonClick}
          disabled={isSpinning || disabled}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full font-black text-xs uppercase tracking-wider shadow-2xl transition-all duration-300 flex flex-col items-center justify-center z-10 opacity-0 ${
            isSpinning || disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"
          }`}
          title="Click to Spin the Wheel"
        >
          <span>SPIN</span>
        </button>
      </div>
    </div>
  );
};

