"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useMemo, useState } from "react";

type ServiceItem = {
  id: number | string;
  name: string;
  category: string;
  description: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  source: string;
  action: string;
};

type ServiceResponse = {
  services: ServiceItem[];
  location_used: boolean;
  sources: string[];
  note: string;
};

const caseTypes = [
  { value: "phishing", label: "Phishing / tautan palsu" },
  { value: "rekening_penipuan", label: "Rekening atau e-wallet penipuan" },
  { value: "akun_diretas", label: "Akun diretas / diambil alih" },
  { value: "pinjaman_online", label: "Pinjaman online / jasa keuangan" },
  { value: "kekerasan_digital", label: "Ancaman, pemerasan, atau kekerasan digital" },
  { value: "malware", label: "APK/file mencurigakan" },
  { value: "hoaks", label: "Hoaks atau misinformasi" },
  { value: "umum", label: "Kasus umum" }
];

function requestLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
    );
  });
}

function sourceLabel(source: string) {
  if (source === "location_search") return "Pencarian lokasi";
  if (source === "google_places") return "Pencarian lokasi";
  if (source === "database") return "Direktori bantuan";
  return "Rujukan";
}

function mapsUrl(item: ServiceItem) {
  if (typeof item.latitude === "number" && typeof item.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.address || "Indonesia"}`)}`;
}

function openStreetMapEmbed(lat: number, lon: number) {
  const delta = 0.04;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function ReportPage() {
  const [caseType, setCaseType] = useState("phishing");
  const [useLocation, setUseLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ServiceResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedMap, setSelectedMap] = useState<ServiceItem | null>(null);

  async function findServices() {
    setLoading(true);
    setError("");
    setResult(null);
    setSelectedMap(null);

    const location = useLocation ? await requestLocation() : null;
    setUserLocation(location);
    const response = await fetch("/api/services/nearest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_type: caseType,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        radius_meters: 25000
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Pencarian layanan gagal.");
    } else {
      setResult(data);
      const firstWithLocation = data.services?.find((item: ServiceItem) => typeof item.latitude === "number" && typeof item.longitude === "number") || null;
      setSelectedMap(firstWithLocation);
    }
    setLoading(false);
  }

  const mapTarget = selectedMap || result?.services.find((item) => typeof item.latitude === "number" && typeof item.longitude === "number") || null;
  const mapSrc = useMemo(() => {
    if (mapTarget && typeof mapTarget.latitude === "number" && typeof mapTarget.longitude === "number") {
      return openStreetMapEmbed(mapTarget.latitude, mapTarget.longitude);
    }
    if (userLocation) return openStreetMapEmbed(userLocation.latitude, userLocation.longitude);
    return "";
  }, [mapTarget, userLocation]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Rujukan Bantuan"
        title="Temukan layanan yang paling relevan dan paling dekat."
        description="Platform ini tidak menerima laporan resmi. Pilih jenis masalah, aktifkan lokasi bila diperlukan, lalu sistem akan menampilkan kanal bantuan, lembaga, atau layanan yang dapat Anda hubungi."
      />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white">Jenis masalah</span>
            <select className="input-field" value={caseType} onChange={(event) => setCaseType(event.target.value)}>
              {caseTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={useLocation}
              onChange={(event) => setUseLocation(event.target.checked)}
              className="mt-1"
            />
            <span>
              Gunakan lokasi browser agar hasil dapat diurutkan dari yang terdekat. Bila tidak diaktifkan, sistem tetap menampilkan rujukan nasional dan direktori bantuan.
            </span>
          </label>

          {error && <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{error}</div>}

          <button onClick={findServices} disabled={loading} className="primary-button mt-5 w-full">
            {loading ? "Mencari rujukan..." : "Cari Rujukan Bantuan"}
          </button>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <p className="font-bold text-white">Batas fungsi platform</p>
            <p className="mt-2">
              Web ini hanya memberi arahan awal. Pengguna tetap perlu menghubungi kanal resmi yang ditampilkan dan memverifikasi jam layanan, alamat, serta persyaratan dokumen.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Peta Rujukan</p>
                <h2 className="mt-2 text-2xl font-black text-white">Lokasi layanan</h2>
              </div>
              {mapTarget && <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{mapTarget.name}</span>}
            </div>
            {mapSrc ? (
              <iframe
                title="Peta layanan bantuan"
                src={mapSrc}
                className="mt-5 h-72 w-full rounded-2xl border border-white/10"
                loading="lazy"
              />
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-400">
                Peta akan muncul setelah Anda melakukan pencarian dan hasil memiliki koordinat layanan.
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">Daftar Layanan</p>
                <h2 className="mt-2 text-2xl font-black text-white">Diurutkan dari yang paling dekat</h2>
              </div>
              {result && (
                <span className="rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  {result.services.length} hasil
                </span>
              )}
            </div>

            {result?.note && <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">{result.note}</p>}

            <div className="mt-5 space-y-4">
              {!result && <p className="text-sm leading-6 text-slate-400">Pilih jenis masalah, lalu klik tombol pencarian.</p>}
              {result?.services.map((item) => (
                <div key={`${item.source}-${item.id}`} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-100/50">{sourceLabel(item.source)}</p>
                    </div>
                    {typeof item.distance_km === "number" && (
                      <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{item.distance_km} km</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                  {item.address && <p className="mt-3 text-sm leading-6 text-slate-400">Alamat: {item.address}</p>}
                  {item.phone && <p className="mt-1 text-sm leading-6 text-slate-400">Telepon: {item.phone}</p>}
                  <p className="mt-3 rounded-2xl bg-slate-950/35 p-3 text-sm leading-6 text-slate-300">{item.action}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {item.website && (
                      <a className="secondary-button px-5 py-2 text-sm" href={item.website} target="_blank" rel="noreferrer">
                        Buka kanal
                      </a>
                    )}
                    <a className="secondary-button px-5 py-2 text-sm" href={mapsUrl(item)} target="_blank" rel="noreferrer">
                      Buka Maps
                    </a>
                    {typeof item.latitude === "number" && typeof item.longitude === "number" && (
                      <button onClick={() => setSelectedMap(item)} className="secondary-button px-5 py-2 text-sm">
                        Tampilkan di peta
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
