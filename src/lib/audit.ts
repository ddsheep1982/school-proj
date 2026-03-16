import { prisma } from "@/lib/prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function writeAuditLog(
  userId: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  changes?: { before?: unknown; after?: unknown }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changesJson = changes ? (changes as any) : null;
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes: changesJson,
    },
  });
}
