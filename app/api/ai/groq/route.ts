import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured on server" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are EduNex, an assistant for Nilgiri College. " +
              "Answer questions about the college. " +
              "If unsure about fees or dates, refer the user to the official website.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    // FIX: Read as text first to avoid "Unexpected end of JSON" crash
    const textBody = await res.text();

    if (!res.ok) {
      // Return the actual error text from Groq instead of crashing
      return NextResponse.json(
        { error: `Groq API Error (${res.status}): ${textBody || "Empty response"}` },
        { status: res.status }
      );
    }

    if (!textBody) {
      return NextResponse.json(
        { error: "Groq returned an empty response." },
        { status: 500 }
      );
    }

    // Safely parse JSON
    let json: any;
    try {
      json = JSON.parse(textBody);
    } catch {
      return NextResponse.json(
        { error: "Groq response was not valid JSON." },
        { status: 500 }
      );
    }

    const answer = json.choices?.[0]?.message?.content;
    
    if (!answer) {
      return NextResponse.json({ error: "Groq returned no answer." }, { status: 500 });
    }

    return NextResponse.json({ text: answer, provider: "groq" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Groq route failed internally" },
      { status: 500 }
    );
  }
}
