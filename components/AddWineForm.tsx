"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Camera, Calendar, DollarSign, GlassWater, Info, Plus } from "lucide-react"
import { createWine } from "@/lib/actions"
import { WineType } from "@/lib/types"

const wineTypes: WineType[] = ["Red", "White", "Rose", "Sparkling", "Dessert", "Fortified", "Orange", "Other"]

const tastingNoteOptions = {
    "Fruit - Citrus": ["Lemon", "Lime", "Grapefruit", "Orange peel"],
    "Fruit - Stone": ["Peach", "Apricot", "Nectarine", "Cherry"],
    "Fruit - Red": ["Strawberry", "Raspberry", "Redcurrant", "Cranberry"],
    "Fruit - Black": ["Blackberry", "Black cherry", "Plum", "Blackcurrant"],
    "Fruit - Tropical": ["Pineapple", "Mango", "Melon", "Lychee", "Banana"],
    "Fruit - Dried": ["Fig", "Raisin", "Prune", "Jammy"],
    "Floral": ["Rose", "Violet", "Honeysuckle", "Orange blossom", "Jasmine"],
    "Herbal/Vegetal": ["Grass", "Bell pepper", "Asparagus", "Mint", "Eucalyptus", "Tobacco", "Tomato leaf", "Tea"],
    "Spice": ["Black pepper", "Cinnamon", "Clove", "Vanilla", "Licorice", "Ginger", "Anise"],
    "Earthy/Mineral": ["Mushroom", "Forest floor", "Wet stones", "Flint", "Chalk", "Dust", "Petroleum"],
    "Oak/Age": ["Cedar", "Toast", "Smoke", "Caramel", "Butter", "Nutty", "Chocolate", "Coffee", "Leather"],
    "Mouthfeel": ["High Acidity", "Low Acidity", "Soft Tannins", "Firm Tannins", "Light Body", "Full Body"],
};

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

export function AddWineForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [producer, setProducer] = useState("")
    const [vintage, setVintage] = useState(new Date().getFullYear().toString())
    const [type, setType] = useState<WineType>("Red")
    const [country, setCountry] = useState("")
    const [region, setRegion] = useState("")
    const [subRegion, setSubRegion] = useState("")
    const [grapes, setGrapes] = useState("")
    const [alcoholContent, setAlcoholContent] = useState("")
    const [bottleSize, setBottleSize] = useState("750ml")
    const [quantity, setQuantity] = useState("1")
    const [location, setLocation] = useState("")
    const [drinkFrom, setDrinkFrom] = useState("")
    const [drinkTo, setDrinkTo] = useState("")
    const [boughtAt, setBoughtAt] = useState("")
    const [boughtDate, setBoughtDate] = useState("")
    const [price, setPrice] = useState("")
    const [rating, setRating] = useState(3.5)
    const [tastingNotes, setTastingNotes] = useState<string[]>([])
    const [pairingSuggestions, setPairingSuggestions] = useState("")
    const [addToCellar, setAddToCellar] = useState(true)
    const [addToWishlist, setAddToWishlist] = useState(false)

    // Auto-trigger scan if requested
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'scan') {
            document.getElementById('camera-input')?.click();
        }
    }, []);

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
            const response = await fetch("/api/upload", { method: "POST", body: formData })
            if (!response.ok) throw new Error("Scan failed")
            const data = await response.json()

            if (data.name) setName(data.name)
            if (data.producer) setProducer(data.producer)
            if (data.year) setVintage(data.year.toString())
            if (data.type && wineTypes.includes(data.type)) setType(data.type)
            if (data.region) setRegion(data.region)
            if (data.subRegion) setSubRegion(data.subRegion)
            if (data.country) setCountry(data.country)
            if (data.grapes) setGrapes(Array.isArray(data.grapes) ? data.grapes.join(", ") : data.grapes)
            if (data.alcohol) setAlcoholContent(data.alcohol.toString())
            if (data.pairings) setPairingSuggestions(data.pairings)
            if (data.tastingNotes) setTastingNotes(data.tastingNotes)
        } catch (error) {
            console.error("Scan error", error)
        } finally {
            setIsScanning(false)
        }
    }

    const toggleNote = (note: string) => {
        if (tastingNotes.includes(note)) {
            setTastingNotes(tastingNotes.filter(n => n !== note))
        } else {
            setTastingNotes([...tastingNotes, note])
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SAVE_TIMEOUT")), 15000)
        );

        const saveProcess = async () => {
            const formData = new FormData()

            formData.append("name", name)
            formData.append("producer", producer)
            formData.append("vintage", vintage)
            formData.append("type", type)
            if (country) formData.append("country", country)
            if (region) formData.append("region", region)
            if (subRegion) formData.append("subRegion", subRegion)
            if (grapes) {
                const grapeList = grapes.split(',').map(g => g.trim()).filter(g => g);
                grapeList.forEach(g => formData.append('grapes', g));
            }
            if (alcoholContent) formData.append("alcoholContent", alcoholContent)
            if (bottleSize) formData.append("bottleSize", bottleSize)
            formData.append("quantity", quantity)
            if (location) formData.append("location", location)
            if (drinkFrom) formData.append("drinkFrom", drinkFrom)
            if (drinkTo) formData.append("drinkTo", drinkTo)
            if (boughtAt) formData.append("boughtAt", boughtAt)
            if (boughtDate) formData.append("boughtDate", boughtDate)
            if (price) formData.append("price", price)
            formData.append("rating", rating.toString())
            tastingNotes.forEach(note => formData.append('tastingNotes', note));
            if (pairingSuggestions) formData.append("pairingSuggestions", pairingSuggestions)
            if (addToCellar) formData.append("addToCellar", "on")
            if (addToWishlist) formData.append("addToWishlist", "on")

            if (selectedImage) {
                formData.append("image", selectedImage);
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Save failed", message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-24">
            <div className="text-center py-2">
                <p className="text-[10px] text-primary font-bold tracking-widest">V2.8-PRO-TASTING-GRID</p>
            </div>

            {/* Scan Button at Top */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 rounded-3xl p-6 shadow-xl">
                <input
                    type="file"
                    id="camera-input"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => document.getElementById('camera-input')?.click()}
                    disabled={isScanning}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    {isScanning ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            SCANNING...
                        </>
                    ) : (
                        <>
                            <Camera className="h-6 w-6" />
                            SCAN WINE LABEL
                        </>
                    )}
                </button>
                <p className="text-center text-[11px] text-muted-foreground mt-3 italic">
                    Take a pic and let AI do its job
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
                {/* Identity Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <Info className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Identity</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Wine Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sassicaia"
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Producer</label>
                        <input
                            type="text"
                            value={producer}
                            onChange={(e) => setProducer(e.target.value)}
                            placeholder="e.g. Tenuta San Guido"
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Vintage</label>
                            <input
                                type="number"
                                value={vintage}
                                onChange={(e) => setVintage(e.target.value)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as WineType)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {wineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Country</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="Italy"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Region</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="Tuscany"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Sub-Region</label>
                        <input
                            type="text"
                            value={subRegion}
                            onChange={(e) => setSubRegion(e.target.value)}
                            placeholder="Bolgheri"
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Grapes</label>
                        <input
                            type="text"
                            value={grapes}
                            onChange={(e) => setGrapes(e.target.value)}
                            placeholder="Cabernet Sauvignon, Cabernet Franc"
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Comma separated</p>
                    </div>
                </div>

                {/* Specs & Inventory Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <GlassWater className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Specs & Inventory</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Alcohol %</label>
                            <input
                                type="number"
                                step="0.1"
                                value={alcoholContent}
                                onChange={(e) => setAlcoholContent(e.target.value)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Size</label>
                            <input
                                type="text"
                                value={bottleSize}
                                onChange={(e) => setBottleSize(e.target.value)}
                                placeholder="750ml"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Rack A, Shelf 2"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <Calendar className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Timeline</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Drink From</label>
                            <input
                                type="number"
                                value={drinkFrom}
                                onChange={(e) => setDrinkFrom(e.target.value)}
                                placeholder="2028"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Drink To</label>
                            <input
                                type="number"
                                value={drinkTo}
                                onChange={(e) => setDrinkTo(e.target.value)}
                                placeholder="2040"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Purchase Info Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <DollarSign className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Purchase Info</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Bought At (Shop)</label>
                        <input
                            type="text"
                            value={boughtAt}
                            onChange={(e) => setBoughtAt(e.target.value)}
                            placeholder="Wine Merchants Inc"
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                        <div className="flex flex-col" style={{ minWidth: 0, maxWidth: '100%' }}>
                            <label className="block text-sm font-medium mb-2">Date</label>
                            <input
                                type="date"
                                value={boughtDate}
                                onChange={(e) => setBoughtDate(e.target.value)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div className="flex flex-col" style={{ minWidth: 0, maxWidth: '100%' }}>
                            <label className="block text-sm font-medium mb-2">Price paid</label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="€"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <Plus className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Review & Notes</h3>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">Rating</label>
                            <span className="text-primary font-bold text-lg">{rating}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={rating}
                            onChange={(e) => setRating(parseFloat(e.target.value))}
                            className="w-full h-2 bg-card rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="mb-4 block text-sm font-bold uppercase tracking-wider text-primary">Tasting Notes</label>
                        <div className="space-y-6">
                            {Object.entries(tastingNoteOptions).map(([category, notes]) => (
                                <div key={category} className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{category}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {notes.map(note => {
                                            const isSelected = tastingNotes.includes(note);
                                            return (
                                                <button
                                                    key={note}
                                                    type="button"
                                                    onClick={() => toggleNote(note)}
                                                    className={`px-4 py-2 rounded-full border text-[11px] font-bold transition-all active:scale-95 ${isSelected
                                                        ? "bg-primary border-primary text-white shadow-lg"
                                                        : "bg-card border-white/10 text-muted-foreground hover:bg-white/5"
                                                        }`}
                                                >
                                                    {note}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Food Pairings</label>
                        <input
                            type="text"
                            value={pairingSuggestions}
                            onChange={(e) => setPairingSuggestions(e.target.value)}
                            placeholder="Grilled Lamb, Aged Cheese..."
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Destinations Section */}
                <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-inner">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-primary">Destinations</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-row items-center space-x-3 bg-card p-3 rounded-lg border">
                            <input
                                type="checkbox"
                                checked={addToCellar}
                                onChange={(e) => setAddToCellar(e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            <div className="space-y-1 leading-none">
                                <label className="font-bold text-sm">Add to My Cellar</label>
                                <p className="text-[10px] text-muted-foreground">Store in current inventory</p>
                            </div>
                        </div>
                        <div className="flex flex-row items-center space-x-3 bg-card p-3 rounded-lg border">
                            <input
                                type="checkbox"
                                checked={addToWishlist}
                                onChange={(e) => setAddToWishlist(e.target.checked)}
                                className="w-4 h-4 accent-primary"
                            />
                            <div className="space-y-1 leading-none">
                                <label className="font-bold text-sm">Add to Wishlist</label>
                                <p className="text-[10px] text-muted-foreground">Save for future purchase</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-8 text-xl font-bold rounded-2xl shadow-[0_8px_30px_rgb(128,0,32,0.3)] border-b-8 border-primary-foreground/20 active:border-b-0 active:translate-y-1 transition-all bg-primary hover:bg-primary/90 text-white"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            SAVING...
                        </span>
                    ) : (
                        "SAVE TO COLLECTION"
                    )}
                </button>
            </form>
        </div>
    )
}
