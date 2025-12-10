import { NextResponse } from "next/server";

// DeepSeek OpenAI-compatible API
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const key = process.env.DEEPSEEK_API_KEY;

    if (!key) {
      return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // or "deepseek-reasoner"
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      // 402 is their “no balance” code
      if (res.status === 402) {
        return NextResponse.json({ error: "DeepSeek: Insufficient balance" }, { status: 402 });
      }
      const msg = json?.error?.message || `DeepSeek API error ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "DeepSeek: Empty response" }, { status: 500 });
    }

    return NextResponse.json({ text, provider: "deepseek" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "DeepSeek route failed" }, { status: 500 });
  }
}