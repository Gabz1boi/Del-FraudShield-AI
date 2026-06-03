import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

const pillars = [
  {
    title: "Cek keamanan tautan",
    description:
      "Pengguna dapat menempelkan link dari WhatsApp, SMS, email, media sosial, atau situs kampus. Sistem membaca struktur domain, pola kata berisiko, pemendek URL, indikasi penyamaran alamat, dan reputasi keamanan eksternal untuk membantu pengguna memutuskan apakah tautan aman dibuka.",
    points: ["Deteksi link palsu dan domain tiruan", "Pembacaan sinyal teknis URL", "Rekomendasi tindakan sebelum klik"]
  },
  {
    title: "Analisis pesan dan screenshot",
    description:
      "Pesan mencurigakan dapat dianalisis dari teks maupun gambar. Sistem membantu mengenali tekanan waktu, permintaan OTP, permintaan transfer, ancaman, file berbahaya, serta pola social engineering yang sering digunakan dalam penipuan digital.",
    points: ["Cocok untuk chat, SMS, email, dan tangkapan layar", "Konteks tambahan bersifat opsional", "Hasil berupa skor risiko dan alasan deteksi"]
  },
  {
    title: "Asisten keamanan digital",
    description:
      "Chatbot membantu pengguna memahami risiko, menyusun langkah aman, dan menentukan apa yang sebaiknya dilakukan berikutnya. Jawaban dibuat agar praktis: mulai dari mengamankan akun, menyimpan bukti, memblokir transaksi, hingga memilih kanal bantuan yang tepat.",
    points: ["Jawaban mudah dipahami pengguna umum", "Berbasis skor risiko sistem", "Tidak meminta data sensitif pengguna"]
  },
  {
    title: "Rujukan bantuan yang relevan",
    description:
      "Platform tidak menerima laporan resmi. Sistem hanya mengarahkan pengguna ke layanan, lembaga, atau kanal bantuan yang lebih tepat berdasarkan jenis masalah dan lokasi pengguna, misalnya kepolisian, layanan pengaduan rekening, bantuan hukum, atau layanan korban kekerasan digital.",
    points: ["Diurutkan dari lokasi terdekat bila izin lokasi aktif", "Memuat rujukan nasional dan daerah", "Dilengkapi tautan kanal dan peta"]
  }
];

const workflow = [
  "Pengguna memasukkan link, teks, chat, atau screenshot.",
  "Sistem membaca pola teknis dan bahasa yang sering muncul pada penipuan digital.",
  "Hasil analisis diberi skor risiko, alasan deteksi, serta langkah aman yang dapat langsung dilakukan.",
  "Riwayat penggunaan tersimpan pada akun masing-masing agar dashboard setiap pengguna berbeda."
];

export default function Home() {
  return (
    <>
      <PublicNav />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-40" />
          <div className="relative mx-auto grid min-h-[86vh] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="inline-flex rounded-full border border-cyan-200/20 bg-cyan-200/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                Fraud Intelligence Platform
              </div>
              <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                Deteksi dini penipuan digital sebelum pengguna mengambil keputusan.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Del-FraudShield AI membantu pengguna memeriksa link, membaca pola pesan penipuan, bertanya kepada asisten keamanan digital, dan menemukan rujukan bantuan yang relevan tanpa menjadikan platform ini sebagai tempat laporan resmi.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/login" className="primary-button">
                  Masuk Platform
                </Link>
                <a href="#pilar" className="secondary-button">
                  Lihat Empat Pilar
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
                <span className="rounded-full bg-white/6 px-4 py-2">Aman sebelum klik</span>
                <span className="rounded-full bg-white/6 px-4 py-2">Edukasi pengguna</span>
                <span className="rounded-full bg-white/6 px-4 py-2">Rujukan layanan</span>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-5">
              <div className="rounded-[1.5rem] border border-cyan-200/10 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-cyan-100">Contoh sinyal risiko</p>
                  <span className="rounded-full bg-red-400/12 px-3 py-1 text-xs font-bold text-red-100">
                    Waspada
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    ["Meminta OTP atau PIN", "91%"],
                    ["Mendesak harus hari ini", "76%"],
                    ["Link tidak sesuai domain resmi", "82%"],
                    ["Mengatasnamakan bantuan/beasiswa", "68%"]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">{label}</span>
                        <span className="font-bold text-white">{value}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/8">
                        <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-red-400" style={{ width: value }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-cyan-200/8 p-4 text-sm leading-6 text-cyan-50/85">
                  “Akun Anda perlu verifikasi ulang. Klik link beasiswa berikut dan kirim kode OTP agar dana tidak hangus.”
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pilar" className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/55">Fitur Sistem</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Empat pilar proteksi digital.</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Setiap pilar dirancang untuk membantu pengguna awam memahami risiko, bukan membuat pengguna terbebani istilah teknis.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="glass-panel rounded-3xl p-6">
                <h3 className="text-xl font-black text-white">{pillar.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{pillar.description}</p>
                <div className="mt-5 space-y-2">
                  {pillar.points.map((point) => (
                    <p key={point} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-slate-300">
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="metodologi" className="mx-auto max-w-7xl px-5 py-16">
          <div className="glass-panel rounded-[2rem] p-6 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/55">Cara Kerja</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Dari input pengguna menjadi keputusan risiko.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {workflow.map((step, index) => (
                <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-300/12 text-sm font-black text-cyan-100">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
