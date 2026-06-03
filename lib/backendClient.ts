export const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

function readableBackendError(status: number, text: string) {
  if (!text) return `Layanan inti mengembalikan status ${status}.`;
  try {
    const payload = JSON.parse(text) as { detail?: string; message?: string };
    return payload.detail || payload.message || text;
  } catch {
    return text;
  }
}

export async function callPythonBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PYTHON_BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(readableBackendError(response.status, text));
  }

  return response.json() as Promise<T>;
}
