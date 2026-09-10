"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Download, ExternalLink, QrCode, Copy, Check } from "lucide-react";

interface QrModalProps {
  isOpen: boolean;
  tokenCode: string;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, tokenCode, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && tokenCode) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${baseUrl}/?token=${encodeURIComponent(tokenCode)}`;

      QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0B0D14",
          light: "#FFFFFF",
        },
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error("QR render error:", err));
    }
  }, [isOpen, tokenCode]);

  if (!isOpen || !tokenCode) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${baseUrl}/?token=${encodeURIComponent(tokenCode)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-konoha-cardBg border-2 border-konoha-gold/60 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,215,0,0.3)] text-center text-white space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-konoha-gold font-extrabold uppercase text-sm tracking-wider">
          <QrCode className="w-5 h-5" />
          <span>SHINOBI SINGLE-USE QR CODE</span>
        </div>

        <div className="bg-white p-3 rounded-xl border-4 border-konoha-orange inline-block shadow-inner">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR Code for ${tokenCode}`} className="w-56 h-56 mx-auto rounded" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-gray-500 font-mono text-xs">
              Generating Jutsu QR...
            </div>
          )}
        </div>

        <div className="bg-black/50 p-2.5 rounded-lg border border-gray-800 text-xs font-mono text-gray-300 break-all text-left flex items-center justify-between gap-2">
          <span className="truncate">{fullUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-konoha-cyan flex-shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {dataUrl && (
            <a
              href={dataUrl}
              download={`ninja-ticket-${tokenCode}.png`}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-konoha-orange hover:bg-konoha-orangeLight text-white flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </a>
          )}
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gray-800 hover:bg-gray-700 text-gray-200 flex items-center justify-center gap-1 border border-gray-700 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Link</span>
          </a>
        </div>
      </div>
    </div>
  );
};
