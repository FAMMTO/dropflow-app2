import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const generateEndpoint =
      process.env.BOTSONIC_GENERATE_ENDPOINT ||
      "https://api-bot.writesonic.com/v1/botsonic/generate";
      
    const apiToken = 
      process.env.BOTSONIC_API_TOKEN || 
      "a346cba8-9783-48ae-bbf0-9be760deb719";

    const response = await fetch(generateEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error from Botsonic:", errorData);
      return NextResponse.json(
        { error: "Error from Botsonic generation API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Internal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
