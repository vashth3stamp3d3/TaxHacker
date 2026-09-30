import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"

export async function writeAuditLog(input: {
  organizationId: string
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  data?: Record<string, unknown>
}) {
  await prisma.auditLog
    .create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        data: input.data as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(() => null)
}
