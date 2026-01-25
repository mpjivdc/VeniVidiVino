export type WineType = "Red" | "White" | "Rose" | "Sparkling" | "Dessert" | "Fortified";

export interface Wine {
    id: string;
    name: string;
    producer: string;
    year: number;
    type: WineType;
    region?: string;
    country?: string;
    rating?: number; // 0-5
    image?: string; // base64 or path
    dateAdded: string;
    notes?: string;
}

export interface WishlistItem {
    id: string;
    name: string;
    producer?: string;
    notes?: string;
}
