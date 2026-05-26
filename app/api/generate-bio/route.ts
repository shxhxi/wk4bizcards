import { NextResponse } from 'next/server';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? '').trim();
    const title = String(body.title ?? '').trim();
    const company = String(body.company ?? body.business ?? '').trim();
    const category = String(body.category ?? '').trim();

    if (!name || !title || !company) {
      return NextResponse.json(
        { error: 'Name, title, and company are required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing DEEPSEEK_API_KEY.' },
        { status: 500 }
      );
    }

    const prompt = [
      `Write a polished 2–3 sentence professional bio in the third person.`,
      `Name: ${name}`,
      `Title: ${title}`,
      `Company: ${company}`,
      category ? `Category: ${category}` : '',
      `Keep it warm, professional, concise, and suitable for a business card directory.`,
      `Do not use bullet points.`,
      `Do not invent unverifiable awards or credentials.`,
    ]
      .filter(Boolean)
      .join('\n');

    const upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'You write short, professional third-person bios for a business directory.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text();
      return NextResponse.json(
        { error: errorText || 'DeepSeek request failed.' },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const rawLine of lines) {
              const line = rawLine.trim();

              if (!line.startsWith('data:')) {
                continue;
              }

              const data = line.slice(5).trim();

              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content ?? '';

                for (const char of content) {
                  controller.enqueue(encoder.encode(char));
                  await sleep(30);
                }
              } catch {
                // ignore malformed SSE chunks
              }
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate bio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}