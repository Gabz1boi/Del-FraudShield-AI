from __future__ import annotations

import math
import os
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ServiceDirectory
from app.schemas import NearestServicesResponse, ServiceItem

SERVICE_SEEDS = [
    {
        "name": "Patrolisiber Bareskrim Polri",
        "category": "kepolisian_siber",
        "case_types": "phishing,rekening_penipuan,akun_diretas,malware,hoaks,kekerasan_digital,umum",
        "description": "Rujukan kepolisian untuk dugaan kejahatan siber, termasuk phishing, peretasan akun, penipuan online, dan pemerasan digital.",
        "address": "Jl. Trunojoyo No. 3, Kebayoran Baru, Jakarta Selatan",
        "phone": None,
        "website": "https://patrolisiber.id",
        "latitude": -6.2436,
        "longitude": 106.8005,
        "action": "Siapkan screenshot, URL, nomor pengirim, rekening/e-wallet, kronologi, dan identitas diri sebelum menghubungi kanal resmi.",
        "is_national": 1,
    },
    {
        "name": "CekRekening.id Komdigi",
        "category": "rekening_dan_ewallet",
        "case_types": "rekening_penipuan,phishing,umum",
        "description": "Rujukan untuk memeriksa atau melaporkan rekening dan dompet digital yang diduga terkait penipuan.",
        "address": "Layanan daring nasional",
        "phone": None,
        "website": "https://cekrekening.id",
        "latitude": -6.1754,
        "longitude": 106.8272,
        "action": "Gunakan ketika kasus melibatkan rekening bank, dompet digital, atau permintaan transfer mencurigakan.",
        "is_national": 1,
    },
    {
        "name": "Aduan Konten Komdigi",
        "category": "konten_digital",
        "case_types": "hoaks,phishing,kekerasan_digital,malware,umum",
        "description": "Rujukan untuk konten digital bermasalah seperti tautan phishing, konten penipuan, misinformasi, atau penyalahgunaan ruang digital.",
        "address": "Layanan daring nasional",
        "phone": None,
        "website": "https://aduankonten.id",
        "latitude": -6.1754,
        "longitude": 106.8272,
        "action": "Gunakan bila masalah utama berada pada konten, situs, akun, atau sebaran informasi di internet.",
        "is_national": 1,
    },
    {
        "name": "Kontak OJK 157",
        "category": "jasa_keuangan",
        "case_types": "rekening_penipuan,pinjaman_online,umum",
        "description": "Rujukan untuk masalah jasa keuangan, termasuk pinjaman online, investasi, bank, asuransi, atau layanan keuangan yang tidak jelas.",
        "address": "Layanan nasional OJK",
        "phone": "157",
        "website": "https://kontak157.ojk.go.id",
        "latitude": -6.2223,
        "longitude": 106.8099,
        "action": "Gunakan bila kasus berkaitan dengan layanan keuangan atau dugaan pinjol/investasi ilegal.",
        "is_national": 1,
    },
    {
        "name": "BICARA Bank Indonesia 131",
        "category": "sistem_pembayaran",
        "case_types": "rekening_penipuan,umum",
        "description": "Rujukan informasi dan pengaduan terkait sistem pembayaran, QRIS, uang elektronik, dan kebijakan Bank Indonesia.",
        "address": "Layanan nasional Bank Indonesia",
        "phone": "131",
        "website": "https://www.bi.go.id/id/kontak.aspx",
        "latitude": -6.1821,
        "longitude": 106.8216,
        "action": "Gunakan untuk masalah sistem pembayaran atau kanal informasi Bank Indonesia.",
        "is_national": 1,
    },
    {
        "name": "LAPS SJK",
        "category": "sengketa_keuangan",
        "case_types": "pinjaman_online,rekening_penipuan,umum",
        "description": "Rujukan penyelesaian sengketa sektor jasa keuangan apabila pengguna sudah berhubungan dengan pelaku usaha jasa keuangan.",
        "address": "Jakarta",
        "phone": None,
        "website": "https://lapssjk.id",
        "latitude": -6.2088,
        "longitude": 106.8456,
        "action": "Gunakan setelah bukti komunikasi dan dokumen transaksi disiapkan.",
        "is_national": 1,
    },
    {
        "name": "LPSK",
        "category": "perlindungan_saksi_korban",
        "case_types": "kekerasan_digital,umum",
        "description": "Rujukan untuk perlindungan saksi dan korban pada kasus yang berdampak pada keamanan, intimidasi, atau ancaman serius.",
        "address": "Jakarta Timur",
        "phone": None,
        "website": "https://lpsk.go.id",
        "latitude": -6.2250,
        "longitude": 106.9004,
        "action": "Gunakan bila korban menghadapi ancaman, pemerasan, atau risiko keselamatan yang perlu pendampingan.",
        "is_national": 1,
    },
    {
        "name": "Komnas Perempuan",
        "category": "pendampingan_korban",
        "case_types": "kekerasan_digital,umum",
        "description": "Rujukan untuk kekerasan berbasis gender, termasuk kekerasan digital, ancaman penyebaran konten intim, dan pemerasan seksual.",
        "address": "Jakarta Pusat",
        "phone": None,
        "website": "https://komnasperempuan.go.id",
        "latitude": -6.1865,
        "longitude": 106.8341,
        "action": "Gunakan bila kasus menyangkut kekerasan berbasis gender atau korban membutuhkan pendampingan aman.",
        "is_national": 1,
    },
    {
        "name": "SAFEnet",
        "category": "hak_digital",
        "case_types": "kekerasan_digital,akun_diretas,hoaks,umum",
        "description": "Rujukan masyarakat sipil untuk isu hak digital, keamanan digital, dan pendampingan kasus kekerasan/serangan digital.",
        "address": "Layanan daring nasional",
        "phone": None,
        "website": "https://safenet.or.id",
        "latitude": -6.2088,
        "longitude": 106.8456,
        "action": "Gunakan bila kasus membutuhkan perspektif keamanan digital dan pendampingan non-kepolisian.",
        "is_national": 1,
    },
    {
        "name": "LBH APIK Jakarta",
        "category": "bantuan_hukum",
        "case_types": "kekerasan_digital,umum",
        "description": "Rujukan bantuan hukum bagi perempuan dan kelompok rentan, termasuk kekerasan berbasis gender online.",
        "address": "Jakarta Timur",
        "phone": None,
        "website": "https://lbhapik.or.id",
        "latitude": -6.2250,
        "longitude": 106.9004,
        "action": "Gunakan untuk meminta informasi bantuan hukum atau pendampingan korban.",
        "is_national": 1,
    },
    {
        "name": "YLBHI",
        "category": "bantuan_hukum",
        "case_types": "kekerasan_digital,rekening_penipuan,akun_diretas,umum",
        "description": "Rujukan jaringan bantuan hukum. Cocok ketika kasus membutuhkan analisis hukum atau pendampingan lanjutan.",
        "address": "Jakarta Pusat",
        "phone": None,
        "website": "https://ylbhi.or.id",
        "latitude": -6.1865,
        "longitude": 106.8341,
        "action": "Gunakan bila pengguna membutuhkan rujukan bantuan hukum dan pendampingan kasus.",
        "is_national": 1,
    },
    {
        "name": "SP4N LAPOR",
        "category": "layanan_publik",
        "case_types": "umum,hoaks,pinjaman_online,rekening_penipuan",
        "description": "Kanal aspirasi dan pengaduan layanan publik nasional. Relevan untuk persoalan layanan publik atau tindak lanjut administratif.",
        "address": "Layanan daring nasional",
        "phone": None,
        "website": "https://www.lapor.go.id",
        "latitude": -6.1754,
        "longitude": 106.8272,
        "action": "Gunakan untuk masalah layanan publik, bukan untuk keadaan darurat.",
        "is_national": 1,
    },
    {
        "name": "Polda Metro Jaya",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah DKI Jakarta dan sekitarnya. Verifikasi kanal resmi sebelum datang.",
        "address": "Jakarta Selatan",
        "phone": None,
        "website": None,
        "latitude": -6.2297,
        "longitude": 106.8018,
        "action": "Datang ke SPKT atau kanal resmi setempat dengan membawa bukti digital dan kronologi.",
        "is_national": 0,
    },
    {
        "name": "Polda Jawa Barat",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah Jawa Barat. Verifikasi alamat dan jam layanan terlebih dahulu.",
        "address": "Bandung, Jawa Barat",
        "phone": None,
        "website": None,
        "latitude": -6.9175,
        "longitude": 107.6191,
        "action": "Gunakan untuk bantuan kepolisian wilayah Jawa Barat.",
        "is_national": 0,
    },
    {
        "name": "Polda Jawa Tengah",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah Jawa Tengah. Verifikasi kanal resmi sebelum berkunjung.",
        "address": "Semarang, Jawa Tengah",
        "phone": None,
        "website": None,
        "latitude": -6.9667,
        "longitude": 110.4167,
        "action": "Gunakan untuk bantuan kepolisian wilayah Jawa Tengah.",
        "is_national": 0,
    },
    {
        "name": "Polda DI Yogyakarta",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah DI Yogyakarta. Verifikasi kanal resmi dan jam layanan terlebih dahulu.",
        "address": "Sleman, DI Yogyakarta",
        "phone": None,
        "website": None,
        "latitude": -7.7956,
        "longitude": 110.3695,
        "action": "Gunakan untuk bantuan kepolisian wilayah DI Yogyakarta.",
        "is_national": 0,
    },
    {
        "name": "Polda Jawa Timur",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah Jawa Timur. Verifikasi kanal resmi sebelum berkunjung.",
        "address": "Surabaya, Jawa Timur",
        "phone": None,
        "website": None,
        "latitude": -7.2575,
        "longitude": 112.7521,
        "action": "Gunakan untuk bantuan kepolisian wilayah Jawa Timur.",
        "is_national": 0,
    },
    {
        "name": "Polda Bali",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah Bali. Verifikasi kanal resmi sebelum datang.",
        "address": "Denpasar, Bali",
        "phone": None,
        "website": None,
        "latitude": -8.6705,
        "longitude": 115.2126,
        "action": "Gunakan untuk bantuan kepolisian wilayah Bali.",
        "is_national": 0,
    },
    {
        "name": "Polda Sumatera Utara",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian wilayah Sumatera Utara. Cocok untuk pengguna di Medan, Toba, dan sekitarnya.",
        "address": "Medan, Sumatera Utara",
        "phone": None,
        "website": None,
        "latitude": 3.5952,
        "longitude": 98.6722,
        "action": "Gunakan untuk bantuan kepolisian wilayah Sumatera Utara.",
        "is_national": 0,
    },
    {
        "name": "Polres Toba",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian lokal untuk wilayah Toba dan sekitarnya. Verifikasi alamat/jam layanan sebelum datang.",
        "address": "Balige, Kabupaten Toba, Sumatera Utara",
        "phone": None,
        "website": None,
        "latitude": 2.3334,
        "longitude": 99.0616,
        "action": "Datang atau hubungi kanal resmi kepolisian setempat dengan membawa bukti digital.",
        "is_national": 0,
    },
    {
        "name": "Polsek Laguboti",
        "category": "kepolisian_lokal",
        "case_types": "phishing,rekening_penipuan,akun_diretas,kekerasan_digital,malware,umum",
        "description": "Rujukan kepolisian terdekat untuk area Laguboti. Verifikasi alamat/jam layanan sebelum datang.",
        "address": "Laguboti, Kabupaten Toba, Sumatera Utara",
        "phone": None,
        "website": None,
        "latitude": 2.3537,
        "longitude": 99.1396,
        "action": "Bawa identitas, kronologi singkat, dan bukti digital bila membutuhkan bantuan langsung.",
        "is_national": 0,
    },
]
GOOGLE_TYPES_BY_CASE = {
    "phishing": ["police"],
    "rekening_penipuan": ["police", "bank"],
    "akun_diretas": ["police"],
    "pinjaman_online": ["police", "bank"],
    "kekerasan_digital": ["police", "local_government_office"],
    "malware": ["police"],
    "hoaks": ["police", "local_government_office"],
    "umum": ["police"],
}


def seed_service_directory(db: Session) -> None:
    for item in SERVICE_SEEDS:
        existing = db.scalar(select(ServiceDirectory).where(ServiceDirectory.name == item["name"]))
        if existing:
            continue
        db.add(ServiceDirectory(**item))
    db.commit()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def service_matches_case(row: ServiceDirectory, case_type: str) -> bool:
    case_types = [part.strip() for part in row.case_types.split(",")]
    return case_type in case_types or "umum" in case_types


def database_services(db: Session, case_type: str, lat: float | None, lon: float | None) -> list[ServiceItem]:
    rows = db.scalars(select(ServiceDirectory)).all()
    items: list[ServiceItem] = []
    for row in rows:
        if not service_matches_case(row, case_type):
            continue
        distance = None
        if lat is not None and lon is not None and row.latitude is not None and row.longitude is not None:
            distance = round(haversine_km(lat, lon, row.latitude, row.longitude), 2)
        items.append(
            ServiceItem(
                id=row.id,
                name=row.name,
                category=row.category,
                description=row.description,
                address=row.address,
                phone=row.phone,
                website=row.website,
                latitude=row.latitude,
                longitude=row.longitude,
                distance_km=distance,
                source="database",
                action=row.action,
            )
        )
    items.sort(key=lambda item: (item.distance_km is None, item.distance_km or 999999, item.name))
    return items


def google_nearby_services(case_type: str, lat: float | None, lon: float | None, radius_meters: int) -> list[ServiceItem]:
    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
    if not api_key or lat is None or lon is None:
        return []

    included_types = GOOGLE_TYPES_BY_CASE.get(case_type, GOOGLE_TYPES_BY_CASE["umum"])
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.nationalPhoneNumber,places.websiteUri,places.types",
    }
    body = {
        "includedTypes": included_types,
        "maxResultCount": 10,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lon},
                "radius": radius_meters,
            }
        },
    }

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(url, headers=headers, json=body)
            if response.status_code >= 400:
                return []
            places = response.json().get("places") or []
    except httpx.RequestError:
        return []

    items: list[ServiceItem] = []
    for place in places:
        location = place.get("location") or {}
        plat = location.get("latitude")
        plon = location.get("longitude")
        display = place.get("displayName") or {}
        name = display.get("text") or "Layanan terdekat"
        distance = None
        if isinstance(plat, (int, float)) and isinstance(plon, (int, float)):
            distance = round(haversine_km(lat, lon, float(plat), float(plon)), 2)
        items.append(
            ServiceItem(
                id=place.get("id") or name,
                name=name,
                category="layanan_terdekat",
                description="Hasil pencarian layanan terdekat berdasarkan lokasi pengguna dan kategori kasus.",
                address=place.get("formattedAddress"),
                phone=place.get("nationalPhoneNumber"),
                website=place.get("websiteUri") or place.get("googleMapsUri"),
                latitude=plat,
                longitude=plon,
                distance_km=distance,
                source="location_search",
                action="Hubungi/kunjungi setelah memverifikasi jam layanan dan relevansi kasus.",
            )
        )
    items.sort(key=lambda item: (item.distance_km is None, item.distance_km or 999999, item.name))
    return items


def find_nearest_services(db: Session, case_type: str, lat: float | None, lon: float | None, radius_meters: int) -> NearestServicesResponse:
    configured_radius = int(os.getenv("GOOGLE_PLACES_RADIUS_METERS", str(radius_meters)) or radius_meters)
    radius = min(max(radius_meters, 1000), configured_radius if configured_radius > 0 else radius_meters)
    google_items = google_nearby_services(case_type, lat, lon, radius)
    db_items = database_services(db, case_type, lat, lon)

    # Kombinasikan hasil lokasi dan direktori. Semua item diurutkan berdasarkan jarak bila lokasi tersedia.
    combined = google_items[:8] + db_items[:14]
    seen: set[str] = set()
    unique: list[ServiceItem] = []
    for item in combined:
        key = f"{item.source}:{item.name.lower()}:{item.address or ''}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)

    unique.sort(key=lambda item: (item.distance_km is None, item.distance_km or 999999, 0 if item.source != "database" else 1, item.name))
    sources = sorted({item.source for item in unique})
    note = (
        "Hasil diurutkan dari layanan terdekat bila lokasi pengguna tersedia. Platform ini tidak menerima laporan resmi; "
        "platform hanya membantu pengguna memilih kanal bantuan yang relevan dan perlu diverifikasi kembali."
    )
    if not google_items and lat is not None and lon is not None:
        note += " Jika hasil lokasi masih terbatas, sistem tetap menampilkan rujukan nasional dan direktori bantuan yang tersedia."

    return NearestServicesResponse(
        services=unique,
        location_used=lat is not None and lon is not None,
        sources=sources,
        note=note,
    )
