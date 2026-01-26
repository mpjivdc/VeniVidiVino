"use server"

import { Wine, WishlistItem } from "./types";
import { getDoc } from "./google-sheets";

export async function getWines(): Promise<Wine[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle["Cellar"];
        if (!sheet) return [];

        const rows = await sheet.getRows();
        return rows.map((row) => ({
            id: row.get("id"),
            name: row.get("name"),
            producer: row.get("producer"),
            year: parseInt(row.get("year")),
            type: row.get("type") as any,
            region: row.get("region"),
            country: row.get("country"),
            rating: parseFloat(row.get("rating")) || 0,
            image: row.get("image"),
            dateAdded: row.get("dateAdded"),
            notes: row.get("notes"),
        }));
    } catch (error) {
        console.error("Error fetching wines from Sheets:", error);
        return [];
    }
}

export async function addWine(wine: Omit<Wine, "id" | "dateAdded">): Promise<Wine> {
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle["Cellar"];

    // Create sheet if it doesn't exist (first run)
    if (!sheet) {
        sheet = await doc.addSheet({ headerValues: ['id', 'name', 'producer', 'year', 'type', 'region', 'country', 'rating', 'image', 'dateAdded', 'notes'], title: "Cellar" });
    }

    const newWine: Wine = {
        ...wine,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
    };

    await sheet.addRow({
        id: newWine.id,
        name: newWine.name,
        producer: newWine.producer,
        year: newWine.year,
        type: newWine.type,
        region: newWine.region || "",
        country: newWine.country || "",
        rating: newWine.rating || 0,
        image: newWine.image || "",
        dateAdded: newWine.dateAdded,
        notes: newWine.notes || "",
    });

    return newWine;
}

export async function getWishlist(): Promise<WishlistItem[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle["Wishlist"];
        if (!sheet) return [];

        const rows = await sheet.getRows();
        return rows.map((row) => ({
            id: row.get("id"),
            name: row.get("name"),
            producer: row.get("producer"),
            notes: row.get("notes"),
        }));
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return [];
    }
}

export async function deleteWine(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle["Cellar"];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get("id") === id);
    if (row) await row.delete();
}
