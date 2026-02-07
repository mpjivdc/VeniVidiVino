"use client"

import { Wine as WineType } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { WineDetailView } from "./WineDetailView"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "./ui/button"
import { updateQuantityAction } from "@/lib/actions"

const getFlag = (countryName: string) => {
    const flags: Record<string, string> = {
        "France": "🇫🇷",
        "Italy": "🇮🇹",
        "Spain": "🇪🇸",
        "USA": "🇺🇸",
        "United States": "🇺🇸",
        "Germany": "🇩🇪",
        "Portugal": "🇵🇹",
        "Argentina": "🇦🇷",
        "Chile": "🇨🇱",
        "Australia": "🇦🇺",
        "New Zealand": "🇳🇿",
        "South Africa": "🇿🇦",
        "Austria": "🇦🇹",
    };
    // Basic fuzzy match or direct lookup
    for (const [key, value] of Object.entries(flags)) {
        if (countryName.toLowerCase().includes(key.toLowerCase())) return value;
    }
    return "🏳️";
};

interface WineCardProps {
    wine: WineType
    sheetTitle: "Cellar" | "Wishlist"
    onQuantityChange?: (id: string, newQuantity: number) => void
}

export function WineCard({ wine, sheetTitle, onQuantityChange }: WineCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [optimisticQuantity, setOptimisticQuantity] = useState(wine.quantity)

    const handleQuantityChange = async (e: React.MouseEvent, delta: number) => {
        e.stopPropagation();
        let next = Math.max(0, optimisticQuantity + delta);
        if (next === optimisticQuantity) return;

        // Last bottle confirmation logic
        if (optimisticQuantity === 1 && delta === -1) {
            const confirmed = window.confirm("Was this your last bottle? This wine will be moved to your history.");
            if (!confirmed) return;
            next = 0;
        }

        setOptimisticQuantity(next);

        // Notify parent immediately for instant filtering
        if (onQuantityChange) {
            onQuantityChange(wine.id, next);
        }

        const result = await updateQuantityAction(wine.id, next, sheetTitle);
        if (!result.success) {
            setOptimisticQuantity(wine.quantity); // Revert on failure
            if (onQuantityChange) {
                onQuantityChange(wine.id, wine.quantity);
            }
        }
    };

    // Drinking Window Logic (Definitive 2026 implementation)
    const currentYear = 2026;
    let windowStatus: { color: string, label: string } | null = null;

    if (wine.drinkFrom && wine.drinkTo) {
        if (currentYear < wine.drinkFrom) {
            windowStatus = { color: "bg-blue-500", label: "Too young" }
        } else if (currentYear >= wine.drinkFrom && currentYear < wine.drinkTo) {
            windowStatus = { color: "bg-green-500", label: "Ready to drink" }
        } else if (currentYear === wine.drinkTo) {
            windowStatus = { color: "bg-orange-500", label: "Drink now" }
        } else if (currentYear > wine.drinkTo) {
            windowStatus = { color: "bg-red-500", label: "Past peak" }
        }
    }

    const countryFlag = wine.country ? getFlag(wine.country) : "";

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Card className={`overflow-hidden border-white/5 bg-card rounded-xl shadow-lg transition-all hover:bg-white/[0.02] active:scale-[0.98] cursor-pointer relative ${optimisticQuantity === 0 ? "opacity-50" : ""}`}>
                    {optimisticQuantity === 0 && (
                        <div className="absolute top-2 right-12 z-10 transition-all scale-110">
                            <Badge variant="destructive" className="bg-primary hover:bg-primary text-[9px] px-2 py-0.5 shadow-lg border-none uppercase font-black tracking-wider">Finished</Badge>
                        </div>
                    )}
                    {windowStatus && (
                        <div className="absolute top-3 right-3 z-10">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={`w-2.5 h-2.5 rounded-full ${windowStatus.color.replace('bg-', 'bg-')} shadow-sm shadow-black/50`} />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-popover text-foreground border-white/10">
                                        <p className="text-xs font-semibold">{windowStatus.label}</p>
                                        <p className="text-[10px] opacity-70">Window: {wine.drinkFrom} - {wine.drinkTo}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                    <CardContent className="p-0 flex h-32">
                        <div className="w-24 relative bg-black/20 shrink-0">
                            {wine.image ? (
                                <img
                                    src={wine.image}
                                    alt={wine.name}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-[10px] p-2 text-center uppercase font-bold tracking-tighter opacity-50">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-sm line-clamp-2 leading-tight pr-4 text-foreground">
                                        {countryFlag && <span className="mr-1.5">{countryFlag}</span>}
                                        {wine.name}
                                    </h3>
                                    {wine.rating && (
                                        <div className="flex items-center text-primary font-black text-xs shrink-0 ml-2">
                                            {wine.rating}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">{wine.producer}</p>
                                {wine.country && <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{wine.region ? `${wine.region}, ` : ''}{wine.country}</p>}
                            </div>
                            <div className="flex items-center gap-2 mt-2 overflow-hidden">
                                <div className="flex items-center bg-white/5 rounded-full border border-white/5 px-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground"
                                        onClick={(e) => handleQuantityChange(e, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-[11px] font-black min-w-[1.2rem] text-center text-foreground">{optimisticQuantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground"
                                        onClick={(e) => handleQuantityChange(e, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Badge variant="secondary" className="bg-white/5 text-muted-foreground text-[9px] px-2 h-6 shrink-0 border-none font-bold">{wine.vintage}</Badge>
                                <Badge variant="outline" className="text-[9px] px-2 h-6 border-primary/30 text-primary shrink-0 truncate font-bold uppercase tracking-wider">{wine.type}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </DrawerTrigger>
            <DrawerContent className="p-0 border-none bg-transparent">
                <WineDetailView wine={{ ...wine, quantity: optimisticQuantity }} sheetTitle={sheetTitle} onClose={() => setIsOpen(false)} />
            </DrawerContent>
        </Drawer>
    )
}
