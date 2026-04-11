import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
    const { imagekit, userId: BodyUserId } = body;
    if (BodyUserId !== userId) {
      return NextResponse.json(
        {
          error: "Unauthorize",
        },
        { status: 401 },
      );
    }
    if (!imagekit || !imagekit.url) {
      return NextResponse.json(
        {
          error: "Invalid File Upload data",
        },
        { status: 401 },
      );
    }

    console.log("Image kit obj", imagekit);
    const filedata = {
      name: imagekit.name || "untitled",
      path: imagekit.path || `/dropee/${userId}/${imagekit.name}`,
      user_id: userId,
      type: imagekit.type || "image",
      thumbnailUrl: imagekit.thumbnailurl || null,
      parent_id: null,
      fileUrl: imagekit.url,
      size: imagekit.size || 0,
      isFolder: false,
      isStarred: false,
      isTrash: false,
    };

    const [newFiles] = await db.insert(files).values(filedata).returning();
    return NextResponse.json(newFiles);
  } catch (error) {
    return NextResponse.json(
      {
        error: "failed to save the info to database",
      },
      { status: 500 },
    );
  }
}
