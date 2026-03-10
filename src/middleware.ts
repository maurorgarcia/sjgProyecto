import { NextResponse, type NextRequest } from "next/server";

// Auth handled client-side — middleware solo bloquea rutas de API sin token
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
