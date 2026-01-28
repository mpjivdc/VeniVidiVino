"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wine, Heart, Camera, Plus, FileText } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "./ui/button"

export function BottomNav() {
    const pathname = usePathname()
    const isActive = (path: string) => pathname === path

    return (
        <div className="fixed bottom-[2rem] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg">
            <nav className="bg-card/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[2.5rem] px-8 py-3 flex items-center justify-between relative">
                <Link
                    href="/cellar"
                    className={`flex flex-col items-center gap-1 transition-all ${isActive("/") || isActive("/cellar") ? "text-primary scale-110 font-bold" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Wine className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-tighter">Cellar</span>
                </Link>

                {/* Raised FAB Center Button */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                size="icon"
                                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-[0_12px_40px_rgba(128,0,32,0.6)] border-[4px] border-background relative z-[60] transition-transform active:scale-95 group"
                            >
                                <Plus className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-52 p-2 bg-card/98 backdrop-blur-xl border-white/10 rounded-3xl mb-6 shadow-2xl" align="center">
                            <div className="flex flex-col gap-1.5 p-1">
                                <Link href="/add?action=scan" className="flex items-center gap-3 p-4 hover:bg-primary text-white hover:text-white rounded-2xl transition-all text-sm font-bold bg-primary/20">
                                    <Camera className="h-5 w-5" />
                                    Scan Wine Label
                                </Link>
                                <Link href="/add" className="flex items-center gap-3 p-4 hover:bg-primary/10 rounded-2xl transition-all text-sm font-medium border border-white/5">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Manual Entry
                                </Link>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <Link
                    href="/wishlist"
                    className={`flex flex-col items-center gap-1 transition-all ${isActive("/wishlist") ? "text-primary scale-110 font-bold" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Heart className="h-5 w-5" />
                    <span className="text-[10px] uppercase tracking-tighter">Wishlist</span>
                </Link>
            </nav>
        </div>
    )
}
