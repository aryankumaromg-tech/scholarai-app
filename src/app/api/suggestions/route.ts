import { NextRequest, NextResponse } from "next/server";
import { suggestForText } from "@/lib/suggestions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";

  if (text.trim().length < 20) {
    return NextResponse.json({ error: "Paste at least a sentence of the abstract." }, { status: 400 });
  }

  const suggestions = await suggestForText(text.slice(0, 4000), 4);
  return NextResponse.json({
    suggestions: suggestions.map(({ item, reason, score }) => ({
      slug: item.slug,
      title: item.title,
      domain: item.domain,
      difficulty: item.difficulty,
      year: item.year,
      readingMinutes: item.readingMinutes,
      mathFocus: item.mathFocus,
      reason,
      score: Math.round(score * 100) / 100,
    })),
  });
}
