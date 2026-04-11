import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";

const ImageKitObj = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT || "",
});

export async function GET() {
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

    const authParams = ImageKitObj.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "There is an Error to generate authentication params for Imagekit",
      },
      { status: 500 },
    );
  }
}
