"use server"

import { revalidatePath } from "next/cache";
import { addWine, deleteWine, updateWine } from "./storage";
import { Wine, WineType } from "./types";

export async function createWine(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const producer = formData.get("producer") as string;
        const vintage = parseInt(formData.get("vintage") as string) || new Date().getFullYear();
        const type = formData.get("type") as WineType;
        const country = formData.get("country") as string;
        const region = formData.get("region") as string;
        const subRegion = formData.get("subRegion") as string;
        const grapes = formData.getAll("grapes") as string[];

        const alcoholContent = parseFloat(formData.get("alcoholContent") as string) || undefined;
        const bottleSize = formData.get("bottleSize") as string;

        const quantity = parseInt(formData.get("quantity") as string) || 1;
        const location = formData.get("location") as string;

        const drinkFrom = parseInt(formData.get("drinkFrom") as string) || undefined;
        const drinkTo = parseInt(formData.get("drinkTo") as string) || undefined;
        const boughtAt = formData.get("boughtAt") as string;
        const boughtDate = formData.get("boughtDate") as string;
        const price = parseFloat(formData.get("price") as string) || undefined;

        const rating = parseFloat(formData.get("rating") as string) || undefined;
        const expertRatings = formData.get("expertRatings") as string;
        const tastingNotes = formData.getAll("tastingNotes") as string[];
        const pairingSuggestions = formData.get("pairingSuggestions") as string;
        const personalNotes = formData.get("personalNotes") as string;

        let imagePath: string | undefined = undefined;
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
            try {
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                const candidate = `data:${imageFile.type};base64,${buffer.toString("base64")}`;
                if (candidate.length <= 45000) {
                    imagePath = candidate;
                }
            } catch (e) {
                console.error("Image conversion failed", e);
            }
        }

        const addToCellar = formData.get("addToCellar") === "on";
        const addToWishlist = formData.get("addToWishlist") === "on";
        const destinations: ("Cellar" | "Wishlist")[] = [];
        if (addToCellar) destinations.push("Cellar");
        if (addToWishlist) destinations.push("Wishlist");
        if (destinations.length === 0) destinations.push("Cellar");

        await addWine({
            name, producer, vintage, type, country, region, subRegion, grapes,
            alcoholContent, bottleSize,
            quantity, location,
            drinkFrom, drinkTo, boughtAt, boughtDate, price,
            rating, expertRatings, tastingNotes, pairingSuggestions, personalNotes,
            image: imagePath,
        }, destinations);

        revalidatePath("/");
        revalidatePath("/cellar");
        revalidatePath("/wishlist");

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("createWine failed:", message);
        return { success: false, error: message };
    }
}

export async function updateWineAction(id: string, formData: FormData, sheetTitle: "Cellar" | "Wishlist") {
    try {
        const updates: Partial<Wine> = {};

        if (formData.has("name")) updates.name = formData.get("name") as string;
        if (formData.has("producer")) updates.producer = formData.get("producer") as string;
        if (formData.has("vintage")) updates.vintage = parseInt(formData.get("vintage") as string);
        if (formData.has("type")) updates.type = formData.get("type") as WineType;
        if (formData.has("country")) updates.country = formData.get("country") as string;
        if (formData.has("region")) updates.region = formData.get("region") as string;
        if (formData.has("subRegion")) updates.subRegion = formData.get("subRegion") as string;
        if (formData.has("grapes")) {
            const grapesRaw = formData.getAll("grapes") as string[];
            updates.grapes = grapesRaw.length === 1 && grapesRaw[0].includes(",")
                ? grapesRaw[0].split(",").map(g => g.trim())
                : grapesRaw;
        }

        if (formData.has("alcoholContent")) updates.alcoholContent = parseFloat(formData.get("alcoholContent") as string);
        if (formData.has("bottleSize")) updates.bottleSize = formData.get("bottleSize") as string;

        if (formData.has("quantity")) updates.quantity = parseInt(formData.get("quantity") as string);
        if (formData.has("location")) updates.location = formData.get("location") as string;

        if (formData.has("drinkFrom")) updates.drinkFrom = parseInt(formData.get("drinkFrom") as string);
        if (formData.has("drinkTo")) updates.drinkTo = parseInt(formData.get("drinkTo") as string);
        if (formData.has("boughtAt")) updates.boughtAt = formData.get("boughtAt") as string;
        if (formData.has("boughtDate")) updates.boughtDate = formData.get("boughtDate") as string;
        if (formData.has("price")) updates.price = parseFloat(formData.get("price") as string);

        if (formData.has("rating")) updates.rating = parseFloat(formData.get("rating") as string);
        if (formData.has("expertRatings")) updates.expertRatings = formData.get("expertRatings") as string;
        const tastingNotes = formData.getAll("tastingNotes") as string[];
        if (tastingNotes.length > 0) updates.tastingNotes = tastingNotes;
        if (formData.has("pairingSuggestions")) updates.pairingSuggestions = formData.get("pairingSuggestions") as string;
        if (formData.has("personalNotes")) updates.personalNotes = formData.get("personalNotes") as string;

        await updateWine(id, updates, sheetTitle);

        revalidatePath("/");
        revalidatePath("/cellar");
        revalidatePath("/wishlist");

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("updateWineAction failed:", message);
        return { success: false, error: message };
    }
}

export async function deleteWineAction(id: string, sheetTitle: "Cellar" | "Wishlist") {
    try {
        await deleteWine(id, sheetTitle);
        revalidatePath("/");
        revalidatePath("/cellar");
        revalidatePath("/wishlist");
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("deleteWineAction failed:", message);
        return { success: false, error: message };
    }
}

export async function updateQuantityAction(id: string, newQuantity: number, sheetTitle: "Cellar" | "Wishlist") {
    try {
        await updateWine(id, { quantity: newQuantity }, sheetTitle);
        revalidatePath("/");
        revalidatePath("/cellar");
        revalidatePath("/wishlist");
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("updateQuantityAction failed:", message);
        return { success: false, error: message };
    }
}

export async function moveToCellarAction(wine: Wine) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, dateAdded, ...wineData } = wine;
        await addWine(wineData, ["Cellar"]);
        await deleteWine(id, "Wishlist");
        revalidatePath("/");
        revalidatePath("/cellar");
        revalidatePath("/wishlist");
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("moveToCellarAction failed:", message);
        return { success: false, error: message };
    }
}

export async function fetchRatings(name: string, vintage: number) {
    try {
        const { VertexAI } = await import("@google-cloud/vertexai");
        const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        let vertexAI;
        try {
            const credentials = rawJson ? JSON.parse(rawJson.trim()) : undefined;
            vertexAI = new VertexAI({
                project: "veni-vidi-vinoantigrav",
                location: "europe-west1",
                googleAuthOptions: credentials ? { credentials } : undefined
            });
        } catch {
            vertexAI = new VertexAI({ project: "veni-vidi-vinoantigrav", location: "europe-west1" });
        }

        const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Based on your training data, what expert scores have been published for '${name} ${vintage}'?
        Return a JSON array only for scores you have actually seen referenced in your training data:
        - Parker (Robert Parker / Wine Advocate)
        - Suckling (James Suckling)
        - Spectator (Wine Spectator)
        - Vinous (Antonio Galloni / Vinous)
        - Decanter (Decanter Magazine)
        - Jancis (Jancis Robinson)

        Format: [{"source": "Parker", "score": "96"}].
        Short names only: Parker, Suckling, Spectator, Vinous, Decanter, Jancis.
        If unknown or uncertain, return [].
        Return ONLY raw valid JSON. No markdown.`;

        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("[AI Ratings] Error:", error);
        return [];
    }
}
