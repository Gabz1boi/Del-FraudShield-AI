import { promises as fs } from "fs";
import path from "path";

export type RegisteredUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  is_new: boolean;
};

type StoredUser = Omit<RegisteredUser, "is_new"> & {
  normalized_name: string;
  created_at: string;
  updated_at: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function roleForEmail(email: string): "user" | "admin" {
  const admins = (process.env.ADMIN_EMAILS || "admin@fraudshield.local")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(normalizeEmail(email)) ? "admin" : "user";
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]\n", "utf8");
  }
}

async function readUsers(): Promise<StoredUser[]> {
  await ensureStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");

  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await fs.writeFile(USERS_FILE, "[]\n", "utf8");
    return [];
  }
}

async function writeUsers(users: StoredUser[]) {
  await ensureStore();
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

export async function registerOrGetUser(name: string, email: string): Promise<RegisteredUser> {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanEmail = normalizeEmail(email);
  const normalizedName = normalizeName(cleanName);

  if (cleanName.length < 3) {
    throw new Error("Nama pengguna minimal 3 karakter.");
  }

  if (!cleanEmail.includes("@")) {
    throw new Error("Format email belum valid.");
  }

  const users = await readUsers();
  const existingByEmail = users.find((user) => normalizeEmail(user.email) === cleanEmail);
  const existingByName = users.find((user) => user.normalized_name === normalizedName);

  if (existingByEmail) {
    if (existingByEmail.normalized_name !== normalizedName) {
      throw new Error(
        `Email ini sudah terdaftar dengan nama pengguna "${existingByEmail.name}". Gunakan nama tersebut agar riwayat akun tidak terpisah.`
      );
    }

    const refreshedUser: StoredUser = {
      ...existingByEmail,
      role: roleForEmail(cleanEmail),
      updated_at: new Date().toISOString()
    };

    const nextUsers = users.map((user) => (user.id === existingByEmail.id ? refreshedUser : user));
    await writeUsers(nextUsers);

    return {
      id: refreshedUser.id,
      name: refreshedUser.name,
      email: refreshedUser.email,
      role: refreshedUser.role,
      is_new: false
    };
  }

  if (existingByName) {
    throw new Error("Nama pengguna sudah digunakan oleh akun lain. Pilih nama pengguna yang berbeda.");
  }

  const nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: nextId,
    name: cleanName,
    email: cleanEmail,
    role: roleForEmail(cleanEmail),
    normalized_name: normalizedName,
    created_at: now,
    updated_at: now
  };

  await writeUsers([...users, user]);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_new: true
  };
}
