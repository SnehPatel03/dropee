import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
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
    const deletedFiles = await db
      .delete(files)
      .where(and(eq(files.user_id, userId), eq(files.isTrash, true)))
      .returning();

    if (!deletedFiles) {
      return NextResponse.json(
        {
          error: "Error to delete file, Try Again!",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      message: "Trash emptied successfully",
      deletedCount: deletedFiles.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "There is an Error to delete the Trash",
      },
      { status: 500 },
    );
  }
}
