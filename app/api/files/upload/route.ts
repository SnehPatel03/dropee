import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { v4 as uuidv4 } from "uuid";
import { files } from "@/lib/db/schema";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT || "",
});

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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userFormUserId = formData.get("user_id") as string;
    const parent_id = (formData.get("parent_id") as string) || null;

    if (userFormUserId !== userId) {
      return NextResponse.json(
        {
          error: "Unauthorize",
        },
        { status: 401 },
      );
    }

    if (!file) {
      return NextResponse.json(
        {
          error: "File is not provided.",
        },
        { status: 401 },
      );
    }
    if (parent_id) {
      const [parentFolderData] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parent_id),
            eq(files.isFolder, true),
            eq(files.user_id, userId),
          ),
        );
      if (!parentFolderData) {
        return NextResponse.json(
          {
            error: "Unexpected Parent Folder Data.",
          },
          { status: 401 },
        );
      }
    }
    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("application/pdf")
    ) {
      return NextResponse.json(
        {
          error: "This Application only supports Images and Pdfs to be upload.",
        },
        { status: 401 },
      );
    }
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);
    const folderPath = parent_id
      ? `/dropee/${userId}/folder/${parent_id}`
      : `/dropee/${userId}/`;

    const OriginalExtension = file.name.split(".").pop() || "";

    if (OriginalExtension === "") {
      return NextResponse.json(
        {
          error: "Can't Extrect the Extension of file",
        },
        {
          status: 401,
        },
      );
    }
    const uniqueFileName = `${uuidv4()}.${OriginalExtension}`;
    const uploadRes = await imageKit.upload({
      file: fileBuffer,
      fileName: uniqueFileName,
      folder: folderPath,
      useUniqueFileName: false,
    });

    const fileData = {
      name: file.name,
      path: uploadRes.filePath,
      size: file.size,
      type: file.type,
      fileUrl: uploadRes.url,
      thumbnailUrl: uploadRes.thumbnailUrl,
      user_id: userId,
      parent_id: parent_id,
      isFolder: false,
      isStared: false,
      isTrash: false,
    };

    const [newFile] = await db.insert(files).values(fileData).returning();

    return NextResponse.json(newFile);
  } catch (error) {
    return NextResponse.json(
      {
        error: "There is an Error in Uploading files",
      },
      { status: 500 },
    );
  }
}
