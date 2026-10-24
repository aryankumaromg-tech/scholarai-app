import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { papers, researchNotes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paperId = Number.parseInt(id, 10);
  if (!Number.isFinite(paperId)) return NextResponse.json({ error: "Invalid paper ID." }, { status: 400 });
  const notes = await db.select().from(researchNotes).where(eq(researchNotes.paperId, paperId)).orderBy(desc(researchNotes.updatedAt));
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paperId = Number.parseInt(id, 10);
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 180) : "Research note";
  const noteBody = typeof body?.body === "string" ? body.body.trim() : "";
  const color = ["amber", "sage", "rose", "blue"].includes(body?.color) ? body.color : "amber";

  if (!Number.isFinite(paperId) || !noteBody) {
    return NextResponse.json({ error: "A note body is required." }, { status: 400 });
  }
  const [paper] = await db.select({ id: papers.id }).from(papers).where(eq(papers.id, paperId));
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  const [note] = await db
    .insert(researchNotes)
    .values({ paperId, title: title || "Research note", body: noteBody, color })
    .returning();
  return NextResponse.json({ note }, { status: 201 });
}
