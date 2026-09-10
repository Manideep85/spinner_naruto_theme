"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { TokenRecord, SpinLog, CustomerRegistration } from "@/lib/db";
import { Prize } from "@/lib/prizes";
import {
  ShieldCheck,
  QrCode,
  RotateCcw,
  Plus,
  Key,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Save,
  Users,
  MessageCircle,
  Download,
  Copy,
  Check,
  FileText,
  XCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [pin, setPin] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [logs, setLogs] = useState<SpinLog[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [registrations, setRegistrations] = useState<CustomerRegistration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  const [masterQrDataUrl, setMasterQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [activeTab, setActiveTab] = useState<"master_qr" | "probabilities" | "registrations" | "tokens" | "logs">("master_qr");

  const fetchAdminData = (adminPin: string) => {
    setIsLoading(true);
    fetch(`/api/tokens?pin=${encodeURIComponent(adminPin)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.success) {
          setIsAuthenticated(true);
          setTokens(data.tokens);
          setLogs(data.logs);
          setPrizes(data.prizes);
          setRegistrations(data.registrations || []);
          setAuthError("");
        } else {
          setIsAuthenticated(false);
          setAuthError(data.error || "Incorrect Admin PIN.");
        }
      })
      .catch(() => {
        setIsLoading(false);
        setAuthError("Failed to fetch admin data.");
      });
  };

  const handleDeleteRegistration = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to DELETE customer registration for "${name}"?\nThis will also unlock their phone number for respinning!`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_registration",
          pin,
          id,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setRegistrations(data.registrations || []);
        setSaveSuccessMsg(`Deleted registration for ${name} successfully!`);
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to delete registration.");
      }
    } catch {
      setIsLoading(false);
      alert("Error connecting to server.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      QRCode.toDataURL(baseUrl, {
        width: 340,
        margin: 2,
        color: { dark: "#0B0D14", light: "#FFFFFF" },
      })
        .then((url) => setMasterQrDataUrl(url))
        .catch(() => {});
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData(pin);
  };

  const handlePrizeWeightChange = (id: string, newWeight: number) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, weight: Math.max(0, newWeight) } : p))
    );
  };

  const handleSavePrizes = async () => {
    setIsLoading(true);
    setSaveSuccessMsg("");

    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_prizes",
        pin,
        prizes,
      }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (data.success) {
      setSaveSuccessMsg("Probability settings saved to server database successfully!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    }
  };

  const handleResetToken = async (code: string) => {
    if (!confirm(`Reset token ${code} back to UNUSED?`)) return;

    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset_token",
        pin,
        code,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchAdminData(pin);
    }
  };

  const exportRegistrationsCsv = () => {
    const headers = [
      "Customer Name",
      "Phone Number",
      "Prize Won",
      "Discount / Offer Received",
      "Token Code",
      "Registration Date & Time",
      "Claim Status",
    ];

    const rows = registrations.map((r) => {
      let discountDetails = r.prize_won || "None";
      if (r.prize_won) {
        if (r.prize_won.includes("5%")) discountDetails = "5% OFF Discount";
        else if (r.prize_won.includes("10%")) discountDetails = "10% OFF Discount";
        else if (r.prize_won.includes("20")) discountDetails = "₹20 OFF Flat Discount";
        else if (r.prize_won.includes("MAGNETS")) discountDetails = "2 Magnets for ₹300 Special Deal";
        else if (r.prize_won.includes("RAMEN")) discountDetails = "Friend Pays for Ramen";
        else if (r.prize_won.includes("RE-SPIN")) discountDetails = "Bonus Re-Spin Chakra";
        else if (r.prize_won.includes("FREE")) discountDetails = "Free Photo Magnet";
        else if (r.prize_won.includes("BETTER")) discountDetails = "No Discount (Better Luck Next Time)";
      }

      const status = r.prize_won ? "SPUN & CLAIMED" : "REGISTERED (NOT SPUN)";

      return [
        `"${r.name || "Shinobi Customer"}"`,
        `"${r.phone}"`,
        `"${r.prize_won || "—"}"`,
        `"${discountDetails}"`,
        `"${r.token_code}"`,
        `"${new Date(r.registered_at).toLocaleString()}"`,
        `"${status}"`,
      ];
    });

    const csvString = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Naruto_Spin_Customer_Rewards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-konoha-cardBg border border-konoha-gold/40 rounded-2xl p-6 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-konoha-orange/20 border border-konoha-orange rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white">Shinobi Admin Access</h1>
            <p className="text-xs text-gray-400 mt-1">
              Enter Admin PIN to access Master QR Code, Odds Editor, and Customer DB.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
              <input
                type="password"
                placeholder="Enter PIN (Default: 1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-black/60 border border-gray-700 focus:border-konoha-gold rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 bg-red-950/60 p-2 rounded border border-red-800">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-konoha-orange to-konoha-gold hover:from-konoha-orangeLight hover:to-konoha-gold text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              UNLOCK ADMIN PANEL
            </button>
          </form>

          <button
            onClick={() => router.push("/")}
            className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Spin Wheel
          </button>
        </div>
      </div>
    );
  }

  const totalWeightSum = prizes.reduce((sum, p) => sum + p.weight, 0);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>HOKAGE ADMIN DASHBOARD</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-konoha-gold/20 text-konoha-gold border border-konoha-gold/40">
                SECURE
              </span>
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              Master Event QR • Probability Odds Editor • Customer Phone Database
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAdminData(pin)}
          className="py-2 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-mono text-konoha-cyan flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-800 space-x-2 overflow-x-auto pb-1">
        {[
          { id: "master_qr", label: "Master Event QR", icon: QrCode },
          { id: "probabilities", label: "Probability Settings", icon: Sliders },
          { id: "registrations", label: `Customer DB (${registrations.length})`, icon: Users },
          { id: "tokens", label: `Spin Tokens (${tokens.length})`, icon: ShieldCheck },
          { id: "logs", label: `Audit Log (${logs.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-konoha-cardBg text-konoha-gold border-t-2 border-x border-konoha-gold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Master Event QR Display */}
      {activeTab === "master_qr" && (
        <div className="bg-konoha-cardBg border border-konoha-gold/40 rounded-2xl p-6 shadow-2xl space-y-6 text-center max-w-lg mx-auto">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-konoha-gold uppercase tracking-wider flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-konoha-orange" />
              <span>Master Event QR Code</span>
            </h2>
            <p className="text-xs text-gray-400">
              Display or print this QR Code at your shop/booth counter. Users scan this QR code on their phone, fill in their Name & Phone number, spin the wheel, get their prize, and receive an automated WhatsApp thank you message!
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border-4 border-konoha-orange inline-block shadow-2xl">
            {masterQrDataUrl ? (
              <img src={masterQrDataUrl} alt="Master QR Code" className="w-64 h-64 mx-auto rounded" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-gray-500 font-mono text-xs">
                Generating Master QR...
              </div>
            )}
          </div>

          <div className="bg-black/60 p-3 rounded-xl border border-gray-800 text-xs font-mono text-gray-300 flex items-center justify-between gap-2">
            <span className="truncate">{baseUrl}</span>
            <button
              onClick={handleCopyLink}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-konoha-cyan flex-shrink-0 flex items-center gap-1 text-xs"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy URL"}</span>
            </button>
          </div>

          {masterQrDataUrl && (
            <a
              href={masterQrDataUrl}
              download="master-event-qr-code.png"
              className="w-full py-3 bg-gradient-to-r from-konoha-orange to-konoha-gold hover:from-konoha-orangeLight hover:to-konoha-gold text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Master QR Image (PNG)</span>
            </a>
          )}
        </div>
      )}

      {/* Tab 2: Backend Section Probabilities */}
      {activeTab === "probabilities" && (
        <div className="bg-konoha-cardBg border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-konoha-orange" />
                <span>Backend Section Probabilities (Odds Editor)</span>
              </h2>
              <p className="text-xs text-gray-400">
                Adjust section weights below. All changes are saved strictly to the server backend.
              </p>
            </div>

            <button
              onClick={handleSavePrizes}
              className="py-2 px-5 bg-gradient-to-r from-konoha-orange to-konoha-gold hover:from-konoha-orangeLight hover:to-konoha-gold text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save to Server</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-green-950 border border-green-800 text-green-300 text-xs font-mono rounded-xl text-center">
              ✅ {saveSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prizes.map((p) => {
              const probabilityPercent =
                totalWeightSum > 0 ? ((p.weight / totalWeightSum) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-black/50 border border-gray-800 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <div className="font-extrabold text-sm text-white">{p.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{p.badge}</div>
                      </div>
                    </div>

                    <span className="text-xs font-black px-2 py-0.5 rounded bg-konoha-gold/20 text-konoha-gold border border-konoha-gold/40">
                      {probabilityPercent}% Odds
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                      <span>Weight Factor:</span>
                      <span className="font-bold text-white">{p.weight}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={p.weight}
                      onChange={(e) => handlePrizeWeightChange(p.id, Number(e.target.value))}
                      className="w-full accent-konoha-orange cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Customer Database & CSV Export */}
      {activeTab === "registrations" && (
        <div className="bg-konoha-cardBg border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-konoha-cyan" />
                Customer Phone Database ({registrations.length})
              </h2>
              <p className="text-xs text-gray-400">
                Registered customer phone numbers & automated WhatsApp thank you logs. Sorted by latest registration time.
              </p>
            </div>
            {registrations.length > 0 && (
              <button
                onClick={exportRegistrationsCsv}
                className="py-2 px-4 bg-gradient-to-r from-konoha-orange to-konoha-gold hover:from-konoha-orangeLight hover:to-konoha-gold text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Export to Excel (.csv)</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Prize Won</th>
                  <th className="p-3">Discount / Offer</th>
                  <th className="p-3">Registration Time (DESC)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {(() => {
                  const sortedRegs = [...registrations].sort(
                    (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
                  );
                  const total = sortedRegs.length;
                  const totalPages = Math.ceil(total / pageSize) || 1;
                  const validPage = Math.min(currentPage, totalPages);
                  const paginated = sortedRegs.slice((validPage - 1) * pageSize, validPage * pageSize);

                  if (paginated.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-gray-500 font-sans text-xs">
                          No customer registrations recorded yet.
                        </td>
                      </tr>
                    );
                  }

                  return paginated.map((r) => {
                    let discountText = r.prize_won || "None";
                    if (r.prize_won) {
                      if (r.prize_won.includes("5%")) discountText = "5% OFF";
                      else if (r.prize_won.includes("10%")) discountText = "10% OFF";
                      else if (r.prize_won.includes("20")) discountText = "₹20 OFF";
                      else if (r.prize_won.includes("MAGNETS")) discountText = "2 Magnets for ₹300";
                      else if (r.prize_won.includes("RAMEN")) discountText = "Ramen Deal";
                      else if (r.prize_won.includes("RE-SPIN")) discountText = "Bonus Re-Spin";
                      else if (r.prize_won.includes("FREE")) discountText = "Free Magnet";
                      else if (r.prize_won.includes("BETTER")) discountText = "Better Luck Next Time";
                    }

                    return (
                      <tr key={r.id} className="hover:bg-gray-900/40">
                        <td className="p-3 font-bold text-white">{r.name || "Shinobi Customer"}</td>
                        <td className="p-3 text-konoha-cyan font-bold">{r.phone}</td>
                        <td className="p-3 text-konoha-gold font-bold">{r.prize_won || "—"}</td>
                        <td className="p-3 text-green-400 font-bold">{discountText}</td>
                        <td className="p-3 text-gray-400">
                          {new Date(r.registered_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {r.prize_won ? (
                            <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-green-950 text-green-400 border border-green-800 rounded text-[10px]">
                              CLAIMED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-yellow-950 text-yellow-400 border border-yellow-800 rounded text-[10px]">
                              REGISTERED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteRegistration(r.id, r.name || r.phone)}
                            className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 rounded-lg transition-all"
                            title="Delete Registration Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {registrations.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800 text-xs font-mono text-gray-400">
              <div className="flex items-center gap-2">
                <span>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, registrations.length)} to{" "}
                  {Math.min(currentPage * pageSize, registrations.length)} of {registrations.length} entries
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-black/60 border border-gray-800 text-white rounded px-2 py-1 focus:outline-none"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 font-bold text-konoha-gold bg-black/40 rounded-lg border border-gray-800">
                  Page {currentPage} of {Math.ceil(registrations.length / pageSize) || 1}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(registrations.length / pageSize)}
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(registrations.length / pageSize), p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Spin Tokens */}
      {activeTab === "tokens" && (
        <div className="bg-konoha-cardBg border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-300">
              Active Single-Use Tokens
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              Unused: {tokens.filter((t) => !t.is_used).length} / Claimed: {tokens.filter((t) => t.is_used).length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3">Ticket Code</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Prize Won</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {tokens.map((t) => (
                  <tr key={t.code} className="hover:bg-gray-900/40">
                    <td className="p-3 font-bold text-white">{t.code}</td>
                    <td className="p-3 font-bold text-gray-200">{t.customer_name || "—"}</td>
                    <td className="p-3 text-konoha-cyan font-bold">{t.phone || "—"}</td>
                    <td className="p-3">
                      {t.is_used ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-800">
                          <XCircle className="w-3 h-3" /> USED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-green-950 text-green-400 border border-green-800">
                          <CheckCircle2 className="w-3 h-3" /> READY
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-konoha-orange font-bold">
                      {t.prize_won ? `${t.prize_won.icon} ${t.prize_won.name}` : "—"}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {t.is_used && (
                        <button
                          onClick={() => handleResetToken(t.code)}
                          className="py-1 px-2.5 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded border border-gray-700"
                          title="Reset to Unused"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Log */}
      {activeTab === "logs" && (
        <div className="bg-konoha-cardBg border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-300">
            Real-Time Audit Log Trail
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Token</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Prize / Result</th>
                  <th className="p-3">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-900/40">
                    <td className="p-3 text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-white">{log.token}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          log.action === "SPUN"
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : log.action === "REJECTED_ALREADY_CLAIMED"
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-gray-900 text-gray-400"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-konoha-gold font-bold">{log.prize_won || "—"}</td>
                    <td className="p-3 text-konoha-cyan font-bold">{log.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
