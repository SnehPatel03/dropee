import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fileId, folderId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    // optional: allow moving to root
    const targetFolder = folderId || null;

    const [updatedFile] = await db
      .update(files)
      .set({
        parent_id: targetFolder,
      })
      .where(
        and(
          eq(files.id, fileId),
          eq(files.user_id, userId),
          eq(files.isFolder, false) // only files, not folders
        )
      )
      .returning();

    if (!updatedFile) {
      return NextResponse.json(
        { error: "File not found or not allowed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      file: updatedFile,
    });
  } catch (error) {
    console.error("MOVE FILE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to move file",
      },
      { status: 500 }
    );
  }
}