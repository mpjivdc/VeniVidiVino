import { NextRequest, NextResponse } from "next/server";
import { VertexAI, InlineDataPart } from "@google-cloud/vertexai";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
let vertexAI: VertexAI;

try {
    const cleanedJson = rawJson?.trim();
    const credentials = cleanedJson ? JSON.parse(cleanedJson) : undefined;
    vertexAI = new VertexAI({
        project: "veni-vidi-vinoantigrav",
        location: "europe-west1",
        googleAuthOptions: credentials ? { credentials } : undefined
    });
    if (credentials) console.log("[Auth] JSON credentials parsed successfully.");
} catch (e: any) {
    console.error("[Auth] JSON Parse Error:", e.message);
    vertexAI = new VertexAI({
        project: "veni-vidi-vinoantigrav",
        location: "europe-west1",
    });
}

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
        console.log("[AI Scan] Image parsed successfully.");

        const modelsToTry = ["gemini-3-flash", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`[AI Scan] Attempting with model: ${modelName}...`);
                const generativeModel = vertexAI.getGenerativeModel({ model: modelName });

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

                const imagePart: InlineDataPart = {
                    inlineData: {
                        data: base64Image,
                        mimeType: file.type || "image/jpeg",
                    },
                };

                const result = await generativeModel.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
                });

                const response = await result.response;
                const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
                console.log(`[AI Scan] Raw Response (${modelName}): ${text}`);

                // Clean up potential markdown code blocks or whitespace
                const jsonString = text.replace(/```json/g, "").replace(/```/g, "").replace(/^`|`$/g, "").trim();

                const data = JSON.parse(jsonString);
                console.log(`[AI Raw Output] ${JSON.stringify(data)}`);
                console.log(`[AI Scan] Parsed Success with ${modelName}: ${data.name}`);
                return NextResponse.json({ ...data, _model: modelName });
            } catch (e: any) {
                console.error(`[AI Scan] Model ${modelName} failed:`, e.message);
                lastError = e;
                continue;
            }
        }

        throw lastError || new Error("All models failed to generate a valid response.");

    } catch (error: any) {
        console.error("[AI Scan] FATAL ERROR:", error.message);
        return NextResponse.json({ error: `Analysis failed: ${error.message}` }, { status: 500 });
    }
}
