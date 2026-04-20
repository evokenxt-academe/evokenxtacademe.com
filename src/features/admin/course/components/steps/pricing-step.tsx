"use client"

import {
    IconCurrencyRupee,
    IconDiscount2,
    IconTag,
    IconPercentage,
} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import type { CourseFormData } from "../../types/course"

interface PricingStepProps {
    formData: CourseFormData
    errors: Record<string, string>
    stats: { discountPercent: number }
    updateField: <K extends keyof CourseFormData>(key: K, value: CourseFormData[K]) => void
}

export function PricingStep({
    formData,
    errors,
    stats,
    updateField,
}: PricingStepProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconTag className="size-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Pricing</h2>
                    <p className="text-sm text-muted-foreground">
                        Set your course price and optional discount in Indian Rupees
                    </p>
                </div>
            </div>

            <FieldGroup>
                {/* Price */}
                <Field>
                    <FieldLabel htmlFor="course-price">
                        Course Price (₹ INR)
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                            ₹
                        </span>
                        <Input
                            id="course-price"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="0"
                            value={formData.price || ""}
                            onChange={(e) =>
                                updateField("price", parseFloat(e.target.value) || 0)
                            }
                            className="h-10 text-lg font-semibold"
                        />
                    </div>
                    <FieldDescription>
                        Set to 0 for a free course. Prices are in Indian Rupees (₹).
                    </FieldDescription>
                </Field>

                {/* Discount Price */}
                <Field data-invalid={!!errors.discountPrice || undefined}>
                    <FieldLabel htmlFor="course-discount">
                        Discount Price (₹ INR)
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                            ₹
                        </span>
                        <Input
                            id="course-discount"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="0"
                            value={formData.discountPrice || ""}
                            onChange={(e) =>
                                updateField("discountPrice", parseFloat(e.target.value) || 0)
                            }
                            aria-invalid={!!errors.discountPrice}
                            className="h-10"
                        />
                    </div>
                    {errors.discountPrice ? (
                        <FieldDescription className="text-destructive">
                            {errors.discountPrice}
                        </FieldDescription>
                    ) : (
                        <FieldDescription>
                            Leave empty or 0 for no discount
                        </FieldDescription>
                    )}
                </Field>
            </FieldGroup>

            {/* Pricing Summary Card */}
            {formData.price > 0 && (
                <div className="rounded-xl border bg-muted/30 p-5">
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                        Pricing Preview
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Original Price</span>
                            <span className="text-lg font-semibold">
                                ₹{formData.price.toLocaleString("en-IN")}
                            </span>
                        </div>

                        {formData.discountPrice > 0 && formData.discountPrice < formData.price && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Discount Price</span>
                                    <span className="text-lg font-semibold text-primary">
                                        ₹{formData.discountPrice.toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-3">
                                    <span className="text-sm font-medium">Students Save</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium line-through text-muted-foreground">
                                            ₹{formData.price.toLocaleString("en-IN")}
                                        </span>
                                        <span className="text-sm font-semibold text-primary">
                                            ₹{formData.discountPrice.toLocaleString("en-IN")}
                                        </span>
                                        <Badge variant="default" className="text-xs">
                                            {stats.discountPercent}% OFF
                                        </Badge>
                                    </div>
                                </div>

                                {/* Savings Breakdown */}
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                                    <IconPercentage className="size-4 text-primary" />
                                    <p className="text-xs text-muted-foreground">
                                        Savings of <span className="font-semibold text-foreground">₹{(formData.price - formData.discountPrice).toLocaleString("en-IN")}</span> per enrollment
                                    </p>
                                </div>
                            </>
                        )}

                        {formData.price > 0 && formData.discountPrice === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No discount applied — students pay ₹{formData.price.toLocaleString("en-IN")}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {formData.price === 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <IconCurrencyRupee className="size-5 text-primary" />
                    <div>
                        <p className="text-sm font-medium">Free Course</p>
                        <p className="text-xs text-muted-foreground">
                            This course will be available to all students at no cost
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
