"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  riskScore?: number;
  riskLevel?: string;
  signals?: string[];
  category?: string;
};

type BrowserLocation = { latitude: number; longitude: number } | null;

function requestLocation(): Promise<BrowserLocation> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
}

function readableCategory(category?: string) {
  return category ? category.replaceAll("_", " ") : "-";
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Kirim pesan, link, atau kronologi singkat yang membuat Anda ragu. Saya akan membantu menilai tanda risikonya dan menyarankan langkah aman berikutnya."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendLocation, setSendLocation] = useState(false);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    setError("");

    const location = sendLocation ? await requestLocation() : null;
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Asisten belum dapat memproses pesan saat ini.");
    } else {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply || "Asisten tidak mengembalikan respons teks.",
          riskScore: data.risk_score,
          riskLevel: data.risk_level,
          signals: data.signals,
          category: data.case_category
        }
      ]);
    }
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Asisten Keamanan"
        title="Tanya sebelum merespons pesan mencurigakan."
        description="Gunakan fitur ini untuk meminta bantuan memahami pesan, link, kronologi, atau permintaan yang terasa janggal. Jawaban dibuat ringkas, praktis, dan berfokus pada langkah aman yang bisa langsung dilakukan."
      />

      {error && (
        <div className="mb-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">
          <p className="font-bold text-white">Asisten belum siap</p>
          <p className="mt-2">{error}</p>
          <p className="mt-2">Coba ulangi beberapa saat lagi atau hubungi admin platform.</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.65fr]">
        <section className="glass-panel rounded-3xl p-4 sm:p-6">
          <div className="flex h-[62vh] min-h-[32rem] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-6 sm:max-w-[78%] ${
                      message.role === "user"
                        ? "bg-cyan-300 text-slate-950"
                        : "border border-white/10 bg-white/[0.045] text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.riskScore !== undefined && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-xs text-slate-200">
                        <p className="font-bold text-white">
                          Risiko: {message.riskScore}% · {message.riskLevel} · {readableCategory(message.category)}
                        </p>
                        {message.signals && message.signals.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {message.signals.map((signal) => (
                              <li key={signal}>• {signal}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-slate-300">
                    Menganalisis pesan...
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <label className="mb-3 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-300">
                <input
                  type="checkbox"
                  checked={sendLocation}
                  onChange={(event) => setSendLocation(event.target.checked)}
                  className="mt-1"
                />
                <span>Sertakan lokasi secara opsional agar rekomendasi rujukan bantuan lebih relevan.</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <textarea
                  className="input-field min-h-24 resize-none"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Tulis pesan, link, atau kronologi yang ingin dicek..."
                />
                <button onClick={sendMessage} disabled={loading} className="primary-button px-7">
                  {loading ? "Cek..." : "Kirim"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="glass-panel rounded-3xl p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Panduan Bertanya</p>
          <h2 className="mt-2 text-2xl font-black text-white">Agar jawaban lebih akurat</h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <p>Tulis isi pesan mencurigakan apa adanya. Jangan kirim OTP, password, PIN, nomor kartu, atau data pribadi sensitif.</p>
            <p>Sebutkan konteks seperlunya, misalnya pesan datang dari nomor tidak dikenal, mengatasnamakan bank, meminta transfer, atau mengirim link login.</p>
            <p>Gunakan hasil sebagai bantuan awal. Untuk tindakan resmi, tetap hubungi kanal rujukan yang sesuai.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
