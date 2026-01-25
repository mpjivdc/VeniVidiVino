"use server"

import fs from "fs/promises";
import path from "path";
import { Wine } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "wines.json");

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readData(): Promise<Wine[]> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or error, return empty array
        return [];
    }
}

async function writeData(wines: Wine[]) {
    await ensureDataDir();
    await fs.writeFile(FILE_PATH, JSON.stringify(wines, null, 2), "utf-8");
}

export async function getWines(): Promise<Wine[]> {
    return await readData();
}

export async function addWine(wine: Omit<Wine, "id" | "dateAdded">): Promise<Wine> {
    const wines = await readData();
    const newWine: Wine = {
        ...wine,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
    };
    wines.push(newWine);
    await writeData(wines);
    return newWine;
}

export async function deleteWine(id: string): Promise<void> {
    const wines = await readData();
    const filtered = wines.filter((w) => w.id !== id);
    await writeData(filtered);
}
