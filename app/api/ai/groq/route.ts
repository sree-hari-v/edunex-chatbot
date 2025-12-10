import { NextResponse } from "next/server";

// IMPORTANT: The function name must be 'POST' (uppercase)
export async function POST(req: Request) {
  try {
    const body = await req.json(); // Safe check for body
    const { prompt } = body;
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    // Call Groq
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    const text = await res.text();
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `Groq API Error (${res.status}): ${text}` },
        { status: res.status }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json({ 
      text: data.choices?.[0]?.message?.content || "No answer",
      provider: "groq" 
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
