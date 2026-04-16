import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const imageKit = new ImageKit({
      publicKey: process.env.IMAGE_KIT_PUBLIC_KEY || "",
      privateKey: process.env.IMAGE_KIT_PRIVATE_KEY || "",
      urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT || "",
    });

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
        { status: 404 },
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
        { status: 401 },
      );
    }
    if (!file.isFolder && file.imagekit_file_id) {
      try {
        await imageKit.deleteFile(file.imagekit_file_id);
      } catch (error) {
        console.log(
          "There is error in deleteing File from Imagekit storage",
        );
      }
    }

    await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.user_id, userId)));

    return NextResponse.json({
      message: "File permanently deleted",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "There is an Error to Delete the the File from DB.",
      },
      { status: 500 },
    );
  }
}
