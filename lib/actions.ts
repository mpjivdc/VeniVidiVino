"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addWine, deleteWine, updateWine } from "./storage";
import { Wine, WineType } from "./types";

export async function createWine(formData: FormData) {
    // Identity
    const name = formData.get("name") as string;
    const producer = formData.get("producer") as string;
    const vintage = parseInt(formData.get("vintage") as string) || new Date().getFullYear();
    const type = formData.get("type") as WineType;
    const country = formData.get("country") as string;
    const region = formData.get("region") as string;
    const subRegion = formData.get("subRegion") as string;
    const grapes = formData.getAll("grapes") as string[];

    // Specs
    const alcoholContent = parseFloat(formData.get("alcoholContent") as string) || undefined;
    const bottleSize = formData.get("bottleSize") as string;

    // Inventory
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const location = formData.get("location") as string;

    // Timeline
    const drinkFrom = parseInt(formData.get("drinkFrom") as string) || undefined;
    const drinkTo = parseInt(formData.get("drinkTo") as string) || undefined;
    const boughtAt = formData.get("boughtAt") as string;
    const boughtDate = formData.get("boughtDate") as string;
    const price = parseFloat(formData.get("price") as string) || undefined;

    // Review
    const rating = parseFloat(formData.get("rating") as string) || undefined;
    const tastingNotes = formData.getAll("tastingNotes") as string[];
    const pairingSuggestions = formData.get("pairingSuggestions") as string;

    // Image Handling
    // Note: Vercel is a read-only environment. 
    // Real persistence would require a cloud blob store (e.g. Vercel Blob, S3).
    // For now, we skip local disk writes to prevent ENOENT errors.
    const imagePath: string | undefined = undefined;

    // Destinations
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
        rating, tastingNotes, pairingSuggestions,
        image: imagePath,
    }, destinations);

    revalidatePath("/");
    revalidatePath("/wishlist");

    redirect("/");
}

export async function updateWineAction(id: string, formData: FormData, sheetTitle: "Cellar" | "Wishlist") {
    const updates: Partial<Wine> = {};

    if (formData.has("quantity")) updates.quantity = parseInt(formData.get("quantity") as string);
    if (formData.has("rating")) updates.rating = parseFloat(formData.get("rating") as string);

    const tastingNotes = formData.getAll("tastingNotes") as string[];
    if (tastingNotes.length > 0) updates.tastingNotes = tastingNotes;

    if (formData.has("name")) updates.name = formData.get("name") as string;
    if (formData.has("producer")) updates.producer = formData.get("producer") as string;
    if (formData.has("vintage")) updates.vintage = parseInt(formData.get("vintage") as string);
    if (formData.has("location")) updates.location = formData.get("location") as string;

    await updateWine(id, updates, sheetTitle);
    revalidatePath("/");
    revalidatePath("/wishlist");
}

export async function deleteWineAction(id: string, sheetTitle: "Cellar" | "Wishlist") {
    await deleteWine(id, sheetTitle);
    revalidatePath("/");
    revalidatePath("/wishlist");
}
