"use client"

import { useState } from "react"
import { Wine } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { updateWineAction, deleteWineAction } from "@/lib/actions"
import { Loader2, Edit2, Trash2, Check, X, Calendar, MapPin, DollarSign, GlassWater, Info, Wine as WineIcon } from "lucide-react"

interface WineDetailViewProps {
    wine: Wine
    sheetTitle: "Cellar" | "Wishlist"
    onClose: () => void
}

export function WineDetailView({ wine, sheetTitle, onClose }: WineDetailViewProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Edit state
    const [quantity, setQuantity] = useState(wine.quantity.toString())
    const [rating, setRating] = useState([wine.rating || 3.5])
    const [tastingNotes, setTastingNotes] = useState<string[]>(wine.tastingNotes || [])

    const tastingNoteOptions = {
        Fruit: ["Red Cherry", "Raspberry", "Black Plum", "Blackberry", "Lemon", "Green Apple", "Peach", "Apricot"],
        Floral: ["Rose", "Violet", "Blossom", "Honeysuckle"],
        "Earthy/Savory": ["Forest Floor", "Mushroom", "Leather", "Tobacco", "Wet Stones"],
        "Spice & Oak": ["Vanilla", "Cedar", "Black Pepper", "Cloves", "Smoke", "Chocolate"],
        Structure: ["High Acidity", "Firm Tannins", "Full-Bodied", "Silky", "Crisp"],
    };

    const toggleNote = (note: string) => {
        if (tastingNotes.includes(note)) {
            setTastingNotes(tastingNotes.filter(n => n !== note))
        } else {
            setTastingNotes([...tastingNotes, note])
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        const formData = new FormData()
        formData.append("quantity", quantity)
        formData.append("rating", rating[0].toString())
        tastingNotes.forEach(note => formData.append("tastingNotes", note))

        try {
            const result = await updateWineAction(wine.id, formData, sheetTitle)
            if (result?.success) {
                setIsEditing(false)
            } else {
                console.error(`Update failed: ${result?.error || "Unknown error"}`)
            }
        } catch (error: any) {
            console.error("Save error", error)
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
                console.error(`Delete failed: ${result?.error || "Unknown error"}`)
                setIsDeleting(false)
            }
        } catch (error: any) {
            console.error("Delete error", error)
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background max-h-[90vh]">
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
                {!isEditing ? (
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button variant="default" size="icon" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Image Section */}
                {wine.image && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border shadow-inner bg-muted">
                        <img src={wine.image} alt={wine.name} className="object-cover w-full h-full" />
                    </div>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border rounded-xl p-4 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Quantity</p>
                        {isEditing ? (
                            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-8" />
                        ) : (
                            <p className="text-xl font-bold">{wine.quantity} <span className="text-sm font-normal text-muted-foreground">bottles</span></p>
                        )}
                    </div>
                    <div className="bg-card border rounded-xl p-4 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Rating</p>
                        {isEditing ? (
                            <div className="pt-2">
                                <span className="text-xs font-bold text-primary">{rating[0]}</span>
                                <Slider min={0} max={5} step={0.1} value={rating} onValueChange={setRating} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <p className="text-xl font-bold">{wine.rating || "N/A"}</p>
                                <span className="text-amber-500 text-xs">★ ★ ★ ★ ★</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Identity & Specs */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <Info className="w-4 h-4" />
                        <h3 className="font-bold text-xs uppercase tracking-wider">Wine Details</h3>
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
                            <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /> {wine.location || "Not specified"}</p>
                        </div>
                    </div>
                </div>

                {/* Tasting Notes */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <GlassWater className="w-4 h-4" />
                        <h3 className="font-bold text-xs uppercase tracking-wider">Tasting Notes</h3>
                    </div>
                    {isEditing ? (
                        <div className="space-y-3">
                            {Object.entries(tastingNoteOptions).map(([category, notes]) => (
                                <div key={category}>
                                    <p className="text-[10px] text-muted-foreground font-bold mb-1 uppercase tracking-tighter">{category}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {notes.map(note => {
                                            const isSelected = tastingNotes.includes(note);
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
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {wine.tastingNotes && wine.tastingNotes.length > 0 ? (
                                wine.tastingNotes.map(note => <Badge key={note} variant="secondary" className="bg-primary/5 text-primary border-primary/20">{note}</Badge>)
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No tasting notes recorded yet.</p>
                            )}
                        </div>
                    )}
                    {!isEditing && wine.pairingSuggestions && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Pairings</p>
                            <p className="text-sm italic">"{wine.pairingSuggestions}"</p>
                        </div>
                    )}
                </div>

                {/* Pairing Suggestions */}
                {wine.pairingSuggestions && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b pb-1">
                            <GlassWater className="w-4 h-4" />
                            <h3 className="font-bold text-xs uppercase tracking-wider">Food Pairings</h3>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-sm">🍴</span>
                            </div>
                            <p className="text-sm italic leading-relaxed">"{wine.pairingSuggestions}"</p>
                        </div>
                    </div>
                )}

                {/* Timeline & Purchase */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                        <Calendar className="w-4 h-4" />
                        <h3 className="font-bold text-xs uppercase tracking-wider">Timeline & Purchase</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 border rounded-lg bg-card">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Drinking Window</p>
                            <p className="font-semibold">{wine.drinkFrom || "Now"} — {wine.drinkTo || "Keep"}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-card">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Price Paid</p>
                            <p className="font-semibold text-green-600">{wine.price ? `$${wine.price.toFixed(2)}` : "N/A"}</p>
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
