"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, Info, GlassWater, Calendar, Euro, Plus, X, Check, Filter, History } from "lucide-react"
import { createWine, fetchRatings } from "@/lib/actions"
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

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
        {children}
    </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full bg-card border border-white/5 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/30 ${props.className || ''}`}
    />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        {...props}
        className={`w-full bg-card border border-white/5 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${props.className || ''}`}
    />
);

export function AddWineForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState("")
    const [producer, setProducer] = useState("")
    const [vintage, setVintage] = useState("")
    const [type, setType] = useState<WineType | "">("")
    const [country, setCountry] = useState("")
    const [region, setRegion] = useState("")
    const [subRegion, setSubRegion] = useState("")
    const [grapes, setGrapes] = useState("")
    const [alcoholContent, setAlcoholContent] = useState("")
    const [bottleSize, setBottleSize] = useState("")
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
    const [personalNotes, setPersonalNotes] = useState("")
    const [expertRatings, setExpertRatings] = useState("")

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

            // NEW: Fetch expert ratings
            if (data.name && data.year) {
                const ratings = await fetchRatings(data.name, data.year);
                if (ratings && ratings.length > 0) {
                    setExpertRatings(JSON.stringify(ratings));
                }
            }
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
            if (personalNotes) formData.append("personalNotes", personalNotes)
            if (expertRatings) formData.append("expertRatings", expertRatings)

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
        <div className="space-y-10 pb-32">
            <div className="text-center py-2">
                <p className="text-[10px] text-primary font-black tracking-[0.2em] uppercase opacity-80">V5.2-RATINGS-UI-FIX</p>
            </div>

            {/* Scan Button at Top */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card border border-white/5 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
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
                        disabled={isScanning || isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 px-8 rounded-2xl shadow-[0_10px_30px_rgba(176,48,67,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-sm tracking-widest disabled:opacity-50"
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                SCANNING LABEL...
                            </>
                        ) : (
                            <>
                                <Camera className="h-5 w-5" />
                                SCAN WINE LABEL
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold tracking-wider uppercase opacity-60">
                        AI Label Recognition
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-12">
                {/* Identity Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-2 ml-1">
                        <Info className="w-4 h-4" />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Identity</h3>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <Label>Wine Name</Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sassicaia"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <Label>Producer</Label>
                            <Input
                                type="text"
                                value={producer}
                                onChange={(e) => setProducer(e.target.value)}
                                placeholder="e.g. Tenuta San Guido"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Vintage</Label>
                                <Input
                                    type="number"
                                    value={vintage}
                                    onChange={(e) => setVintage(e.target.value)}
                                    placeholder="e.g. 2019"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as WineType)}
                                    disabled={isSubmitting}
                                >
                                    <option value="" disabled className="bg-[#1e1e1e]">Select type</option>
                                    {wineTypes.map(t => <option key={t} value={t} className="bg-[#1e1e1e]">{t.toUpperCase()}</option>)}
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Country</Label>
                                <Input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="e.g. Italy"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Label>Region</Label>
                                <Input
                                    type="text"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    placeholder="e.g. Tuscany"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Sub-Region</Label>
                            <Input
                                type="text"
                                value={subRegion}
                                onChange={(e) => setSubRegion(e.target.value)}
                                placeholder="e.g. Bolgheri"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <Label>Grapes</Label>
                            <Input
                                type="text"
                                value={grapes}
                                onChange={(e) => setGrapes(e.target.value)}
                                placeholder="e.g. Cabernet Sauvignon, Cabernet Franc"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                {/* Specs Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-2 ml-1">
                        <GlassWater className="w-4 h-4" />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Specs & Inventory</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Alcohol %</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={alcoholContent}
                                    onChange={(e) => setAlcoholContent(e.target.value)}
                                    placeholder="e.g. 14.0"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Label>Bottle Size</Label>
                                <Input
                                    type="text"
                                    value={bottleSize}
                                    onChange={(e) => setBottleSize(e.target.value)}
                                    placeholder="e.g. 750ml"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Rack B-12"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-2 ml-1">
                        <Calendar className="w-4 h-4" />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Timeline</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Drink From</Label>
                            <Input
                                type="number"
                                value={drinkFrom}
                                onChange={(e) => setDrinkFrom(e.target.value)}
                                placeholder="2028"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label>Drink To</Label>
                            <Input
                                type="number"
                                value={drinkTo}
                                onChange={(e) => setDrinkTo(e.target.value)}
                                placeholder="2045"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                {/* Purchase Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-2 ml-1">
                        <Euro className="w-4 h-4" />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">€ PURCHASE INFO</h3>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <Label>Retailer / Source</Label>
                            <Input
                                type="text"
                                value={boughtAt}
                                onChange={(e) => setBoughtAt(e.target.value)}
                                placeholder="e.g. Enoteca Pinchiorri"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={boughtDate}
                                    onChange={(e) => setBoughtDate(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Label>Price Paid</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-8"
                                        disabled={isSubmitting}
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">€</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-2 ml-1">
                        <Plus className="w-4 h-4" />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Review & Notes</h3>
                    </div>

                    <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <Label>Rating</Label>
                            <span className="text-primary font-black text-2xl tracking-tighter">{rating.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={rating}
                            onChange={(e) => setRating(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-between mt-2 text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                            <span>0.0</span>
                            <span>2.5</span>
                            <span>5.0</span>
                        </div>
                    </div>

                    <div>
                        <Label>EXPERT RATINGS</Label>
                        <Input
                            type="text"
                            value={expertRatings}
                            onChange={(e) => setExpertRatings(e.target.value)}
                            placeholder="After adding your wine, expert ratings will be added when available."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <Label>Tasting Notes</Label>
                        <div className="space-y-8 mt-4 bg-white/[0.01] p-6 rounded-3xl border border-white/5">
                            {Object.entries(tastingNoteOptions).map(([category, notes]) => (
                                <div key={category} className="space-y-4">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">{category}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {notes.map(note => {
                                            const isSelected = tastingNotes.includes(note);
                                            return (
                                                <button
                                                    key={note}
                                                    type="button"
                                                    onClick={() => !isSubmitting && toggleNote(note)}
                                                    className={`px-4 py-2.5 rounded-full border text-[10px] font-black transition-all active:scale-[0.98] tracking-wider uppercase ${isSelected
                                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                        : "bg-[#252525] border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                                        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    disabled={isSubmitting}
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
                        <Label>Food Pairings</Label>
                        <Input
                            type="text"
                            value={pairingSuggestions}
                            onChange={(e) => setPairingSuggestions(e.target.value)}
                            placeholder="e.g. Bistecca alla Fiorentina"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <Label>Personal Notes</Label>
                        <textarea
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                            placeholder="e.g. Gift from Sarah, better if decanted for 2 hours..."
                        />
                    </div>


                </div>

                {/* Destinations Section */}
                <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                    <Label>Destinations</Label>
                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => !isSubmitting && setAddToCellar(!addToCellar)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${addToCellar
                                ? "bg-primary/10 border-primary/30"
                                : "bg-card border-white/5"} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={isSubmitting}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className={`text-xs font-black uppercase tracking-widest ${addToCellar ? "text-primary" : "text-foreground"}`}>My Cellar</span>
                                <span className="text-[10px] text-muted-foreground font-medium">Add to current inventory</span>
                            </div>
                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${addToCellar ? "bg-primary border-primary" : "border-white/10"}`}>
                                {addToCellar && <Plus className="h-3 w-3 text-white" />}
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => !isSubmitting && setAddToWishlist(!addToWishlist)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${addToWishlist
                                ? "bg-primary/10 border-primary/30"
                                : "bg-card border-white/5"} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={isSubmitting}
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className={`text-xs font-black uppercase tracking-widest ${addToWishlist ? "text-primary" : "text-foreground"}`}>Wishlist</span>
                                <span className="text-[10px] text-muted-foreground font-medium">Save for later purchase</span>
                            </div>
                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${addToWishlist ? "bg-primary border-primary" : "border-white/10"}`}>
                                {addToWishlist && <Plus className="h-3 w-3 text-white" />}
                            </div>
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-6 text-sm font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_15px_45px_rgba(176,48,67,0.3)] transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 text-white relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-0"></div>
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            SAVING...
                        </span>
                    ) : (
                        "SAVE TO COLLECTION"
                    )}
                </button>
            </form >
        </div >
    )
}
