export const trendCards = [
  {
    label: "Kasus minggu ini",
    value: "128",
    note: "Simulasi laporan dari area akademik dan masyarakat sekitar.",
    tone: "cyan" as const
  },
  {
    label: "Risiko tinggi",
    value: "37%",
    note: "Mayoritas berkaitan dengan OTP, transfer, dan tautan palsu.",
    tone: "red" as const
  },
  {
    label: "Modus dominan",
    value: "Kurir paket",
    note: "Pola meningkat pada chat WhatsApp dengan file/link palsu.",
    tone: "yellow" as const
  },
  {
    label: "Edukasi terkirim",
    value: "412",
    note: "Ringkasan peringatan dan rekomendasi keamanan digital.",
    tone: "green" as const
  }
];

export const clusterData = [
  {
    cluster: "C1",
    name: "Phishing Portal Akademik",
    cases: 31,
    location: "Laguboti",
    signals: ["login palsu", "beasiswa", "portal mahasiswa", "password"]
  },
  {
    cluster: "C2",
    name: "Penipuan Kurir Paket",
    cases: 48,
    location: "Balige",
    signals: ["kurir", "file apk", "resi", "rekening"]
  },
  {
    cluster: "C3",
    name: "Transaksi Kos & Sewa",
    cases: 19,
    location: "Tobasa",
    signals: ["DP kos", "transfer cepat", "foto palsu", "lokasi"]
  },
  {
    cluster: "C4",
    name: "Undian & Bantuan Palsu",
    cases: 30,
    location: "Medan",
    signals: ["hadiah", "pajak admin", "dana bantuan", "klik link"]
  }
];

export const recentCases = [
  {
    title: "Tautan beasiswa mengatasnamakan portal mahasiswa",
    level: "Tinggi",
    time: "10 menit lalu",
    source: "WhatsApp"
  },
  {
    title: "Pesan kurir meminta instalasi file eksternal",
    level: "Tinggi",
    time: "32 menit lalu",
    source: "SMS"
  },
  {
    title: "Akun kos palsu meminta DP tanpa survei lokasi",
    level: "Sedang",
    time: "1 jam lalu",
    source: "Instagram"
  },
  {
    title: "Undian saldo digital meminta biaya admin",
    level: "Tinggi",
    time: "2 jam lalu",
    source: "Telegram"
  }
];

export const educationTips = [
  "Domain resmi kampus perlu diverifikasi langsung, bukan hanya dilihat dari logo atau tampilan halaman.",
  "OTP, PIN, dan password tidak boleh diberikan kepada siapa pun, termasuk orang yang mengaku admin.",
  "Tautan pendek perlu diperiksa ulang karena tujuan akhirnya dapat disamarkan.",
  "Bukti screenshot sebaiknya disimpan sebelum chat, tautan, atau akun pelaku menghilang."
];
