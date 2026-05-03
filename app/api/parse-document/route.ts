import { NextResponse } from 'next/server';
import { parseDocumentStructure } from '@/lib/server/document/request';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const documentData = await request.json();
    const result = await parseDocumentStructure(documentData);

    console.log(result);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}