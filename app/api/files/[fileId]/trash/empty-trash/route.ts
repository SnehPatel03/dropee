import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse, NextRequest } from "next/server";


 const imageKit = new ImageKit({
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT || "",
  });
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
    const trashFiles = await db
      .select().from(files)
      .where(and(eq(files.user_id, userId),
       eq(files.isTrash, true))
      )

    await Promise.all(trashFiles.map((file) => {
      if(file.imagekit_file_id){
        imageKit.deleteFile(file.imagekit_file_id)
      }
      if(!file.imagekit_file_id){
        console.log("File is not present in the ImageKit")
      }
    }))

    if (!trashFiles) {
      return NextResponse.json(
        {
          error: "Trash Files not found",
        },
        { status: 401 },
      );
    }
      const deletedFiles = await db
      .delete(files)
      .where(and(eq(files.user_id, userId), eq(files.isTrash, true))).returning()

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
