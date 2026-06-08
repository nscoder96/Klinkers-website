import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    // Handle PDF files
    if (fileName.endsWith('.pdf')) {
      try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        extractedText = result.text;
        await parser.destroy();
      } catch (pdfError) {
        console.error('PDF parse error:', pdfError);
        return NextResponse.json({
          error: 'Kon PDF niet lezen. Probeer een ander bestand.'
        }, { status: 400 });
      }
    }
    // Handle DOCX files
    else if (fileName.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (docxError) {
        console.error('DOCX parse error:', docxError);
        return NextResponse.json({
          error: 'Kon Word document niet lezen. Probeer een ander bestand.'
        }, { status: 400 });
      }
    }
    // Handle TXT files
    else if (fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    }
    // Handle DOC files (older format - limited support)
    else if (fileName.endsWith('.doc')) {
      return NextResponse.json({
        error: 'Oude Word (.doc) bestanden worden niet ondersteund. Sla het bestand op als .docx'
      }, { status: 400 });
    }
    // Unsupported file type
    else {
      return NextResponse.json({
        error: 'Bestandstype niet ondersteund. Gebruik PDF, DOCX of TXT.'
      }, { status: 400 });
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive blank lines
      .trim();

    if (!extractedText) {
      return NextResponse.json({
        error: 'Geen tekst gevonden in het bestand.'
      }, { status: 400 });
    }

    return NextResponse.json({
      text: extractedText,
      fileName: file.name,
      fileType: fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN'
    });

  } catch (error) {
    console.error('Extract text API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis bij het lezen van het bestand' }, { status: 500 });
  }
}
