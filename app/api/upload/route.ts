import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze this wine label image and extract the following details in JSON format:
    - name: The name of the wine.
    - producer: The producer/winery name.
    - year: The vintage year (number). If not found, use current year.
    - type: One of "Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other". Infer from color or grape if possible. Default to "Red".
    - region: The region (e.g., Napa Valley, Bordeaux).
    - subRegion: The specific sub-region or AOC if visible (e.g., Bolgheri, Margaux).
    - country: The country of origin.
    - grapes: An array of grape varieties mentioned on the label.
    - alcohol: The alcohol percentage as a number (e.g., 14.5).
    
    Return ONLY raw valid JSON. Do not include markdown formatting or backticks.`;

        console.log("[AI Scan] Sending image to Gemini...");
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type || "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log(`[AI Scan] Raw Response: ${text}`);

        // Clean up potential markdown code blocks or whitespace
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").replace(/^`|`$/g, "").trim();

        try {
            const data = JSON.parse(jsonString);
            console.log(`[AI Raw Output] ${JSON.stringify(data)}`);
            console.log(`[AI Scan] Parsed Success: ${data.name}`);
            return NextResponse.json(data);
        } catch (e) {
            console.error(`[AI Scan] JSON Parse Error: ${jsonString}`);
            throw new Error("Invalid AI response format");
        }
    } catch (error: any) {
        console.error("[AI Scan] FATAL ERROR:", error.message);
        return NextResponse.json({ error: `Analysis failed: ${error.message}` }, { status: 500 });
    }
}
