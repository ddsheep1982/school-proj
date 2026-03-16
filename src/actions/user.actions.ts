"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { hash } from "bcryptjs";
import {
  CreateUserSchema,
  UpdateUserSchema,
  type ActionResult,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/types/index";
import type { User } from "@/generated/prisma/client";

export type SafeUser = Omit<User, "hashedPassword">;

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<SafeUser>> {
  try {
    const admin = await requireRole("ADMIN");
    const parsed = CreateUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { success: false, error: "该邮箱已存在" };

    const hashedPassword = await hash(parsed.data.password, 12);
    const { password: _, ...rest } = parsed.data;
    const user = await prisma.user.create({
      data: { ...rest, hashedPassword },
      omit: { hashedPassword: true },
    });

    await writeAuditLog(admin.id, "CREATE", "User", user.id, { after: user });
    return { success: true, data: user };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<ActionResult<SafeUser>> {
  try {
    const admin = await requireRole("ADMIN");
    const parsed = UpdateUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "输入数据无效",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return { success: false, error: "用户不存在" };

    const { password, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (password) {
      data.hashedPassword = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      omit: { hashedPassword: true },
    });

    await writeAuditLog(admin.id, "UPDATE", "User", id, { before: { ...before, hashedPassword: "[redacted]" }, after: user });
    return { success: true, data: user };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getUsers(): Promise<SafeUser[]> {
  await requireRole("ADMIN");
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    omit: { hashedPassword: true },
  });
}
