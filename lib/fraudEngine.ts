export type AnalysisType = "url" | "text" | "image";
export type RiskLevel = "Rendah" | "Sedang" | "Tinggi";

export type FraudAnalysisResult = {
  type: AnalysisType;
  title: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendations: string[];
  features: Record<string, unknown>;
  case_category?: string;
  external_source?: string | null;
  external_status?: string | null;
  log_id?: number | null;
};

const suspiciousTerms = [
  "otp",
  "pin",
  "password",
  "verifikasi",
  "hadiah",
  "undian",
  "gratis",
  "beasiswa",
  "bantuan",
  "klik",
  "segera",
  "blokir",
  "rekening",
  "transfer",
  "admin",
  "kurir",
  "paket",
  "dana",
  "ovo",
  "gopay",
  "shopeepay",
  "whatsapp",
  "wa.me",
  "login",
  "akun",
  "konfirmasi",
  "biaya"
];

const localAcademicTerms = [
  "del",
  "student",
  "akademik",
  "portal",
  "beasiswa",
  "kampus",
  "laguboti",
  "tobasa",
  "kos",
  "asrama",
  "ukt",
  "registrasi"
];

const shorteners = [
  "bit.ly",
  "tinyurl.com",
  "s.id",
  "cutt.ly",
  "shorturl.at",
  "rebrand.ly",
  "t.ly",
  "is.gd"
];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function riskLevel(score: number): RiskLevel {
  if (score >= 70) return "Tinggi";
  if (score >= 40) return "Sedang";
  return "Rendah";
}

function getRecommendations(level: RiskLevel): string[] {
  if (level === "Tinggi") {
    return [
      "Jangan klik tautan dan jangan mengirim OTP, PIN, atau password.",
      "Ambil screenshot sebagai bukti sebelum chat atau tautan dihapus.",
      "Laporkan melalui Hub Pelaporan dan kanal resmi seperti patrolisiber.id atau cekrekening.id.",
      "Verifikasi ke pihak kampus, bank, kurir, atau admin resmi melalui kontak yang sudah dikenal."
    ];
  }

  if (level === "Sedang") {
    return [
      "Jangan lanjutkan transaksi sebelum sumber dikonfirmasi.",
      "Periksa domain, nomor pengirim, dan tata bahasa pesan.",
      "Gunakan fitur laporan bila pesan berkaitan dengan uang, akun, atau data pribadi."
    ];
  }

  return [
    "Risiko awal rendah, tetapi tetap verifikasi jika ada permintaan data pribadi.",
    "Simpan bukti komunikasi bila pesan berasal dari kontak tidak dikenal.",
    "Hindari membuka tautan dari sumber yang tidak jelas."
  ];
}

function countMatches(input: string, dictionary: string[]) {
  const lower = input.toLowerCase();
  return dictionary.filter((word) => lower.includes(word)).length;
}

function safeUrl(raw: string): URL | null {
  try {
    const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(normalized);
  } catch {
    return null;
  }
}

function analyzeUrl(content: string): FraudAnalysisResult {
  const url = safeUrl(content);
  const lower = content.toLowerCase();

  const lengthScore = content.length > 90 ? 18 : content.length > 55 ? 10 : 2;
  const suspiciousTermCount = countMatches(lower, suspiciousTerms);
  const academicTermCount = countMatches(lower, localAcademicTerms);
  const shortenerDetected = shorteners.some((domain) => lower.includes(domain));
  const hasAtSymbol = lower.includes("@");
  const digitCount = (content.match(/\d/g) ?? []).length;
  const hyphenCount = (content.match(/-/g) ?? []).length;
  const dotCount = (content.match(/\./g) ?? []).length;
  const hasHttps = lower.startsWith("https://");
  const fakeAcademicSignal =
    lower.includes("del") && !lower.includes("del.ac.id") && !lower.includes("students.del.ac.id");

  let score = 0;
  score += lengthScore;
  score += suspiciousTermCount * 8;
  score += academicTermCount * 3;
  score += shortenerDetected ? 24 : 0;
  score += hasAtSymbol ? 14 : 0;
  score += digitCount > 6 ? 10 : digitCount > 2 ? 5 : 0;
  score += hyphenCount > 2 ? 7 : 0;
  score += dotCount > 3 ? 8 : 0;
  score += !hasHttps ? 8 : 0;
  score += fakeAcademicSignal ? 28 : 0;

  score = clamp(score);
  const level = riskLevel(score);

  const reasons: string[] = [];
  if (!url) reasons.push("Format URL tidak valid atau tidak lengkap.");
  if (shortenerDetected) reasons.push("URL memakai layanan pemendek tautan yang sering dipakai untuk menyamarkan tujuan asli.");
  if (suspiciousTermCount > 0) reasons.push(`Ditemukan ${suspiciousTermCount} kata kunci berisiko seperti hadiah, OTP, transfer, atau verifikasi.`);
  if (academicTermCount > 0) reasons.push("URL memuat konteks akademik atau lokal sehingga perlu diverifikasi dengan kanal resmi.");
  if (fakeAcademicSignal) reasons.push("Ada indikasi domain mengatasnamakan Del tetapi bukan domain resmi del.ac.id.");
  if (!hasHttps) reasons.push("URL tidak menggunakan HTTPS pada input awal.");
  if (digitCount > 6 || hyphenCount > 2 || dotCount > 3) reasons.push("Struktur URL kompleks dan berpotensi menyamarkan domain asli.");
  if (reasons.length === 0) reasons.push("Tidak ditemukan pola teknis yang sangat mencurigakan pada URL.");

  return {
    type: "url",
    title: url?.hostname ?? "URL Tidak Valid",
    score,
    level,
    reasons,
    recommendations: getRecommendations(level),
    features: {
      urlLength: content.length,
      hostname: url?.hostname ?? "-",
      suspiciousTermCount,
      academicTermCount,
      shortenerDetected,
      hasHttps,
      digitCount,
      hyphenCount,
      dotCount,
      fakeAcademicSignal
    }
  };
}

function analyzeText(content: string, forcedType: AnalysisType = "text"): FraudAnalysisResult {
  const lower = content.toLowerCase();
  const suspiciousTermCount = countMatches(lower, suspiciousTerms);
  const academicTermCount = countMatches(lower, localAcademicTerms);
  const urgencySignals = ["segera", "hari ini", "sekarang", "terakhir", "blokir", "hangus", "deadline"]
    .filter((word) => lower.includes(word)).length;
  const moneySignals = ["transfer", "rekening", "dana", "biaya", "admin", "pajak", "saldo", "pencairan"]
    .filter((word) => lower.includes(word)).length;
  const credentialSignals = ["otp", "pin", "password", "kode", "login", "verifikasi akun"]
    .filter((word) => lower.includes(word)).length;
  const linkSignals = ["http", "www.", "bit.ly", "wa.me", "klik", "link"]
    .filter((word) => lower.includes(word)).length;
  const messageLength = content.trim().length;

  let score = 5;
  score += suspiciousTermCount * 7;
  score += urgencySignals * 12;
  score += moneySignals * 10;
  score += credentialSignals * 18;
  score += linkSignals * 10;
  score += academicTermCount * 4;
  score += messageLength > 220 ? 8 : messageLength > 120 ? 4 : 0;

  score = clamp(score);
  const level = riskLevel(score);

  const reasons: string[] = [];
  if (urgencySignals > 0) reasons.push("Pesan memakai tekanan waktu atau urgensi yang umum dalam social engineering.");
  if (credentialSignals > 0) reasons.push("Pesan meminta atau mengarah pada data kredensial seperti OTP, PIN, kode, atau login.");
  if (moneySignals > 0) reasons.push("Pesan berkaitan dengan transfer, rekening, saldo, biaya, atau pencairan dana.");
  if (linkSignals > 0) reasons.push("Pesan mendorong pengguna membuka tautan atau kanal eksternal.");
  if (academicTermCount > 0) reasons.push("Pesan membawa konteks akademik/lokal sehingga berpotensi menyasar mahasiswa atau keluarga mahasiswa.");
  if (suspiciousTermCount > 0) reasons.push(`Ditemukan ${suspiciousTermCount} kata kunci siber-fraud.`);
  if (reasons.length === 0) reasons.push("Tidak ditemukan pola manipulatif yang kuat pada teks.");

  return {
    type: forcedType,
    title: forcedType === "image" ? "Analisis Screenshot" : "Analisis Pesan",
    score,
    level,
    reasons,
    recommendations: getRecommendations(level),
    features: {
      suspiciousTermCount,
      academicTermCount,
      urgencySignals,
      moneySignals,
      credentialSignals,
      linkSignals,
      messageLength
    }
  };
}

export function analyzeFraud(type: AnalysisType, content: string): FraudAnalysisResult {
  if (type === "url") return analyzeUrl(content);
  if (type === "image") return analyzeText(content, "image");
  return analyzeText(content, "text");
}

export function createReportDraft(input: {
  reporterName: string;
  caseType: string;
  platform: string;
  suspectContact: string;
  chronology: string;
  riskLevel?: RiskLevel;
}) {
  const date = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date());

  return `DRAF LAPORAN SIBER-FRAUD

Tanggal penyusunan: ${date}

Identitas pelapor:
Nama: ${input.reporterName || "Belum diisi"}

Jenis dugaan kasus:
${input.caseType || "Belum diisi"}

Platform atau kanal kejadian:
${input.platform || "Belum diisi"}

Kontak, nomor rekening, tautan, atau identitas terduga pelaku:
${input.suspectContact || "Belum diisi"}

Tingkat risiko awal:
${input.riskLevel || "Belum dianalisis"}

Kronologi singkat:
${input.chronology || "Belum diisi"}

Permohonan:
Saya memohon agar laporan ini dapat ditindaklanjuti sesuai prosedur yang berlaku. Bukti pendukung berupa screenshot, tautan, nomor rekening, percakapan, atau bukti transaksi dapat dilampirkan pada kanal pelaporan resmi.

Catatan:
Draf ini dibuat oleh Del-FraudShield AI sebagai alat bantu penyusunan laporan awal. Pelapor tetap perlu memastikan kebenaran data sebelum mengirim laporan ke kanal resmi.`;
}
