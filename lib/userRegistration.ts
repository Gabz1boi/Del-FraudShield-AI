import { callPythonBackend } from "@/lib/backendClient";

export type RegisteredUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  is_new: boolean;
};

export async function registerOrGetUser(name: string, email: string): Promise<RegisteredUser> {
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedName.length < 3) {
    throw new Error("Nama pengguna minimal 3 karakter.");
  }

  if (!normalizedEmail.includes("@")) {
    throw new Error("Format email belum valid.");
  }

  return callPythonBackend<RegisteredUser>("/users/register", {
    method: "POST",
    body: JSON.stringify({
      name: normalizedName,
      email: normalizedEmail
    })
  });
}