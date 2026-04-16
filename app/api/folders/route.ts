import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      // userId: BodyUserId,
      parent_id = null,
    } = body;

    if (!name || name.trim() === "" || typeof name !== "string") {
      return NextResponse.json(
        {
          error: "Proper Folder Name is Required",
        },
        { status: 400 },
      );
    }

    if (parent_id) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parent_id),
            eq(files.user_id, userId),
            eq(files.isFolder, true),
          ),
        );

      if (!parentFolder) {
        return NextResponse.json(
          {
            error: "Parent Folder not found!",
          },
          { status: 401 },
        );
      }
    }

    const folderData = {
      id: uuidv4(),
      imagekit_file_id: uuidv4(),
      name: name.trim(),
      path: `/folder/${userId}/${uuidv4()}`,
      size: 0,
      type: "folder",
      fileUrl: "",
      thumbnailUrl: null,
      user_id: userId,
      parent_id: parent_id,
      isFolder: true,
      isStarred: false,
      isTrash: false,
    };

    const [newFolder] = await db.insert(files).values(folderData).returning();

    return NextResponse.json({
      success: true,
      status: 200,
      folder: newFolder,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "There is an Error to upload Folder, Can't upload the folder!",
      },
      { status: 401 },
    );
  }
}
