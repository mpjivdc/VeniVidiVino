"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Plus, X, Calendar, MapPin, DollarSign, GlassWater, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { createWine } from "@/lib/actions"
import { WineType } from "@/lib/types"

const wineTypes: WineType[] = ["Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other"]

const tastingNoteOptions = {
    Fruit: ["Red Cherry", "Raspberry", "Black Plum", "Blackberry", "Lemon", "Green Apple", "Peach", "Apricot"],
    Floral: ["Rose", "Violet", "Blossom", "Honeysuckle"],
    "Earthy/Savory": ["Forest Floor", "Mushroom", "Leather", "Tobacco", "Wet Stones"],
    "Spice & Oak": ["Vanilla", "Cedar", "Black Pepper", "Cloves", "Smoke", "Chocolate"],
    Structure: ["High Acidity", "Firm Tannins", "Full-Bodied", "Silky", "Crisp"],
};

const formSchema = z.object({
    // Identity
    name: z.string().min(2, "Name is required"),
    producer: z.string().min(2, "Producer is required"),
    vintage: z.string().regex(/^\d{4}$/, "Must be a valid year"),
    type: z.enum(["Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other"]),
    country: z.string().optional(),
    region: z.string().optional(),
    subRegion: z.string().optional(),
    grapes: z.string().optional(),

    // Specs
    alcoholContent: z.string().optional(),
    bottleSize: z.string().optional(),

    // Inventory
    quantity: z.string().default("1"),
    location: z.string().optional(),

    // Timeline
    drinkFrom: z.string().optional(),
    drinkTo: z.string().optional(),
    boughtAt: z.string().optional(),
    boughtDate: z.string().optional(),
    price: z.string().optional(),

    // Review
    rating: z.array(z.number()).length(1),
    tastingNotes: z.array(z.string()).default([]),
    pairingSuggestions: z.string().optional(),

    // Destinations
    addToCellar: z.boolean().default(true),
    addToWishlist: z.boolean().default(false),
})

const compressImage = (file: File, maxWidth = 300, quality = 0.4): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new globalThis.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'medium';
                    ctx.drawImage(img, 0, 0, width, height);
                }

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: "image/jpeg",
                            lastModified: Date.now()
                        }));
                    } else {
                        reject(new Error("Compression failed"));
                    }
                }, "image/jpeg", quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

type FormValues = z.infer<typeof formSchema>

export function AddWineForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "", producer: "", vintage: new Date().getFullYear().toString(),
            type: "Red", country: "", region: "", subRegion: "", grapes: "",
            alcoholContent: "", bottleSize: "750ml",
            quantity: "1", location: "",
            drinkFrom: "", drinkTo: "", boughtAt: "", boughtDate: "", price: "",
            rating: [3.5], tastingNotes: [], pairingSuggestions: "",
            addToCellar: true, addToWishlist: false,
        },
    })

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                const compressedFile = await compressImage(file)
                setSelectedImage(compressedFile)
                setPreviewUrl(URL.createObjectURL(compressedFile))
                await scanLabel(compressedFile)
            } catch (error) {
                console.error("Compression error", error)
                // Fallback to original if compression fails
                setSelectedImage(file)
                setPreviewUrl(URL.createObjectURL(file))
                await scanLabel(file)
            }
        }
    }

    const scanLabel = async (file: File) => {
        setIsScanning(true)
        try {
            const formData = new FormData()
            formData.append("image", file)
            console.log('Sending image to server for AI scan...');
            const response = await fetch("/api/upload", { method: "POST", body: formData })
            console.log('Server response received!');
            if (!response.ok) throw new Error("Scan failed")
            const data = await response.json()

            if (data.name) form.setValue("name", data.name)
            if (data.producer) form.setValue("producer", data.producer)
            if (data.year) form.setValue("vintage", data.year.toString())
            if (data.type && wineTypes.includes(data.type)) form.setValue("type", data.type)
            if (data.region) form.setValue("region", data.region)
            if (data.subRegion) form.setValue("subRegion", data.subRegion)
            if (data.country) form.setValue("country", data.country)
            if (data.grapes) form.setValue("grapes", Array.isArray(data.grapes) ? data.grapes.join(", ") : data.grapes)
            if (data.alcohol) form.setValue("alcoholContent", data.alcohol.toString())
        } catch (error) {
            console.error("Scan error", error)
        } finally {
            setIsScanning(false)
        }
    }

    async function onSubmit(values: FormValues) {
        console.log('Saving collection data...');
        setIsSubmitting(true)

        // 15-second timeout safeguard for mobile uploads
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SAVE_TIMEOUT")), 15000)
        );

        const saveProcess = async () => {
            const formData = new FormData()

            Object.entries(values).forEach(([key, value]) => {
                if (key === 'rating' && Array.isArray(value)) {
                    formData.append(key, value[0].toString())
                } else if (key === 'tastingNotes' && Array.isArray(value)) {
                    (value as string[]).forEach((note: string) => formData.append('tastingNotes', note));
                } else if (key === 'grapes' && typeof value === 'string') {
                    const grapeList = value.split(',').map(g => g.trim()).filter(g => g);
                    grapeList.forEach(g => formData.append('grapes', g));
                } else if (typeof value === 'boolean') {
                    if (value) formData.append(key, 'on');
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value.toString())
                }
            })

            if (selectedImage) {
                formData.append("image", selectedImage);
                // Log length for verification
                try {
                    const reader = new FileReader();
                    reader.readAsDataURL(selectedImage);
                    await new Promise(resolve => reader.onloadend = resolve);
                    const b64 = reader.result as string;
                    console.log(`[STORAGE] Uploading Base64 length: ${b64.length}`);
                } catch (e) { }
            } else {
                formData.append("image", "");
            }

            const result = await createWine(formData);
            if (!result?.success) {
                throw new Error(result?.error || "Unknown server error");
            }
            return result;
        };

        try {
            await Promise.race([saveProcess(), timeoutPromise]);
            router.push("/cellar");
        } catch (error: any) {
            console.error("Save failed", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleNote = (note: string) => {
        const current = form.getValues("tastingNotes") || []
        if (current.includes(note)) {
            form.setValue("tastingNotes", current.filter((n: string) => n !== note))
        } else {
            form.setValue("tastingNotes", [...current, note])
        }
    }

    return (
        <div className="space-y-6 pb-24 px-1">
            {/* SCANNER AT THE VERY TOP */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 shadow-sm mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                        <Upload className="w-4 h-4" />
                        Quick Add with AI
                    </div>
                    {previewUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black/10">
                            <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                        </div>
                    )}
                    <Button
                        type="button"
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-md font-bold py-6 text-lg"
                        disabled={isScanning}
                        onClick={() => document.getElementById('camera-input')?.click()}
                    >
                        {isScanning ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Label...</> : <><Upload className="mr-2 h-5 w-5" /> SCAN WINE LABEL</>}
                        <input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground opacity-70 uppercase tracking-widest">Powered by Gemini Flash AI</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Identity Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <Info className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Identity</h3>
                        </div>

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Wine Name</FormLabel><FormControl><Input placeholder="e.g. Sassicaia" className="bg-card" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <FormField control={form.control} name="producer" render={({ field }) => (
                            <FormItem><FormLabel>Producer</FormLabel><FormControl><Input placeholder="e.g. Tenuta San Guido" className="bg-card" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="vintage" render={({ field }) => (
                                <FormItem><FormLabel>Vintage</FormLabel><FormControl><Input type="number" className="bg-card" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="bg-card"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>{wineTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="country" render={({ field }) => (
                                <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="Italy" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="region" render={({ field }) => (
                                <FormItem><FormLabel>Region</FormLabel><FormControl><Input placeholder="Tuscany" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="subRegion" render={({ field }) => (
                            <FormItem><FormLabel>Sub-Region</FormLabel><FormControl><Input placeholder="Bolgheri" className="bg-card" {...field} /></FormControl></FormItem>
                        )} />

                        <FormField control={form.control} name="grapes" render={({ field }) => (
                            <FormItem><FormLabel>Grapes</FormLabel><FormControl><Input placeholder="Cabernet Sauvignon, Cabernet Franc" className="bg-card" {...field} /></FormControl><FormDescription className="text-[10px]">Comma separated</FormDescription></FormItem>
                        )} />
                    </div>

                    {/* Specs & Inventory Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <GlassWater className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Specs & Inventory</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="alcoholContent" render={({ field }) => (
                                <FormItem><FormLabel>Alcohol %</FormLabel><FormControl><Input type="number" step="0.1" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="bottleSize" render={({ field }) => (
                                <FormItem><FormLabel>Size</FormLabel><FormControl><Input placeholder="750ml" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Rack A, Shelf 2" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <Calendar className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Timeline</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="drinkFrom" render={({ field }) => (
                                <FormItem><FormLabel>Drink From</FormLabel><FormControl><Input type="number" placeholder="2028" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="drinkTo" render={({ field }) => (
                                <FormItem><FormLabel>Drink To</FormLabel><FormControl><Input type="number" placeholder="2040" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Purchase Info Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <DollarSign className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Purchase Info</h3>
                        </div>
                        <FormField control={form.control} name="boughtAt" render={({ field }) => (
                            <FormItem><FormLabel>Bought At (Shop)</FormLabel><FormControl><Input placeholder="Wine Merchants Inc" className="bg-card" {...field} /></FormControl></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="boughtDate" render={({ field }) => (
                                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price paid</FormLabel><FormControl><Input type="number" step="0.01" className="bg-card" {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <Plus className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Review & Notes</h3>
                        </div>

                        <FormField control={form.control} name="rating" render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center mb-2"><FormLabel>Rating</FormLabel><span className="text-primary font-bold text-lg">{field.value[0]}</span></div>
                                <FormControl><Slider min={0} max={5} step={0.1} value={field.value} onValueChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />

                        <div className="mt-4">
                            <FormLabel className="mb-2 block">Tasting Notes</FormLabel>
                            <div className="space-y-3 p-3 border rounded-lg bg-card/50">
                                {Object.entries(tastingNoteOptions).map(([category, notes]) => (
                                    <div key={category}>
                                        <p className="text-[10px] text-muted-foreground font-bold mb-1 uppercase tracking-tighter">{category}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {notes.map(note => {
                                                const isSelected = (form.getValues("tastingNotes") || []).includes(note);
                                                return (
                                                    <Badge
                                                        key={note}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer text-[10px] py-0 px-2 h-6"
                                                        onClick={() => toggleNote(note)}
                                                    >
                                                        {note}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <FormField control={form.control} name="pairingSuggestions" render={({ field }) => (
                            <FormItem><FormLabel>Food Pairings</FormLabel><FormControl><Input placeholder="Grilled Lamb, Aged Cheese..." className="bg-card" {...field} /></FormControl></FormItem>
                        )} />
                    </div>

                    {/* Destinations Section */}
                    <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-inner">
                        <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-primary">Destinations</h3>
                        <div className="flex flex-col gap-4">
                            <FormField control={form.control} name="addToCellar" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-card p-3 rounded-lg border">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none">
                                        <Label className="font-bold">Add to My Cellar</Label>
                                        <p className="text-[10px] text-muted-foreground">Store in current inventory</p>
                                    </div>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="addToWishlist" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-card p-3 rounded-lg border">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none">
                                        <Label className="font-bold">Add to Wishlist</Label>
                                        <p className="text-[10px] text-muted-foreground">Save for future purchase</p>
                                    </div>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-7 text-xl font-bold rounded-2xl shadow-lg border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> SAVING TO COLLECTION...</> : "SAVE TO COLLECTION"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
