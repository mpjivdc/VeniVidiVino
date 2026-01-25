"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addWine } from "./storage";
import { WineType } from "./types";
import path from "path";
import fs from "fs/promises";

export async function createWine(formData: FormData) {
    const name = formData.get("name") as string;
    const producer = formData.get("producer") as string;
    const year = parseInt(formData.get("year") as string);
    const type = formData.get("type") as WineType;
    const region = formData.get("region") as string;
    const country = formData.get("country") as string;
    const rating = parseFloat(formData.get("rating") as string);
    const notes = formData.get("notes") as string;
    const imageFile = formData.get("image") as File;

    let imagePath: string | undefined = undefined;

    if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const filename = `${crypto.randomUUID()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const uploadDir = path.join(process.cwd(), "public/uploads");

        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        await fs.writeFile(path.join(uploadDir, filename), buffer);
        imagePath = `/uploads/${filename}`;
    }

    await addWine({
        name,
        producer,
        year,
        type,
        region,
        country,
        rating,
        notes,
        image: imagePath,
    });

    revalidatePath("/");
    redirect("/");
}
