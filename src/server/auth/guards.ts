import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

interface OwnerSession {
  id: string;
  email: string;
  name: string;
  role: "OWNER";
}

/**
 * Server-side guard: ensures the current user is an authenticated OWNER.
 * Call this at the top of any admin Server Component or Server Action.
 *
 * Redirects to /admin/login if unauthenticated.
 * Throws if authenticated but not OWNER role (should never happen in V1).
 */
export async function requireOwner(): Promise<OwnerSession> {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const user = session.user as { id?: string; email?: string; name?: string; role?: string };

  if (user.role !== "OWNER") {
    throw new Error("Forbidden: OWNER role required");
  }

  return {
    id: user.id ?? "",
    email: user.email ?? "",
    name: user.name ?? "",
    role: "OWNER",
  };
}
