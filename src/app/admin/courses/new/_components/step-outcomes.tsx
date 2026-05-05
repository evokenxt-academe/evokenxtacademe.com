"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlus, IconX, IconGripVertical } from "@tabler/icons-react";
import type { UseFormReturn } from "react-hook-form";
import type { CourseFormValues } from "@/lib/validators/course";

interface StepOutcomesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CourseFormValues, any, any>;
}

type PricingTier = {
  label: string;
  currency: string;
  base_price: string;
  discounted_price: string;
  valid_from: string;
  valid_until: string;
};

export function StepOutcomes({ form }: StepOutcomesProps) {
  const [outcomeInput, setOutcomeInput] = React.useState("");
  const [requirementInput, setRequirementInput] = React.useState("");
  const [showPricing, setShowPricing] = React.useState(false);
  const [pricingTiers, setPricingTiers] = React.useState<PricingTier[]>([
    { label: "Standard", currency: "INR", base_price: "", discounted_price: "", valid_from: "", valid_until: "" },
  ]);

  const whatYouLearn = form.watch("what_you_learn") || [];
  const requirements = form.watch("requirements") || [];

  const addOutcome = () => {
    const val = outcomeInput.trim();
    if (!val || whatYouLearn.length >= 20) return;
    form.setValue("what_you_learn", [...whatYouLearn, val], { shouldValidate: true });
    setOutcomeInput("");
  };

  const removeOutcome = (index: number) => {
    const next = whatYouLearn.filter((_, i) => i !== index);
    form.setValue("what_you_learn", next, { shouldValidate: true });
  };

  const addRequirement = () => {
    const val = requirementInput.trim();
    if (!val) return;
    form.setValue("requirements", [...requirements, val], { shouldValidate: true });
    setRequirementInput("");
  };

  const removeRequirement = (index: number) => {
    const next = requirements.filter((_, i) => i !== index);
    form.setValue("requirements", next, { shouldValidate: true });
  };

  const handleOutcomeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOutcome();
    }
    if (e.key === "Backspace" && !outcomeInput && whatYouLearn.length > 0) {
      removeOutcome(whatYouLearn.length - 1);
    }
  };

  const handleRequirementKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRequirement();
    }
    if (e.key === "Backspace" && !requirementInput && requirements.length > 0) {
      removeRequirement(requirements.length - 1);
    }
  };

  // Store pricing tiers in a ref that the parent can access
  React.useEffect(() => {
    // Pricing is handled separately on submit; storing in sessionStorage for now
    if (showPricing) {
      sessionStorage.setItem("course_pricing_tiers", JSON.stringify(pricingTiers));
    }
  }, [pricingTiers, showPricing]);

  return (
    <div className="flex flex-col gap-6">
      {/* What You'll Learn */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">What You&apos;ll Learn</Label>
        <p className="text-xs text-muted-foreground">
          Add learning outcomes for this course (min 1, max 20)
        </p>

        <div className="flex flex-col gap-2">
          {whatYouLearn.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <IconGripVertical className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm">{item}</span>
              <button
                type="button"
                onClick={() => removeOutcome(idx)}
                className="rounded p-0.5 hover:bg-muted"
              >
                <IconX className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={outcomeInput}
            onChange={(e) => setOutcomeInput(e.target.value)}
            onKeyDown={handleOutcomeKeyDown}
            placeholder="Add a learning outcome and press Enter"
            disabled={whatYouLearn.length >= 20}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOutcome}
            disabled={!outcomeInput.trim() || whatYouLearn.length >= 20}
          >
            Add
          </Button>
        </div>
        {form.formState.errors.what_you_learn && (
          <p className="text-xs text-destructive">
            {form.formState.errors.what_you_learn.message}
          </p>
        )}
      </div>

      <Separator />

      {/* Requirements */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Requirements / Prerequisites</Label>
        <p className="text-xs text-muted-foreground">
          What should students know before taking this course?
        </p>

        <div className="flex flex-col gap-2">
          {requirements.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <IconGripVertical className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm">{item}</span>
              <button
                type="button"
                onClick={() => removeRequirement(idx)}
                className="rounded p-0.5 hover:bg-muted"
              >
                <IconX className="size-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            onKeyDown={handleRequirementKeyDown}
            placeholder="Add a requirement and press Enter"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRequirement}
            disabled={!requirementInput.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      <Separator />

      {/* Pricing Toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label className="text-sm font-medium">Add Pricing Now</Label>
          <p className="text-xs text-muted-foreground">
            You can also add pricing later from the edit page
          </p>
        </div>
        <Switch checked={showPricing} onCheckedChange={setShowPricing} />
      </div>

      {showPricing && (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pricing Tiers
          </p>
          {pricingTiers.map((tier, idx) => (
            <div key={idx} className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tier {idx + 1}</span>
                {pricingTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPricingTiers((t) => t.filter((_, i) => i !== idx))}
                    className="rounded p-0.5 hover:bg-muted"
                  >
                    <IconX className="size-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={tier.label}
                    onChange={(e) => {
                      const next = [...pricingTiers];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setPricingTiers(next);
                    }}
                    placeholder="e.g. Standard"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Currency</Label>
                  <Select
                    value={tier.currency}
                    onValueChange={(val) => {
                      const next = [...pricingTiers];
                      next[idx] = { ...next[idx], currency: val };
                      setPricingTiers(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Base Price</Label>
                  <Input
                    type="number"
                    value={tier.base_price}
                    onChange={(e) => {
                      const next = [...pricingTiers];
                      next[idx] = { ...next[idx], base_price: e.target.value };
                      setPricingTiers(next);
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Discounted Price</Label>
                  <Input
                    type="number"
                    value={tier.discounted_price}
                    onChange={(e) => {
                      const next = [...pricingTiers];
                      next[idx] = { ...next[idx], discounted_price: e.target.value };
                      setPricingTiers(next);
                    }}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Valid From</Label>
                  <Input
                    type="date"
                    value={tier.valid_from}
                    onChange={(e) => {
                      const next = [...pricingTiers];
                      next[idx] = { ...next[idx], valid_from: e.target.value };
                      setPricingTiers(next);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Valid Until</Label>
                  <Input
                    type="date"
                    value={tier.valid_until}
                    onChange={(e) => {
                      const next = [...pricingTiers];
                      next[idx] = { ...next[idx], valid_until: e.target.value };
                      setPricingTiers(next);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setPricingTiers((t) => [
                ...t,
                { label: "", currency: "INR", base_price: "", discounted_price: "", valid_from: "", valid_until: "" },
              ])
            }
          >
            <IconPlus data-icon="inline-start" />
            Add Another Pricing Tier
          </Button>
        </div>
      )}
    </div>
  );
}
