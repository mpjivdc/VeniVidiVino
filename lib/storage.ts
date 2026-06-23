"use server"

import { Wine } from "./types";
import { getDoc } from "./google-sheets";

const HEADER_VALUES = [
    'Name', 'Producer', 'Vintage', 'Country', 'Region', 'Sub-region', 'Type', 'Grapes', 'Alcohol%', 'Bottle Size',
    'Quantity', 'Location', 'Drink From', 'Drink To', 'Rating', 'Price', 'Bought At', 'Bought Date', 'Tasting Notes',
    'Pairing', 'Status', 'CreatedAt', 'UpdatedAt', 'UserId', 'Notes', 'Image', 'Expert Ratings'
];

const KEY_TO_HEADER: Record<string, string> = {
    name: 'Name', producer: 'Producer', vintage: 'Vintage', country: 'Country', region: 'Region',
    subRegion: 'Sub-region', type: 'Type', grapes: 'Grapes', alcoholContent: 'Alcohol%',
    bottleSize: 'Bottle Size', quantity: 'Quantity', location: 'Location', drinkFrom: 'Drink From',
    drinkTo: 'Drink To', rating: 'Rating', price: 'Price', boughtAt: 'Bought At',
    boughtDate: 'Bought Date', tastingNotes: 'Tasting Notes', pairingSuggestions: 'Pairing',
    status: 'Status', createdAt: 'CreatedAt', updatedAt: 'UpdatedAt', userId: 'UserId',
    personalNotes: 'Notes', image: 'Image', expertRatings: 'Expert Ratings'
};

export async function getWines(sheetTitle: "Cellar" | "Wishlist"): Promise<Wine[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) return [];

        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        return rows.map((row) => {
            let tastingNotes: string[] = [];
            try {
                const raw = row.get("Tasting Notes");
                if (raw) tastingNotes = JSON.parse(raw);
            } catch {
                const raw = row.get("Tasting Notes");
                tastingNotes = raw ? [raw] : [];
            }

            let grapes: string[] = [];
            try {
                const raw = row.get("Grapes");
                if (raw) grapes = JSON.parse(raw);
            } catch {
                const raw = row.get("Grapes");
                grapes = raw ? [raw] : [];
            }

            return {
                id: row.get("Status") || row.get("Name"),
                name: row.get("Name"),
                vintage: parseInt(row.get("Vintage")) || new Date().getFullYear(),
                country: row.get("Country"),
                region: row.get("Region"),
                subRegion: row.get("Sub-region"),
                type: row.get("Type") as Wine["type"],
                grapes,
                producer: row.get("Producer") || "",
                alcoholContent: parseFloat(row.get("Alcohol%")) || undefined,
                bottleSize: row.get("Bottle Size"),
                quantity: !isNaN(parseInt(row.get("Quantity"))) ? parseInt(row.get("Quantity")) : 1,
                location: row.get("Location"),
                drinkFrom: parseInt(row.get("Drink From")) || undefined,
                drinkTo: parseInt(row.get("Drink To")) || undefined,
                boughtAt: row.get("Bought At"),
                boughtDate: row.get("Bought Date"),
                price: parseFloat(row.get("Price")) || undefined,
                rating: parseFloat(row.get("Rating")) || undefined,
                tastingNotes,
                pairingSuggestions: row.get("Pairing"),
                image: row.get("Image"),
                dateAdded: row.get("CreatedAt"),
                status: row.get("Status"),
                createdAt: row.get("CreatedAt"),
                updatedAt: row.get("UpdatedAt"),
                userId: row.get("UserId"),
                personalNotes: row.get("Notes"),
                expertRatings: row.get("Expert Ratings"),
            };
        });
    } catch (error) {
        console.error(`Error fetching ${sheetTitle} from Sheets:`, error);
        return [];
    }
}

export async function addWine(wine: Omit<Wine, "id" | "dateAdded">, destinations: ("Cellar" | "Wishlist")[]): Promise<void> {
    const doc = await getDoc();

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newWine: Record<string, string | number | string[] | undefined> = {
        ...wine,
        status: id,
        createdAt: now,
        updatedAt: now,
        id,
        dateAdded: now,
        tastingNotes: JSON.stringify(wine.tastingNotes || []),
        grapes: JSON.stringify(wine.grapes || []),
    };

    try {
        for (const title of destinations) {
            let sheet = doc.sheetsByTitle[title];
            if (!sheet) {
                sheet = await doc.addSheet({ headerValues: HEADER_VALUES, title });
            }

            const rowData: Record<string, string> = {};
            Object.entries(newWine).forEach(([key, val]) => {
                const header = KEY_TO_HEADER[key];
                if (header) {
                    rowData[header] = val !== undefined && val !== null ? val.toString() : "";
                }
            });

            await sheet.addRow(rowData);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Storage] addWine failed: ${message}`);
        throw error;
    }
}

export async function deleteWine(id: string, sheetTitle: "Cellar" | "Wishlist"): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return;

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get("Status") === id);
    if (row) await row.delete();
}

export async function updateWine(id: string, updates: Partial<Wine>, sheetTitle: "Cellar" | "Wishlist"): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return;

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get("Status") === id);

    if (!row) {
        console.warn(`[Storage] Row not found for ID: ${id} in ${sheetTitle}`);
        return;
    }

    const serialized: Record<string, string | number | string[] | undefined> = { ...updates };
    if (updates.tastingNotes) serialized.tastingNotes = JSON.stringify(updates.tastingNotes);
    if (updates.grapes) serialized.grapes = JSON.stringify(updates.grapes);

    Object.entries(serialized).forEach(([key, value]) => {
        const header = KEY_TO_HEADER[key];
        if (header && value !== undefined && value !== null && key !== "id") {
            row.set(header, value.toString());
        }
    });

    await row.save();
}
