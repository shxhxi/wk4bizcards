import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { Database } from '../../../lib/database.types';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = String(formData.get('name') ?? '').trim();
    const title = String(formData.get('title') ?? '').trim();
    const company = String(formData.get('company') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const website = String(formData.get('website') ?? '').trim();
    const category_id = String(formData.get('category_id') ?? '').trim();
    const photoValue = formData.get('photo');

    const photo = photoValue instanceof File ? photoValue : null;

    if (!name || !title || !company || !email || !category_id) {
      return NextResponse.json(
        { error: 'Name, title, company, email, and category are required.' },
        { status: 400 }
      );
    }

    if (photo) {
      if (!ALLOWED_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: 'Only PNG and JPG files are allowed.' },
          { status: 400 }
        );
      }

      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Photo must be under 2MB.' },
          { status: 400 }
        );
      }
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const sessionId = crypto.randomUUID();
    let photoUrl: string | null = null;

    if (photo) {
      const ext = photo.type === 'image/png' ? 'png' : 'jpg';
      const path = `${sessionId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Photo upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      photoUrl = urlData.publicUrl;
    }

    const { data: card, error: insertError } = await supabase
      .from('cards')
      .insert([
        {
          name,
          title,
          company,
          email,
          phone: phone || null,
          website: website || null,
          category_id,
          status: 'pending',
          session_id: sessionId,
          profile_photo_url: photoUrl,
        },
      ])
      .select('id')
      .single();

    if (insertError || !card) {
      return NextResponse.json(
        { error: insertError?.message || 'Insert failed.' },
        { status: 500 }
      );
    }

    const baseUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');

    const adminUrl = `${baseUrl}/admin/submissions`;

    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.ADMIN_EMAIL || 'lhuynh@dvc.edu',
        subject: `New Business Card Submission: ${name}`,
        html: `
          <h2>New Submission Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || '—'}</p>
          <p><strong>Website:</strong> ${website || '—'}</p>
          ${photoUrl ? `<p><strong>Photo:</strong><br/><img src="${photoUrl}" width="120" style="border-radius:50%"/></p>` : ''}
          <p>
            <a href="${adminUrl}" style="background:#007550;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:bold;">
              Review Submission
            </a>
          </p>
        `,
      });
    } catch (emailError) {
      console.error('Resend email failed:', emailError);
    }

    return NextResponse.json({ success: true, id: card.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}