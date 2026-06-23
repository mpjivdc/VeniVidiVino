"use client"

import { useState } from "react"
import { Wine, WineType } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { updateWineAction, deleteWineAction, moveToCellarAction } from "@/lib/actions"
import { Loader2, Edit2, Trash2, Check, X, Calendar, Euro, GlassWater, Info, Plus, ArrowDownToLine } from "lucide-react"

interface WineDetailViewProps {
    wine: Wine
    sheetTitle: "Cellar" | "Wishlist"
    onClose: () => void
}

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

function StarRating({ rating }: { rating?: number }) {
    if (!rating) return null;
    const filled = Math.round(rating);
    return (
        <span className="text-amber-500 text-xs tracking-wider">
            {"★".repeat(filled)}{"☆".repeat(5 - filled)}
        </span>
    );
}

export function WineDetailView({ wine, sheetTitle, onClose }: WineDetailViewProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isMoving, setIsMoving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const [name, setName] = useState(wine.name)
    const [producer, setProducer] = useState(wine.producer)
    const [vintage, setVintage] = useState(wine.vintage.toString())
    const [type, setType] = useState<WineType>(wine.type)
    const [country, setCountry] = useState(wine.country || "")
    const [region, setRegion] = useState(wine.region || "")
    const [subRegion, setSubRegion] = useState(wine.subRegion || "")
    const [grapes, setGrapes] = useState(wine.grapes?.join(", ") || "")
    const [alcoholContent, setAlcoholContent] = useState(wine.alcoholContent?.toString() || "")
    const [bottleSize, setBottleSize] = useState(wine.bottleSize || "750ml")
    const [quantity, setQuantity] = useState(wine.quantity.toString())
    const [location, setLocation] = useState(wine.location || "")
    const [drinkFrom, setDrinkFrom] = useState(wine.drinkFrom?.toString() || "")
    const [drinkTo, setDrinkTo] = useState(wine.drinkTo?.toString() || "")
    const [boughtAt, setBoughtAt] = useState(wine.boughtAt || "")
    const [boughtDate, setBoughtDate] = useState(wine.boughtDate || "")
    const [price, setPrice] = useState(wine.price?.toString() || "")
    const [rating, setRating] = useState(wine.rating || 3.5)
    const [tastingNotes, setTastingNotes] = useState<string[]>(wine.tastingNotes || [])
    const [pairingSuggestions, setPairingSuggestions] = useState(wine.pairingSuggestions || "")
    const [personalNotes, setPersonalNotes] = useState(wine.personalNotes || "")
    const [expertRatings, setExpertRatings] = useState(wine.expertRatings || "")

    const toggleNote = (note: string) => {
        setTastingNotes(prev =>
            prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
        )
    }

    const handleSave = async () => {
        setIsSaving(true)
        setSaveError(null)
        const formData = new FormData()

        formData.append("name", name)
        formData.append("producer", producer)
        formData.append("vintage", vintage)
        formData.append("type", type)
        if (country) formData.append("country", country)
        if (region) formData.append("region", region)
        if (subRegion) formData.append("subRegion", subRegion)
        if (grapes) {
            grapes.split(',').map(g => g.trim()).filter(g => g).forEach(g => formData.append('grapes', g));
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
        if (personalNotes) formData.append("personalNotes", personalNotes)
        if (expertRatings) formData.append("expertRatings", expertRatings)

        try {
            const result = await updateWineAction(wine.id, formData, sheetTitle)
            if (result?.success) {
                setIsEditing(false)
            } else {
                setSaveError(result?.error || "Save failed. Please try again.")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setSaveError(message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this wine?")) return
        setIsDeleting(true)
        try {
            const result = await deleteWineAction(wine.id, sheetTitle)
            if (result?.success) {
                onClose()
            } else {
                setSaveError(result?.error || "Delete failed. Please try again.")
                setIsDeleting(false)
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setSaveError(message)
            setIsDeleting(false)
        }
    }

    const handleMoveToCellar = async () => {
        setIsMoving(true)
        try {
            const result = await moveToCellarAction(wine)
            if (result?.success) {
                onClose()
            } else {
                setSaveError(result?.error || "Move failed. Please try again.")
                setIsMoving(false)
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setSaveError(message)
            setIsMoving(false)
        }
    }

    if (!isEditing) {
        return (
            <div className="flex flex-col h-screen bg-background overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold leading-tight">{wine.name}</h2>
                        <p className="text-muted-foreground">{wine.producer}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{wine.vintage}</Badge>
                            <Badge variant="outline" className="border-primary/30 text-primary">{wine.type}</Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {sheetTitle === "Wishlist" && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="text-primary hover:bg-primary/10"
                                onClick={handleMoveToCellar}
                                disabled={isMoving}
                                title="Move to Cellar"
                            >
                                {isMoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                            </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={() => { setSaveError(null); setIsEditing(true); }}>
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {saveError && (
                    <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                        {saveError}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-8 pb-40">
                    {wine.image && (
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden border shadow-inner bg-muted">
                            <img src={wine.image} alt={wine.name} className="object-cover w-full h-full" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card border rounded-xl p-4 space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Quantity</p>
                            <p className="text-xl font-bold">{wine.quantity} <span className="text-sm font-normal text-muted-foreground">bottles</span></p>
                        </div>
                        <div className="bg-card border rounded-xl p-4 space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Rating</p>
                            <div className="flex items-center gap-2">
                                <p className="text-xl font-bold">{wine.rating || "N/A"}</p>
                                <StarRating rating={wine.rating} />
                            </div>
                        </div>
                    </div>

                    {/* Expert Ratings */}
                    {wine.expertRatings && (
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    try {
                                        const ratings = JSON.parse(wine.expertRatings);
                                        if (!Array.isArray(ratings) || ratings.length === 0) return null;

                                        const sourceColors: Record<string, string> = {
                                            'Parker': 'bg-[#B03043] text-white',
                                            'Decanter': 'bg-[#003366] text-white',
                                            'Suckling': 'bg-[#D4AF37] text-black',
                                            'Spectator': 'bg-[#2F4F4F] text-white',
                                            'Vinous': 'bg-[#4B0082] text-white',
                                            'Jancis': 'bg-[#556B2F] text-white',
                                        };

                                        return ratings.map((r: { source: string; score: string }, i: number) => (
                                            <div key={i} className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider flex items-center gap-2 ${sourceColors[r.source] || 'bg-muted text-muted-foreground'}`}>
                                                <span className="opacity-70">{r.source.toUpperCase()}</span>
                                                <span className="text-sm border-l border-white/20 pl-2">{r.score}</span>
                                            </div>
                                        ));
                                    } catch {
                                        return <p className="text-[10px] text-destructive">Invalid ratings data</p>;
                                    }
                                })()}
                            </div>
                            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">AI-estimated — verify with official sources</p>
                        </div>
                    )}

                    {/* Identity & Specs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <Info className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Wine Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Origin</p>
                                <p>{wine.region ? `${wine.region}, ` : ""}{wine.country}</p>
                                {wine.subRegion && <p className="text-xs text-muted-foreground">{wine.subRegion}</p>}
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Varietal</p>
                                <p className="truncate">{wine.grapes?.join(", ") || "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Alcohol</p>
                                <p>{wine.alcoholContent ? `${wine.alcoholContent}%` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Bottle Size</p>
                                <p>{wine.bottleSize || "750ml"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Location</p>
                                <p>{wine.location || "Not specified"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tasting Notes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <GlassWater className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Tasting Notes</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {wine.tastingNotes && wine.tastingNotes.length > 0 ? (
                                wine.tastingNotes.map(note => <Badge key={note} variant="secondary" className="bg-primary/5 text-primary border-primary/20">{note}</Badge>)
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No tasting notes recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {wine.pairingSuggestions && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary border-b pb-1">
                                <Info className="w-4 h-4" />
                                <h3 className="font-bold text-sm uppercase tracking-wider">Food Pairings</h3>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <p className="text-sm italic leading-relaxed">&quot;{wine.pairingSuggestions}&quot;</p>
                            </div>
                        </div>
                    )}

                    {wine.personalNotes && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary border-b pb-1">
                                <Info className="w-4 h-4" />
                                <h3 className="font-bold text-sm uppercase tracking-wider">Personal Notes</h3>
                            </div>
                            <div className="p-4 bg-card border rounded-xl">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{wine.personalNotes}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <Calendar className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Timeline & Purchase</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 border rounded-lg bg-card">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Drinking Window</p>
                                <p className="font-semibold">{wine.drinkFrom || "Now"} — {wine.drinkTo || "Keep"}</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-card">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Price Paid</p>
                                <p className="font-semibold text-green-600">{wine.price ? `€${wine.price.toFixed(2)}` : "N/A"}</p>
                            </div>
                        </div>
                        {(wine.boughtAt || wine.boughtDate) && (
                            <div className="text-xs text-muted-foreground">
                                Purchased {wine.boughtDate && `on ${new Date(wine.boughtDate).toLocaleDateString()}`} {wine.boughtAt && `from ${wine.boughtAt}`}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 text-[10px] text-center text-muted-foreground uppercase tracking-widest opacity-50">
                        Added to collection on {new Date(wine.dateAdded).toLocaleDateString()}
                    </div>
                </div>
            </div>
        )
    }

    // Edit Mode
    return (
        <div className="flex flex-col h-screen bg-background overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-start">
                <div className="flex-1">
                    <h2 className="text-xl font-bold">Edit Wine</h2>
                    <p className="text-sm text-muted-foreground">Update wine details</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setSaveError(null); setIsEditing(false); }}>
                        <X className="w-4 h-4" />
                    </Button>
                    <Button variant="default" size="icon" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {saveError && (
                <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                    {saveError}
                </div>
            )}

            {/* Edit Form */}
            <div className="p-6 space-y-8 pb-40">
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
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Producer</label>
                        <input
                            type="text"
                            value={producer}
                            onChange={(e) => setProducer(e.target.value)}
                            placeholder="e.g. Tenuta San Guido"
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Vintage</label>
                            <input
                                type="number"
                                value={vintage}
                                onChange={(e) => setVintage(e.target.value)}
                                placeholder="e.g. 2019"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30"
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
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Region</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
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
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Grapes <span className="text-muted-foreground font-normal">(comma separated)</span></label>
                        <input
                            type="text"
                            value={grapes}
                            onChange={(e) => setGrapes(e.target.value)}
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
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
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Drink To</label>
                            <input
                                type="number"
                                value={drinkTo}
                                onChange={(e) => setDrinkTo(e.target.value)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Purchase Info Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <Euro className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">€ Purchase Info</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Bought At (Shop)</label>
                        <input
                            type="text"
                            value={boughtAt}
                            onChange={(e) => setBoughtAt(e.target.value)}
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Date</label>
                            <input
                                type="date"
                                value={boughtDate}
                                onChange={(e) => setBoughtDate(e.target.value)}
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Price paid</label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="€"
                                className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                            placeholder="e.g. Grilled Lamb, Aged Cheese..."
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Personal Notes</label>
                        <textarea
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                            placeholder="e.g. Gift from Sarah, better if decanted for 2 hours..."
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30 min-h-[120px] resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Expert Ratings</label>
                        <p className="text-[10px] text-muted-foreground/60 mb-2 uppercase tracking-widest">AI-estimated · verify with official sources</p>
                        <textarea
                            value={expertRatings}
                            onChange={(e) => setExpertRatings(e.target.value)}
                            placeholder='[{"source": "Parker", "score": "96"}, ...]'
                            className="w-full bg-card border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/30 min-h-[80px] resize-none font-mono text-xs"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    className="w-full py-8 text-xl font-bold rounded-2xl shadow-[0_8px_30px_rgb(128,0,32,0.3)] border-b-8 border-primary-foreground/20 active:border-b-0 active:translate-y-1 transition-all bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <span className="flex items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            SAVING...
                        </span>
                    ) : (
                        "SAVE CHANGES"
                    )}
                </button>
            </div>
        </div>
    )
}
