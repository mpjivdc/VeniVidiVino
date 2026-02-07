"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wine, Heart, Camera, Plus, FileText } from "lucide-react"

export function BottomNav() {
    const pathname = usePathname()
    const isActive = (path: string) => pathname === path
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <nav className="bg-card/90 backdrop-blur-xl border border-white/5 shadow-2xl rounded-full px-10 py-4 flex items-center justify-between relative">
                <Link
                    href="/cellar"
                    className={`flex flex-col items-center gap-1.5 transition-all ${isActive("/") || isActive("/cellar") ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Wine className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cellar</span>
                </Link>

                {/* Raised FAB Center Button */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                    <Link
                        href="/add"
                        className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-[0_12px_40px_rgba(176,48,67,0.4)] border-[6px] border-[#121212] relative z-[60] transition-transform active:scale-95 group flex items-center justify-center"
                    >
                        <Plus className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                    </Link>
                </div>

                <Link
                    href="/wishlist"
                    className={`flex flex-col items-center gap-1.5 transition-all ${isActive("/wishlist") ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Heart className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Wishlist</span>
                </Link>
            </nav>
        </div>
    )
}
