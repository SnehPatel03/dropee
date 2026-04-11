import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import {  NextResponse } from "next/server";


const isPublicRoutes = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const user = auth();  
  const userId = (await user).userId;
  const url = new URL(req.url);

  if (userId && isPublicRoutes(req) && url.pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard",req.url));
  }

  if (!isPublicRoutes(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
