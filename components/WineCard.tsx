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

export const getFlag = (countryName: string) => {
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
    for (const [key, value] of Object.entries(flags)) {
        if (countryName.toLowerCase().includes(key.toLowerCase())) return value;
    }
    return "🏳️";
};

const WineBottleSVG = () => (
    <svg viewBox="0 0 60 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-36 opacity-[0.07]">
        <rect x="22" y="0" width="16" height="20" rx="3" fill="currentColor" />
        <path d="M22 20 C16 32 12 44 12 60 L12 145 C12 152 17 158 24 158 L36 158 C43 158 48 152 48 145 L48 60 C48 44 44 32 38 20 Z" fill="currentColor" />
        <rect x="12" y="80" width="36" height="3" rx="1.5" fill="black" opacity="0.15" />
    </svg>
);

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

        if (optimisticQuantity === 1 && delta === -1) {
            const confirmed = window.confirm("Was this your last bottle? This wine will be moved to your history.");
            if (!confirmed) return;
            next = 0;
        }

        setOptimisticQuantity(next);
        if (onQuantityChange) onQuantityChange(wine.id, next);

        const result = await updateQuantityAction(wine.id, next, sheetTitle);
        if (!result.success) {
            setOptimisticQuantity(wine.quantity);
            if (onQuantityChange) onQuantityChange(wine.id, wine.quantity);
        }
    };

    const currentYear = new Date().getFullYear();
    let windowStatus = { dotColor: "", label: "No window info" };

    if (wine.drinkFrom && wine.drinkTo) {
        if (currentYear < wine.drinkFrom) {
            windowStatus = { dotColor: "bg-blue-500", label: "Too young" };
        } else if (currentYear >= wine.drinkFrom && currentYear < wine.drinkTo) {
            windowStatus = { dotColor: "bg-green-500", label: "Ready to drink" };
        } else if (currentYear === wine.drinkTo) {
            windowStatus = { dotColor: "bg-orange-500", label: "Drink now" };
        } else if (currentYear > wine.drinkTo) {
            windowStatus = { dotColor: "bg-red-500", label: "Past peak" };
        }
    }

    const countryFlag = wine.country ? getFlag(wine.country) : "";

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Card className={`overflow-hidden border-white/5 bg-card rounded-2xl shadow-lg transition-all hover:bg-white/[0.02] active:scale-[0.97] cursor-pointer flex flex-col ${optimisticQuantity === 0 ? "opacity-50" : ""}`}>
                    {/* Image Hero */}
                    <div className="h-44 relative bg-gradient-to-b from-black/20 to-black/40 shrink-0 overflow-hidden">
                        {wine.image ? (
                            <img
                                src={wine.image}
                                alt={wine.name}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-foreground">
                                <WineBottleSVG />
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                        {/* Vintage badge — bottom-left */}
                        {wine.vintage && (
                            <div className="absolute bottom-2 left-2">
                                <span className="text-[10px] font-black text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md tracking-wider">
                                    {wine.vintage}
                                </span>
                            </div>
                        )}

                        {/* Finished badge */}
                        {optimisticQuantity === 0 && (
                            <div className="absolute top-2 left-2">
                                <Badge variant="destructive" className="bg-primary text-[9px] px-2 py-0.5 border-none uppercase font-black tracking-wider">
                                    Finished
                                </Badge>
                            </div>
                        )}

                        {/* Drink window dot — top-right */}
                        {windowStatus.dotColor && (
                            <div className="absolute top-2.5 right-2.5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className={`w-2.5 h-2.5 rounded-full ${windowStatus.dotColor} shadow-lg ring-2 ring-black/30`} />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-popover text-foreground border-white/10">
                                            <p className="text-xs font-semibold">{windowStatus.label}</p>
                                            <p className="text-[10px] opacity-70">Window: {wine.drinkFrom}–{wine.drinkTo}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <CardContent className="p-3 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                            <h3 className="font-bold text-[13px] leading-tight line-clamp-2 flex-1 text-foreground">
                                {countryFlag && <span className="mr-1">{countryFlag}</span>}
                                {wine.name}
                            </h3>
                            {wine.rating && (
                                <span className="text-primary font-black text-xs shrink-0">{wine.rating}</span>
                            )}
                        </div>

                        <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 mb-2">
                            {wine.producer}
                        </p>

                        <div className="flex items-center gap-1.5 mt-auto">
                            <Badge variant="outline" className="text-[9px] px-1.5 h-5 border-primary/30 text-primary font-bold uppercase tracking-wider">
                                {wine.type}
                            </Badge>
                            {wine.region && (
                                <span className="text-[9px] text-muted-foreground/50 font-medium truncate">{wine.region}</span>
                            )}
                        </div>

                        {/* Quantity controls */}
                        <div
                            className="flex items-center justify-between bg-white/[0.03] rounded-xl border border-white/5 mt-3 px-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted-foreground"
                                onClick={(e) => handleQuantityChange(e, -1)}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-[11px] font-black text-foreground min-w-[1.5rem] text-center">
                                {optimisticQuantity}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted-foreground"
                                onClick={(e) => handleQuantityChange(e, 1)}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
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
