"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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

const wineTypes: WineType[] = ["Red", "White", "Rose", "Sparkling", "Dessert", "Fortified"]

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    producer: z.string().min(2, "Producer is required"),
    year: z.string().regex(/^\d{4}$/, "Must be a valid year"),
    type: z.enum(["Red", "White", "Rose", "Sparkling", "Dessert", "Fortified"]),
    region: z.string().optional(),
    country: z.string().optional(),
    rating: z.array(z.number()),
    notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AddWineForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            producer: "",
            year: new Date().getFullYear().toString(),
            type: "Red",
            region: "",
            country: "",
            rating: [3.5],
            notes: "",
        },
    })

    const [isScanning, setIsScanning] = useState(false)

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            setPreviewUrl(URL.createObjectURL(file))

            // Trigger AI Scan automatically
            await scanLabel(file)
        }
    }

    const scanLabel = async (file: File) => {
        setIsScanning(true)
        try {
            const formData = new FormData()
            formData.append("image", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Scan failed")

            const data = await response.json()

            // Auto-fill form
            if (data.name) form.setValue("name", data.name)
            if (data.producer) form.setValue("producer", data.producer)
            if (data.year) form.setValue("year", data.year.toString())
            if (data.type) form.setValue("type", data.type)
            if (data.region) form.setValue("region", data.region)
            if (data.country) form.setValue("country", data.country)

        } catch (error) {
            console.error("Error scanning label:", error)
            // Optional: Show toast error
        } finally {
            setIsScanning(false)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        const formData = new FormData()

        // Append all text fields
        Object.entries(values).forEach(([key, value]) => {
            if (key === 'rating') {
                // Extract single number from array
                formData.append(key, value[0].toString())
            } else {
                formData.append(key, value as string)
            }
        })

        if (selectedImage) {
            formData.append("image", selectedImage)
        }

        try {
            await createWine(formData)
            // Redirect happens in server action
        } catch (error) {
            console.error("Failed to add wine", error)
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Cabernet Sauvignon" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="producer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Producer</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Stag's Leap" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {wineTypes.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Region</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Napa Valley" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. USA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center mb-2">
                                <FormLabel>Rating</FormLabel>
                                <span className="text-sm font-medium text-primary">{field.value[0]}</span>
                            </div>
                            <FormControl>
                                <Slider
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormItem>
                    <FormLabel>Wine Label Photo</FormLabel>
                    <div className="flex flex-col gap-4">
                        {previewUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full relative"
                                disabled={isScanning}
                                onClick={() => document.getElementById('camera-input')?.click()}
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Scan Label
                                    </>
                                )}
                                <input
                                    id="camera-input"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </Button>
                        </div>
                    </div>
                </FormItem>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Tasting notes..." className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding Wine...
                        </>
                    ) : (
                        "Add to Cellar"
                    )}
                </Button>
            </form>
        </Form>
    )
}
