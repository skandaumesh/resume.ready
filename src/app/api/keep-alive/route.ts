import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Ping Supabase DB via Prisma to prevent database sleeping
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Keep alive is working",
      database: "connected",
      time: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      message: "Keep alive API responded (DB connection ping failed)",
      error: error instanceof Error ? error.message : "DB error",
      time: new Date().toISOString(),
    });
  }
}
