import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { papers, analyses } from "@/db/schema";
import { generateAnalysis } from "@/lib/ai-analysis";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const allPapers = await db.select().from(papers).orderBy(desc(papers.createdAt));
  return NextResponse.json({ papers: allPapers });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const abstract = typeof body?.abstract === "string" ? body.abstract.trim() : "";
  const rawContent = typeof body?.content === "string" ? body.content.trim() : "";
  const content = rawContent || abstract;
  const authors = typeof body?.authors === "string" ? body.authors.trim() : "";
  const source = typeof body?.source === "string" ? body.source.trim() : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const fileType = typeof body?.fileType === "string" ? body.fileType.trim().toLowerCase() : "";
  const parsedFileSize = Number.parseInt(String(body?.fileSize ?? ""), 10);
  const yearValue = body?.year;
  const year =
    yearValue === null || yearValue === undefined || yearValue === "" ? null : Number.parseInt(String(yearValue), 10);

  if (!title || !content) {
    return NextResponse.json({ error: "A title and either full text or an abstract are required." }, { status: 400 });
  }

  const [newPaper] = await db
    .insert(papers)
    .values({
      title,
      abstract: abstract || null,
      content,
      authors: authors || null,
      year: Number.isFinite(year) ? year : null,
      source: source || null,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: Number.isFinite(parsedFileSize) ? parsedFileSize : null,
    })
    .returning();

  const analysis = generateAnalysis({ title, abstract, content, authors, year });

  const [newAnalysis] = await db
    .insert(analyses)
    .values({
      paperId: newPaper.id,
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

  return NextResponse.json({ paper: newPaper, analysis: newAnalysis });
}
