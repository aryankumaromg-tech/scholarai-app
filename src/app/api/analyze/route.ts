import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyses, papers } from "@/db/schema";
import { generateAnalysis } from "@/lib/ai-analysis";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const paperId = Number.parseInt(String(body?.paperId ?? ""), 10);

  if (!Number.isFinite(paperId)) {
    return NextResponse.json({ error: "A valid paperId is required." }, { status: 400 });
  }

  const [paper] = await db.select().from(papers).where(eq(papers.id, paperId));
  if (!paper) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  }

  const analysis = generateAnalysis({
    title: paper.title,
    abstract: paper.abstract,
    content: paper.content,
    authors: paper.authors,
    year: paper.year,
  });

  const [newAnalysis] = await db
    .insert(analyses)
    .values({
      paperId: paper.id,
      tldr: analysis.tldr,
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      methodology: analysis.methodology,
      contributions: analysis.contributions,
      limitations: analysis.limitations,
      recommendations: analysis.recommendations,
      citations: analysis.citations,
      domain: analysis.domain,
      topics: analysis.topics,
      difficulty: analysis.difficulty,
      readingMinutes: analysis.readingMinutes,
      mathScore: analysis.mathScore,
      mathJson: analysis.math,
      aiModel: "scholar-analyzer-v2",
    })
    .returning();

  return NextResponse.json({ analysis: newAnalysis });
}
