import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { sum, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      totalUsed: sum(files.size),
    })
    .from(files)
    .where(eq(files.user_id, userId));

  const usedBytes = Number(result[0]?.totalUsed ?? 0);
  const limitBytes = 5 * 1024 * 1024 * 1024; // 5GB

  // 🔥 helper inside backend
  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);

    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  return NextResponse.json({
    used: usedBytes,
    limit: limitBytes,
    remaining: limitBytes - usedBytes,

    usedFormatted: formatBytes(usedBytes),
    limitFormatted: formatBytes(limitBytes),
    remainingFormatted: formatBytes(limitBytes - usedBytes),

    percent: limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0,
  });
}
