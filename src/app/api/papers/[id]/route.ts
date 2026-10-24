import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { papers, analyses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paperId = parseInt(id);

  const [paper] = await db.select().from(papers).where(eq(papers.id, paperId));
  if (!paper) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }

  const paperAnalyses = await db.select().from(analyses).where(eq(analyses.paperId, paperId)).orderBy(desc(analyses.createdAt));

  return NextResponse.json({ paper, analyses: paperAnalyses });
}
