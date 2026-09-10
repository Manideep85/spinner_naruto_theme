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
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const [, setImagesLoadedState] = useState<boolean>(false);

  const numSlices = prizes.length;
  const sliceAngle = (Math.PI * 2) / numSlices;

  // Preload Character Portrait Images
  useEffect(() => {
    const charKeys = ["sakura", "jiraiya", "gaara", "pain", "rock_lee", "sasuke", "itachi", "naruto"];
    let loaded = 0;
    charKeys.forEach((key) => {
      const img = new Image();
      img.src = `/images/characters/${key}.jpg`;
      img.onload = () => {
        loaded++;
        if (loaded >= charKeys.length) {
          setImagesLoadedState(true);
        }
      };
      loadedImagesRef.current[key] = img;
    });
  }, []);

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
    const outerRadius = Math.min(centerX, centerY) - 10;
    const innerWheelRadius = outerRadius - 20;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Outer Dark Frame with Red Akatsuki Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0D14";
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#FF6B00";
    ctx.shadowColor = `rgba(255, 107, 0, ${0.5 + Math.sin((pulseGlow * Math.PI) / 180) * 0.25})`;
    ctx.shadowBlur = 25;
    ctx.stroke();
    ctx.restore();

    // 2. Draw Wheel Slices with Character Colors & Emblems
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angleOffset);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const midAngle = startAngle + sliceAngle / 2;
      const prize = prizes[i];

      const firstNameRaw = (prize.character || prize.name)
        .split(" ")[0]
        .replace(/[^a-zA-Z]/g, "");
      const firstName = firstNameRaw.toUpperCase();
      let charKey = firstNameRaw.toLowerCase();
      if (charKey === "rock") charKey = "rock_lee";

      const charImg = loadedImagesRef.current[charKey];

      // A. Clip everything in this slice sector to the wedge shape
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, innerWheelRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      // Background gradient
      const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, innerWheelRadius);
      grad.addColorStop(0, "#0F121C");
      grad.addColorStop(0.45, prize.color);
      grad.addColorStop(1, "#07080D");
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw Clan Watermark
      ctx.save();
      ctx.rotate(midAngle);
      drawClanWatermark(ctx, prize.character || prize.name, innerWheelRadius);
      ctx.restore();

      // Draw Character Medallion Badge (Positioned at inner-mid radius, 100% clean circular clip)
      if (charImg && charImg.complete && charImg.naturalWidth > 0) {
        ctx.save();
        ctx.rotate(midAngle);

        const charCenterX = innerWheelRadius * 0.38;
        const charRadius = innerWheelRadius * 0.26;

        // A. Dark shadow behind medallion
        ctx.save();
        ctx.beginPath();
        ctx.arc(charCenterX, 0, charRadius, 0, Math.PI * 2);
        ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#0B0D14";
        ctx.fill();
        ctx.restore();

        // B. Clip character image to precise circular path (removes 100% of checkerboard & square background corners)
        ctx.save();
        ctx.beginPath();
        ctx.arc(charCenterX, 0, charRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          charImg,
          charCenterX - charRadius,
          -charRadius,
          charRadius * 2,
          charRadius * 2
        );
        ctx.restore();

        // C. Golden Scroll Ring around character medallion
        ctx.beginPath();
        ctx.arc(charCenterX, 0, charRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#FFD700";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 6;
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore(); // End sector wedge clip

      // B. Gold Scroll Divider Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startAngle) * innerWheelRadius, Math.sin(startAngle) * innerWheelRadius);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#FFD700";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();

      // C. Offer Text Banner Pill Placed Right at the Outer Circle Radius (ZERO Overlap with Character Face!)
      ctx.save();
      ctx.rotate(midAngle);

      let offerText = prize.name;
      if (prize.name.includes("BETTER")) offerText = "NEXT TIME 🍃";
      else if (prize.name.includes("2 MAGNETS")) offerText = "2 MAGNETS ₹300 🧲";
      else if (prize.name.includes("RAMEN")) offerText = "RAMEN DEAL 🍜";
      else if (prize.name.includes("RE-SPIN")) offerText = "RE-SPIN CHAKRA 🌀";
      else if (prize.name.includes("FREE")) offerText = "FREE MAGNET 🍥";

      ctx.font = "900 9px system-ui, -apple-system, sans-serif";
      const textMetrics = ctx.measureText(offerText);
      const bannerWidth = Math.max(textMetrics.width + 12, innerWheelRadius * 0.28);
      const bannerHeight = 18;
      const bannerX = innerWheelRadius * 0.96 - bannerWidth;
      const bannerY = -bannerHeight / 2;

      // Outer Edge Text Pill Background
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === "function") {
        (ctx as any).roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 9);
      } else {
        ctx.rect(bannerX, bannerY, bannerWidth, bannerHeight);
      }
      ctx.fillStyle = "rgba(11, 13, 20, 0.94)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#FFD700";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Single Line Offer Text Right-Aligned to Outer Rim
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 9px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.fillText(offerText, bannerX + bannerWidth / 2, 0);

      ctx.restore();
    }
    ctx.restore();

    // 3. Draw Outer Golden Ring Frame with Metallic Rivets
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerWheelRadius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
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
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
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
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0D14";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#FFD700";
    ctx.shadowColor = "#FF6B00";
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Inner Red Glossy Circle
    const redGrad = ctx.createRadialGradient(-6, -6, 6, 0, 0, 42);
    redGrad.addColorStop(0, "#FF3333");
    redGrad.addColorStop(0.7, "#CC0000");
    redGrad.addColorStop(1, "#660000");

    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fillStyle = redGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFAA00";
    ctx.stroke();

    // Konoha Leaf Symbol in Center Button
    ctx.beginPath();
    ctx.arc(0, -12, 9, 0, Math.PI * 1.5);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // Text "SPIN!"
    ctx.font = "900 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 6;
    ctx.fillText(isSpinning ? "SPINNING" : "SPIN!", 0, 10);

    ctx.restore();

    // 5. Top Golden Pointer Arrow
    ctx.save();
    ctx.translate(centerX, centerY - outerRadius - 4);
    ctx.beginPath();
    ctx.moveTo(-20, -22);
    ctx.lineTo(20, -22);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#B88A44";
    ctx.shadowColor = "#FF6B00";
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Pointer Inner Highlight
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.lineTo(12, -18);
    ctx.lineTo(0, 11);
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
    <div className="relative flex flex-col items-center justify-center p-2 w-full">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={460}
          height={460}
          className="w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] drop-shadow-[0_0_40px_rgba(255,107,0,0.6)]"
        />

        <button
          onClick={handleButtonClick}
          disabled={isSpinning || disabled}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full font-black text-xs uppercase tracking-wider shadow-2xl transition-all duration-300 flex flex-col items-center justify-center z-10 opacity-0 ${
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

