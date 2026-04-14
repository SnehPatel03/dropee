import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get("userId");
    const parentId = searchParams.get("parent_id");

    // extra validation (your style, but safer message)
    if (!queryUserId || queryUserId !== userId) {
      return NextResponse.json(
        { error: "Invalid user access" },
        { status: 401 }
      );
    }

    let UserFiles;

    if (parentId) {
      UserFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.user_id, userId),
            eq(files.parent_id, parentId)
          )
        );
    } else {
      UserFiles = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.user_id, userId),
            isNull(files.parent_id)
          )
        );
    }

    return NextResponse.json({ UserFiles });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching files" },
      { status: 500 }
    );
  }
}