import { NextResponse, type NextRequest } from "next/server";

function isLocalHost(hostname: string | null) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;

  if (!isLocalHost(hostname)) {
    return new NextResponse("Mission Control is localhost-only.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
