import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export type AuthenticatedSession = Session & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: Role;
    workspaceId: string;
  };
};

export async function getSession(): Promise<AuthenticatedSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.workspaceId || !session.user.role) {
    return null;
  }
  return session as AuthenticatedSession;
}

export async function requireAuth(): Promise<
  AuthenticatedSession | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireRole(
  allowedRoles: Role[]
): Promise<AuthenticatedSession | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) {
    return result;
  }
  if (!allowedRoles.includes(result.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

/**
 * Returns a Prisma `where` clause scoped to the authenticated user's workspace.
 * Use this on every tenant-bound query to enforce strict multi-tenant isolation.
 */
export function workspaceWhere<T extends Record<string, unknown>>(
  session: AuthenticatedSession,
  extra?: T
): T & { workspaceId: string } {
  return {
    ...extra,
    workspaceId: session.user.workspaceId,
  } as T & { workspaceId: string };
}

/**
 * Validates that a resource belongs to the user's workspace before updates/deletes.
 */
export function assertSameWorkspace(
  session: AuthenticatedSession,
  resourceWorkspaceId: string
): boolean {
  return session.user.workspaceId === resourceWorkspaceId;
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
