import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }

) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorize",
        },
        { status: 401 },
      );
    }

    const { fileId } = await params;
    if (!fileId) {
      return NextResponse.json(
        {
          error: "File Id is required",
        },
        { status: 401 },
      );
    }

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.user_id, userId)));

    if (!file) {
      return NextResponse.json(
        {
          error: "File is not found",
        },
        { status: 404 },
      );
    }

    const updatedFiles = await db
      .update(files)
      .set({ isStarred: !file.isStarred })
      .where(and(eq(files.id, fileId), eq(files.user_id, userId)))
      .returning();

    console.log("Updated File with stared status", updatedFiles);
    const updateFile = updatedFiles[0];
    return NextResponse.json(updateFile);
  } catch (error) {
    return NextResponse.json(
      {
        error: "There is an Error in toggle the status of Star",
      },
      { status: 500 },
    );
  }
}
