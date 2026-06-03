import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

const methods = [
  {
    title: "Pembacaan struktur tautan",
    content:
      "Link dinilai dari panjang alamat, domain, penggunaan pemendek tautan, simbol yang tidak lazim, kata pemicu seperti login atau verifikasi, serta kesesuaian dengan domain resmi."
  },
  {
    title: "Pembacaan pola pesan",
    content:
      "Pesan dianalisis berdasarkan pola manipulasi seperti tekanan waktu, hadiah palsu, permintaan OTP, permintaan transfer, ancaman blokir, atau upaya mengambil alih akun."
  },
  {
    title: "Analisis screenshot",
    content:
      "Screenshot percakapan dapat diunggah langsung. Sistem membaca isi gambar, lalu menilai apakah ada tanda penipuan digital. Keterangan tambahan dari pengguna bersifat opsional."
  },
  {
    title: "Riwayat dan pemantauan",
    content:
      "Setiap hasil tersimpan pada akun pengguna masing-masing. Admin memiliki ruang terpisah untuk melihat ringkasan operasional dan tren kasus tanpa menampilkannya kepada pengguna umum."
  }
];

export default function AboutPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Metodologi"
        title="Kerangka kerja Del-FraudShield AI."
        description="Halaman ini menjelaskan cara sistem membantu pengguna memahami risiko penipuan digital secara praktis, terukur, dan mudah dipresentasikan."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {methods.map((item) => (
          <section key={item.title} className="glass-panel rounded-3xl p-6">
            <h2 className="text-2xl font-black text-white">{item.title}</h2>
            <p className="mt-4 leading-7 text-slate-300">{item.content}</p>
          </section>
        ))}
      </div>

      <section className="mt-7 glass-panel rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Alur Sistem</p>
        <h2 className="mt-2 text-2xl font-black text-white">Dari input menjadi saran tindakan</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            "Masuk akun",
            "Masukkan link/pesan/screenshot",
            "Sistem membaca sinyal risiko",
            "Skor dan alasan ditampilkan",
            "Pengguna diarahkan ke langkah aman"
          ].map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/12 font-black text-cyan-100">
                {index + 1}
              </span>
              <p className="mt-4 font-bold text-white">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7 glass-panel rounded-3xl p-6">
        <h2 className="text-2xl font-black text-white">Batas penggunaan</h2>
        <p className="mt-4 leading-7 text-slate-300">
          Del-FraudShield AI adalah alat bantu deteksi dini dan edukasi. Hasil analisis tidak menggantikan proses hukum, forensik digital, atau keputusan lembaga resmi. Untuk kasus serius, pengguna tetap perlu menyimpan bukti dan menghubungi kanal bantuan yang relevan.
        </p>
      </section>
    </AppShell>
  );
}
