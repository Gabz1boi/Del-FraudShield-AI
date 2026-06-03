from __future__ import annotations

import base64
import json
import os
import re
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import httpx

from app.schemas import AnalysisType, CaseCategory, FraudAnalysisResult, RiskLevel

SUSPICIOUS_TERMS = [
    "otp", "pin", "password", "verifikasi", "hadiah", "undian", "gratis", "beasiswa",
    "bantuan", "klik", "segera", "blokir", "rekening", "transfer", "admin", "kurir",
    "paket", "dana", "ovo", "gopay", "shopeepay", "whatsapp", "wa.me", "login",
    "akun", "konfirmasi", "biaya", "apk", "pajak", "saldo", "kode", "resmi", "klaim",
    "pemenang", "pinjaman", "paylater", "investasi", "crypto", "dompet digital",
]

LOCAL_ACADEMIC_TERMS = [
    "del", "student", "students", "akademik", "portal", "beasiswa", "kampus", "laguboti",
    "tobasa", "balige", "kos", "asrama", "ukt", "registrasi", "mahasiswa"
]

SHORTENERS = [
    "bit.ly", "tinyurl.com", "s.id", "cutt.ly", "shorturl.at", "rebrand.ly", "t.ly", "is.gd"
]

OFFICIAL_DOMAINS = ["del.ac.id", "students.del.ac.id"]

URGENCY_TERMS = ["segera", "hari ini", "sekarang", "terakhir", "blokir", "hangus", "deadline", "dibekukan", "wajib"]
MONEY_TERMS = ["transfer", "rekening", "dana", "biaya", "admin", "pajak", "saldo", "pencairan", "dp", "ewallet", "e-wallet"]
CREDENTIAL_TERMS = ["otp", "pin", "password", "kode", "login", "verifikasi akun", "akun", "reset"]
LINK_TERMS = ["http", "www.", "bit.ly", "wa.me", "klik", "link", "tautan"]
SOCIAL_ENGINEERING_TERMS = ["jangan beri tahu", "rahasia", "hanya berlaku", "pemenang", "hadiah", "klaim", "resmi dari"]
MALWARE_TERMS = ["apk", "exe", "scr", "unduh aplikasi", "install", "instal", "update apk"]
HARASSMENT_TERMS = ["sebar foto", "ancam", "pemerasan", "doxing", "doxxing", "pelecehan", "intim", "video pribadi"]
HOAX_TERMS = ["viral", "sebarkan", "kominfo", "hoaks", "hoax", "broadcast", "forward"]


@dataclass
class VirusTotalSignal:
    source: str
    status: str
    stats: dict[str, int]
    analysis_id: str | None
    permalink: str | None
    engines: list[dict[str, str]]
    score: int
    reasons: list[str]


def clamp(value: int, min_value: int = 0, max_value: int = 100) -> int:
    return max(min_value, min(max_value, value))


def risk_level(score: int) -> RiskLevel:
    if score >= 70:
        return "Tinggi"
    if score >= 40:
        return "Sedang"
    return "Rendah"


def count_matches(text: str, dictionary: list[str]) -> int:
    lower = text.lower()
    return sum(1 for word in dictionary if word in lower)


def classify_case_category(text: str, input_type: AnalysisType = "text") -> CaseCategory:
    lower = text.lower()
    if input_type == "url" or any(term in lower for term in ["phishing", "login", "otp", "verifikasi", "bit.ly", "link", "tautan"]):
        return "phishing"
    if any(term in lower for term in ["rekening", "transfer", "ewallet", "e-wallet", "dana", "ovo", "gopay", "shopeepay"]):
        return "rekening_penipuan"
    if any(term in lower for term in ["akun diretas", "hack", "hacked", "password", "reset", "ambil alih akun"]):
        return "akun_diretas"
    if any(term in lower for term in ["pinjaman", "pinjol", "paylater", "dc", "debt collector"]):
        return "pinjaman_online"
    if any(term in lower for term in HARASSMENT_TERMS):
        return "kekerasan_digital"
    if any(term in lower for term in MALWARE_TERMS):
        return "malware"
    if any(term in lower for term in HOAX_TERMS):
        return "hoaks"
    return "umum"


def get_recommendations(level: RiskLevel, category: CaseCategory = "umum") -> list[str]:
    base = [
        "Jangan kirim OTP, PIN, password, token autentikasi, atau data kartu ke siapa pun.",
        "Simpan bukti: screenshot, URL, nomor pengirim, nomor rekening/e-wallet, waktu kejadian, dan kronologi singkat.",
        "Verifikasi melalui kanal resmi yang Anda ketik sendiri, bukan dari tautan atau nomor dalam pesan.",
    ]
    if category == "rekening_penipuan":
        base.append("Cek dan blokir transaksi melalui bank/e-wallet terkait, lalu gunakan layanan CekRekening atau OJK bila menyangkut jasa keuangan.")
    elif category == "phishing":
        base.append("Buka akun dari domain resmi secara manual dan ganti password bila sudah sempat mengisi formulir palsu.")
    elif category == "akun_diretas":
        base.append("Aktifkan pemulihan akun, cabut sesi aktif yang tidak dikenal, dan nyalakan autentikasi dua faktor.")
    elif category == "kekerasan_digital":
        base.append("Prioritaskan keselamatan korban, jangan membalas ancaman, dan cari pendampingan lembaga layanan korban terdekat.")

    if level == "Tinggi":
        return base + ["Gunakan Hub Pelaporan untuk mencari lembaga/layanan yang paling relevan dan paling dekat dengan lokasi Anda."]
    if level == "Sedang":
        return base[:3] + ["Tunda respons sampai sumber informasi dapat diverifikasi secara independen."]
    return [
        "Risiko awal rendah, tetapi tetap verifikasi bila pesan meminta uang, login, OTP, atau data pribadi.",
        "Gunakan kanal resmi dan simpan bukti bila pesan berulang atau semakin menekan.",
    ]


def normalize_url(raw: str) -> str:
    raw = raw.strip()
    if not raw.startswith(("http://", "https://")):
        return f"https://{raw}"
    return raw


def url_id_for_virustotal(url: str) -> str:
    # VirusTotal URL identifier: base64 URL-safe tanpa padding.
    return base64.urlsafe_b64encode(url.encode("utf-8")).decode("utf-8").strip("=")


def analyze_url_local(content: str) -> FraudAnalysisResult:
    raw = content.strip()
    normalized = normalize_url(raw)
    parsed = urlparse(normalized)
    hostname = parsed.hostname or ""
    lower = raw.lower()

    suspicious_term_count = count_matches(lower, SUSPICIOUS_TERMS)
    academic_term_count = count_matches(lower, LOCAL_ACADEMIC_TERMS)
    shortener_detected = any(domain in lower for domain in SHORTENERS)
    official_domain = any(hostname == domain or hostname.endswith(f".{domain}") for domain in OFFICIAL_DOMAINS)
    fake_academic_signal = "del" in lower and not official_domain
    has_at_symbol = "@" in raw
    digit_count = len(re.findall(r"\d", raw))
    hyphen_count = raw.count("-")
    dot_count = raw.count(".")
    subdomain_count = max(0, len(hostname.split(".")) - 2) if hostname else 0
    has_https = normalized.lower().startswith("https://")
    has_ip_host = bool(re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", hostname))
    suspicious_extension = any(raw.lower().endswith(ext) for ext in [".apk", ".exe", ".scr", ".zip", ".rar"])

    score = 0
    score += 18 if len(raw) > 90 else 10 if len(raw) > 55 else 2
    score += suspicious_term_count * 8
    score += academic_term_count * 3
    score += 24 if shortener_detected else 0
    score += 28 if fake_academic_signal else 0
    score += 14 if has_at_symbol else 0
    score += 14 if has_ip_host else 0
    score += 20 if suspicious_extension else 0
    score += 10 if digit_count > 6 else 5 if digit_count > 2 else 0
    score += 7 if hyphen_count > 2 else 0
    score += 8 if dot_count > 3 or subdomain_count > 2 else 0
    score += 8 if not has_https else 0
    score -= 15 if official_domain else 0
    score = clamp(score)
    level = risk_level(score)
    category = classify_case_category(raw, "url")

    reasons: list[str] = []
    if not hostname:
        reasons.append("Format URL tidak dapat diparse sebagai hostname yang valid.")
    if official_domain:
        reasons.append("Hostname berada pada domain resmi yang dikenali; konteks pesan tetap perlu dicek.")
    if shortener_detected:
        reasons.append("URL memakai pemendek tautan, sehingga tujuan akhir dapat disamarkan.")
    if fake_academic_signal:
        reasons.append("URL membawa nama Del/konteks akademik, tetapi bukan domain resmi yang dikenali.")
    if suspicious_extension:
        reasons.append("URL mengarah ke ekstensi file yang lazim dipakai dalam rekayasa sosial atau malware.")
    if has_ip_host:
        reasons.append("Hostname memakai alamat IP langsung, bukan domain organisasi yang mudah diverifikasi.")
    if suspicious_term_count > 0:
        reasons.append(f"Ditemukan {suspicious_term_count} istilah berisiko, misalnya OTP, verifikasi, transfer, atau hadiah.")
    if digit_count > 6 or hyphen_count > 2 or dot_count > 3:
        reasons.append("Struktur URL relatif kompleks dan dapat digunakan untuk menyamarkan domain asli.")
    if not reasons:
        reasons.append("Tidak ditemukan sinyal teknis lokal yang kuat; reputasi eksternal tetap perlu dicek.")

    return FraudAnalysisResult(
        type="url",
        title=hostname or "URL Tidak Valid",
        score=score,
        level=level,
        reasons=reasons,
        recommendations=get_recommendations(level, category),
        case_category=category,
        external_source=None,
        external_status=None,
        features={
            "normalizedUrl": normalized,
            "urlLength": len(raw),
            "hostname": hostname or "-",
            "suspiciousTermCount": suspicious_term_count,
            "academicTermCount": academic_term_count,
            "shortenerDetected": shortener_detected,
            "officialDomain": official_domain,
            "fakeAcademicSignal": fake_academic_signal,
            "hasHttps": has_https,
            "digitCount": digit_count,
            "hyphenCount": hyphen_count,
            "dotCount": dot_count,
            "subdomainCount": subdomain_count,
            "hasIpHost": has_ip_host,
            "suspiciousExtension": suspicious_extension,
        },
    )


def fetch_virustotal_url_report(normalized_url: str) -> VirusTotalSignal:
    api_key = os.getenv("VIRUSTOTAL_API_KEY", "").strip()
    if not api_key:
        return VirusTotalSignal(
            source="VirusTotal",
            status="not_configured",
            stats={},
            analysis_id=None,
            permalink=None,
            engines=[],
            score=0,
            reasons=["VirusTotal API key belum dikonfigurasi di backend/.env."],
        )

    headers = {"x-apikey": api_key}
    attempts = max(1, int(os.getenv("VIRUSTOTAL_POLL_ATTEMPTS", "3")))
    delay = max(0, int(os.getenv("VIRUSTOTAL_POLL_SECONDS", "2")))

    try:
        with httpx.Client(timeout=20.0) as client:
            submit = client.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": normalized_url},
            )
            if submit.status_code == 429:
                return VirusTotalSignal("VirusTotal", "rate_limited", {}, None, None, [], 0, ["Kuota VirusTotal API sedang mencapai batas."])
            if submit.status_code >= 400:
                return VirusTotalSignal("VirusTotal", "error", {}, None, None, [], 0, [f"VirusTotal mengembalikan status {submit.status_code} saat submit URL."])

            analysis_id = submit.json().get("data", {}).get("id")
            report: dict[str, Any] | None = None
            status = "queued"
            if analysis_id:
                for index in range(attempts):
                    analysis = client.get(f"https://www.virustotal.com/api/v3/analyses/{analysis_id}", headers=headers)
                    if analysis.status_code == 429:
                        return VirusTotalSignal("VirusTotal", "rate_limited", {}, analysis_id, None, [], 0, ["Kuota VirusTotal API sedang mencapai batas."])
                    if analysis.status_code >= 400:
                        return VirusTotalSignal("VirusTotal", "error", {}, analysis_id, None, [], 0, [f"VirusTotal mengembalikan status {analysis.status_code} saat membaca hasil analisis."])
                    report = analysis.json()
                    status = report.get("data", {}).get("attributes", {}).get("status", "completed")
                    if status == "completed":
                        break
                    if index < attempts - 1 and delay > 0:
                        time.sleep(delay)
            else:
                status = "no_analysis_id"

            attrs = (report or {}).get("data", {}).get("attributes", {})
            stats = attrs.get("stats") or {}
            results = attrs.get("results") or {}
            engines: list[dict[str, str]] = []
            for engine, detail in results.items():
                category = str(detail.get("category", ""))
                result = str(detail.get("result", ""))
                if category in {"malicious", "suspicious"}:
                    engines.append({"engine": engine, "category": category, "result": result})
            engines = engines[:8]

            malicious = int(stats.get("malicious", 0) or 0)
            suspicious = int(stats.get("suspicious", 0) or 0)
            harmless = int(stats.get("harmless", 0) or 0)
            undetected = int(stats.get("undetected", 0) or 0)

            vt_score = 0
            if malicious > 0:
                vt_score = clamp(72 + min(25, malicious * 6))
            elif suspicious > 0:
                vt_score = clamp(48 + min(22, suspicious * 7))
            elif harmless > 0 and malicious == 0 and suspicious == 0:
                vt_score = 15

            reasons: list[str] = []
            if malicious > 0 or suspicious > 0:
                reasons.append(f"VirusTotal menemukan {malicious} vendor malicious dan {suspicious} vendor suspicious.")
            elif status == "completed":
                reasons.append("VirusTotal tidak menemukan vendor yang menandai URL sebagai malicious pada hasil saat ini.")
            else:
                reasons.append("Hasil VirusTotal belum selesai; ulangi analisis beberapa saat lagi.")

            vt_url_id = url_id_for_virustotal(normalized_url)
            permalink = f"https://www.virustotal.com/gui/url/{vt_url_id}" if vt_url_id else None
            return VirusTotalSignal(
                source="VirusTotal",
                status=status,
                stats={
                    "malicious": malicious,
                    "suspicious": suspicious,
                    "harmless": harmless,
                    "undetected": undetected,
                    "timeout": int(stats.get("timeout", 0) or 0),
                },
                analysis_id=analysis_id,
                permalink=permalink,
                engines=engines,
                score=vt_score,
                reasons=reasons,
            )
    except httpx.RequestError as exc:
        return VirusTotalSignal("VirusTotal", "network_error", {}, None, None, [], 0, [f"Gagal menghubungi VirusTotal: {exc.__class__.__name__}."])


def analyze_url(content: str) -> FraudAnalysisResult:
    local = analyze_url_local(content)
    normalized = str(local.features.get("normalizedUrl") or normalize_url(content))
    vt = fetch_virustotal_url_report(normalized)

    reasons = list(local.reasons)
    features = dict(local.features)
    features["threatIntel"] = {
        "source": vt.source,
        "status": vt.status,
        "stats": vt.stats,
        "analysisId": vt.analysis_id,
        "permalink": vt.permalink,
        "flaggedEngines": vt.engines,
    }

    if vt.status == "completed":
        reasons = vt.reasons + reasons
        combined_score = max(local.score, vt.score)
    elif vt.status == "not_configured":
        reasons.append("Reputasi eksternal belum dapat digunakan karena VIRUSTOTAL_API_KEY belum diisi.")
        combined_score = local.score
    else:
        reasons.extend(vt.reasons)
        combined_score = local.score

    level = risk_level(combined_score)
    local.score = combined_score
    local.level = level
    local.reasons = reasons[:8]
    local.recommendations = get_recommendations(level, local.case_category)
    local.features = features
    local.external_source = vt.source
    local.external_status = vt.status
    return local


def analyze_text(content: str, forced_type: AnalysisType = "text") -> FraudAnalysisResult:
    text = content.strip()
    lower = text.lower()
    suspicious_term_count = count_matches(lower, SUSPICIOUS_TERMS)
    academic_term_count = count_matches(lower, LOCAL_ACADEMIC_TERMS)
    urgency_signals = count_matches(lower, URGENCY_TERMS)
    money_signals = count_matches(lower, MONEY_TERMS)
    credential_signals = count_matches(lower, CREDENTIAL_TERMS)
    link_signals = count_matches(lower, LINK_TERMS)
    social_engineering_signals = count_matches(lower, SOCIAL_ENGINEERING_TERMS)
    malware_signals = count_matches(lower, MALWARE_TERMS)
    harassment_signals = count_matches(lower, HARASSMENT_TERMS)
    hoax_signals = count_matches(lower, HOAX_TERMS)
    phone_like_count = len(re.findall(r"(?:\+62|62|0)\d{8,13}", lower))
    message_length = len(text)

    score = 5
    score += suspicious_term_count * 7
    score += urgency_signals * 12
    score += money_signals * 10
    score += credential_signals * 18
    score += link_signals * 10
    score += academic_term_count * 4
    score += social_engineering_signals * 10
    score += malware_signals * 14
    score += harassment_signals * 12
    score += hoax_signals * 7
    score += 8 if phone_like_count > 0 else 0
    score += 8 if message_length > 220 else 4 if message_length > 120 else 0
    score = clamp(score)
    level = risk_level(score)
    category = classify_case_category(text, forced_type)

    reasons: list[str] = []
    if urgency_signals > 0:
        reasons.append("Pesan memakai tekanan waktu atau ancaman konsekuensi cepat, pola umum social engineering.")
    if credential_signals > 0:
        reasons.append("Pesan berkaitan dengan kredensial seperti OTP, PIN, kode, login, password, atau verifikasi akun.")
    if money_signals > 0:
        reasons.append("Pesan meminta atau mengarahkan pada transfer, rekening, saldo, biaya, pajak, DP, atau pencairan dana.")
    if link_signals > 0:
        reasons.append("Pesan mendorong pengguna membuka tautan atau kanal eksternal.")
    if malware_signals > 0:
        reasons.append("Pesan mengandung indikasi unduhan aplikasi/file yang berpotensi berbahaya.")
    if harassment_signals > 0:
        reasons.append("Pesan mengandung pola ancaman, pemerasan, doxxing, atau kekerasan digital.")
    if academic_term_count > 0:
        reasons.append("Pesan membawa konteks akademik/lokal sehingga berpotensi menyasar mahasiswa atau keluarga mahasiswa.")
    if social_engineering_signals > 0:
        reasons.append("Ada frasa persuasi/manipulasi seperti klaim hadiah, kerahasiaan, atau batas waktu.")
    if phone_like_count > 0:
        reasons.append("Terdapat pola nomor telepon yang perlu diverifikasi sebelum dihubungi.")
    if not reasons:
        reasons.append("Tidak ditemukan pola manipulatif kuat pada teks.")

    return FraudAnalysisResult(
        type=forced_type,
        title="Analisis Screenshot" if forced_type == "image" else "Analisis Pesan",
        score=score,
        level=level,
        reasons=reasons[:8],
        recommendations=get_recommendations(level, category),
        case_category=category,
        features={
            "suspiciousTermCount": suspicious_term_count,
            "academicTermCount": academic_term_count,
            "urgencySignals": urgency_signals,
            "moneySignals": money_signals,
            "credentialSignals": credential_signals,
            "linkSignals": link_signals,
            "socialEngineeringSignals": social_engineering_signals,
            "malwareSignals": malware_signals,
            "harassmentSignals": harassment_signals,
            "hoaxSignals": hoax_signals,
            "phoneLikeCount": phone_like_count,
            "messageLength": message_length,
        },
    )


def analyze_fraud(input_type: AnalysisType, content: str) -> FraudAnalysisResult:
    if input_type == "url":
        return analyze_url(content)
    if input_type == "image":
        return analyze_text(content, "image")
    return analyze_text(content, "text")


def extract_gemini_text(payload: dict[str, Any]) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts") or []
    return "\n".join(str(part.get("text", "")) for part in parts if part.get("text")).strip()





def analyze_image_bytes(image_bytes: bytes, mime_type: str, filename: str, context: str = "") -> tuple[FraudAnalysisResult, str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    if not api_key:
        raise RuntimeError("Kunci AI belum dikonfigurasi. Analisis gambar membutuhkan layanan AI aktif.")

    prompt = (
        "Baca isi gambar/screenshot berikut. Ekstrak teks penting bila ada, identifikasi pola penipuan digital, "
        "dan tulis ringkasan faktual dalam Bahasa Indonesia. Jangan mengarang isi yang tidak terlihat. "
        "Bila gambar tidak memuat teks, jelaskan elemen visual yang relevan untuk penilaian risiko."
    )
    if context.strip():
        prompt += f"\nKonteks tambahan dari pengguna: {context.strip()}"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64.b64encode(image_bytes).decode("utf-8"),
                        }
                    },
                ],
            }
        ],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 900},
    }

    try:
        with httpx.Client(timeout=35.0) as client:
            response = client.post(url, json=body)
            if response.status_code >= 400:
                raise RuntimeError("Layanan AI gambar belum dapat memproses file saat ini.")
            extracted_text = extract_gemini_text(response.json())
            if not extracted_text:
                raise RuntimeError("Layanan AI tidak mengembalikan hasil pembacaan gambar.")
    except httpx.RequestError as exc:
        raise RuntimeError(f"Gagal menghubungi layanan AI gambar: {exc.__class__.__name__}") from exc

    combined = f"Nama file: {filename}\nKonteks pengguna: {context.strip() or '-'}\nHasil pembacaan gambar:\n{extracted_text}"
    result = analyze_text(combined, "image")
    result.title = "Analisis Screenshot"
    result.features = {
        **result.features,
        "fileName": filename,
        "mimeType": mime_type,
        "contextProvided": bool(context.strip()),
        "imageReadingLength": len(extracted_text),
        "imageReadingPreview": extracted_text[:450],
    }
    result.reasons = ["Gambar dibaca langsung oleh layanan AI visual sebelum dihitung skornya."] + result.reasons
    return result, extracted_text


def ai_chatbot_reply(message: str, analysis: FraudAnalysisResult) -> tuple[str, str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    if not api_key:
        raise RuntimeError("Layanan AI belum dikonfigurasi. Hubungi admin platform untuk mengaktifkan chatbot.")

    system_instruction = (
        "Anda adalah asisten keamanan digital Del-FraudShield AI. Jawab dalam Bahasa Indonesia yang jelas, praktis, "
        "dan berbasis mitigasi. Jangan mengklaim kepastian forensik. Fokus pada langkah aman, verifikasi, pengamanan akun, "
        "dan rujukan layanan. Jangan meminta korban mengirim data sensitif."
    )
    prompt = {
        "pesan_pengguna": message,
        "analisis_pipeline": {
            "score": analysis.score,
            "level": analysis.level,
            "category": analysis.case_category,
            "reasons": analysis.reasons,
            "recommendations": analysis.recommendations,
            "features": analysis.features,
        },
        "instruksi_jawaban": (
            "Berikan jawaban ringkas tetapi kontekstual: 1) penilaian risiko, 2) alasan utama, "
            "3) langkah aman segera, 4) lembaga/layanan yang mungkin relevan. Maksimal 5 paragraf pendek."
        ),
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": json.dumps(prompt, ensure_ascii=False)}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 900},
    }

    try:
        with httpx.Client(timeout=25.0) as client:
            response = client.post(url, json=body)
            if response.status_code >= 400:
                raise RuntimeError("Layanan AI belum dapat memproses pesan saat ini.")
            text = extract_gemini_text(response.json())
            if not text:
                raise RuntimeError("Layanan AI tidak mengembalikan teks jawaban.")
            return text, f"gemini:{model}"
    except httpx.RequestError as exc:
        raise RuntimeError(f"Gagal menghubungi layanan AI: {exc.__class__.__name__}") from exc


def chatbot_reply(message: str) -> tuple[str, FraudAnalysisResult, list[str], str]:
    detected_type: AnalysisType = "url" if re.search(r"https?://|www\.|bit\.ly|s\.id|wa\.me", message.lower()) else "text"
    analysis = analyze_fraud(detected_type, message)
    reply, provider = ai_chatbot_reply(message, analysis)
    signals = analysis.reasons[:4]
    return reply, analysis, signals, provider
