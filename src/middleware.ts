import { NextRequest, NextResponse } from "next/server";

const routeRegex =
  /^\/(?!_next\/|favicon\.ico|.*\.(css|js|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|otf|eot|ico|mp4|mp3|json|txt|xml|sw)).*$/;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  console.log("middleware");
  if (routeRegex.test(url.pathname)) {
    console.log("Page route:", url.pathname);

    const response = NextResponse.next();
    response.headers.set("x-page-url", url.pathname);

    return response;
  }

  return NextResponse.next();
}
