import { NextRequest, NextResponse } from "next/server";
import { extractDocument, MAX_UPLOAD_BYTES } from "@/lib/document-ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_UPLOAD_BYTES + 1_000_000) {
      return NextResponse.json({ error: "File is too large. The upload limit is 15 MB." }, { status: 413 });
    }

    const formData = await req.formData();
    const upload = formData.get("file");
    if (!(upload instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF, PPT, PPTX, or TXT file." }, { status: 400 });
    }

    const document = await extractDocument(upload);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The document could not be processed.";
    const status = /too large/i.test(message) ? 413 : /unsupported|empty|choose/i.test(message) ? 400 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
