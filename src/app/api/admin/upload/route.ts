import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'logos';

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Ongeldig bestandstype. Toegestaan: JPG, PNG, GIF, WebP, SVG'
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Bestand te groot. Maximum is 5MB'
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({
        error: 'Upload mislukt: ' + error.message
      }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}

// Delete file endpoint
export async function DELETE(request: Request) {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Geen bestandspad opgegeven' }, { status: 400 });
    }

    // Extract the path from the full URL if needed
    let filePath = path;
    if (path.includes('/storage/v1/object/public/logos/')) {
      filePath = path.split('/storage/v1/object/public/logos/')[1];
    }

    const { error } = await supabase.storage
      .from('logos')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({
        error: 'Verwijderen mislukt: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
