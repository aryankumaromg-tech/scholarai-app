import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { researchNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = Number.parseInt(id, 10);
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 180) : undefined;
  const noteBody = typeof body?.body === "string" ? body.body.trim() : undefined;
  const color = ["amber", "sage", "rose", "blue"].includes(body?.color) ? body.color : undefined;
  if (!Number.isFinite(noteId) || (title === undefined && noteBody === undefined && color === undefined)) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const [note] = await db
    .update(researchNotes)
    .set({
      ...(title !== undefined ? { title: title || "Research note" } : {}),
      ...(noteBody !== undefined ? { body: noteBody } : {}),
      ...(color !== undefined ? { color } : {}),
      updatedAt: new Date(),
    })
    .where(eq(researchNotes.id, noteId))
    .returning();
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });
  return NextResponse.json({ note });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = Number.parseInt(id, 10);
  if (!Number.isFinite(noteId)) return NextResponse.json({ error: "Invalid note ID." }, { status: 400 });
  const [deleted] = await db.delete(researchNotes).where(eq(researchNotes.id, noteId)).returning({ id: researchNotes.id });
  if (!deleted) return NextResponse.json({ error: "Note not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
