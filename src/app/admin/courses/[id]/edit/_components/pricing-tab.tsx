"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconPlus, IconPencil, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  fetchCoursePricing,
  createCoursePricing,
  updateCoursePricing,
  deleteCoursePricing,
  type CoursePricing,
} from "@/lib/supabase/queries/courses-admin";
import { formatCurrency } from "@/lib/utils/format";

interface PricingTabProps {
  courseId: string;
}

export function PricingTab({ courseId }: PricingTabProps) {
  const [tiers, setTiers] = React.useState<CoursePricing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // New tier form state
  const [newTier, setNewTier] = React.useState({
    label: "",
    currency: "INR",
    base_price: "",
    discounted_price: "",
    valid_from: "",
    valid_until: "",
  });

  // Edit form state
  const [editTier, setEditTier] = React.useState({
    label: "",
    currency: "INR",
    base_price: "",
    discounted_price: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  const loadPricing = React.useCallback(async () => {
    try {
      const data = await fetchCoursePricing(courseId);
      setTiers(data);
    } catch {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleAdd = async () => {
    if (!newTier.label || !newTier.base_price) {
      toast.error("Label and base price are required");
      return;
    }
    setSaving(true);
    try {
      await createCoursePricing({
        course_id: courseId,
        label: newTier.label,
        currency: newTier.currency,
        base_price: Number(newTier.base_price),
        discounted_price: newTier.discounted_price ? Number(newTier.discounted_price) : null,
        valid_from: newTier.valid_from || null,
        valid_until: newTier.valid_until || null,
        is_active: true,
      });
      toast.success("Pricing tier added");
      setShowAddForm(false);
      setNewTier({ label: "", currency: "INR", base_price: "", discounted_price: "", valid_from: "", valid_until: "" });
      loadPricing();
    } catch {
      toast.error("Failed to add pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (tier: CoursePricing) => {
    setEditingId(tier.id);
    setEditTier({
      label: tier.label,
      currency: tier.currency,
      base_price: String(tier.base_price),
      discounted_price: tier.discounted_price ? String(tier.discounted_price) : "",
      valid_from: tier.valid_from ? tier.valid_from.split("T")[0] : "",
      valid_until: tier.valid_until ? tier.valid_until.split("T")[0] : "",
      is_active: tier.is_active,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateCoursePricing(editingId, {
        label: editTier.label,
        currency: editTier.currency,
        base_price: Number(editTier.base_price),
        discounted_price: editTier.discounted_price ? Number(editTier.discounted_price) : null,
        valid_from: editTier.valid_from || null,
        valid_until: editTier.valid_until || null,
        is_active: editTier.is_active,
      });
      toast.success("Pricing updated");
      setEditingId(null);
      loadPricing();
    } catch {
      toast.error("Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteCoursePricing(deleteId);
      toast.success("Pricing tier deleted");
      setDeleteId(null);
      loadPricing();
    } catch {
      toast.error("Failed to delete pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateCoursePricing(id, { is_active: isActive });
      setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: isActive } : t)));
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing tiers */}
      {tiers.map((tier) => (
        <Card key={tier.id}>
          <CardContent className="pt-6">
            {editingId === tier.id ? (
              // Inline edit form
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={editTier.label}
                      onChange={(e) => setEditTier((t) => ({ ...t, label: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Currency</Label>
                    <Select
                      value={editTier.currency}
                      onValueChange={(val) => setEditTier((t) => ({ ...t, currency: val }))}
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
                      value={editTier.base_price}
                      onChange={(e) => setEditTier((t) => ({ ...t, base_price: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Discounted Price</Label>
                    <Input
                      type="number"
                      value={editTier.discounted_price}
                      onChange={(e) => setEditTier((t) => ({ ...t, discounted_price: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Valid From</Label>
                    <Input
                      type="date"
                      value={editTier.valid_from}
                      onChange={(e) => setEditTier((t) => ({ ...t, valid_from: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Valid Until</Label>
                    <Input
                      type="date"
                      value={editTier.valid_until}
                      onChange={(e) => setEditTier((t) => ({ ...t, valid_until: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editTier.is_active}
                      onCheckedChange={(val) => setEditTier((t) => ({ ...t, is_active: val }))}
                    />
                    <Label className="text-xs">Active</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving && <Spinner className="mr-2" />}
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Display mode
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tier.label}</span>
                    <Badge variant={tier.is_active ? "default" : "secondary"}>
                      {tier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={tier.is_active}
                      onCheckedChange={(val) => handleToggleActive(tier.id, val)}
                    />
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleStartEdit(tier)}>
                      <IconPencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(tier.id)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  {tier.discounted_price ? (
                    <>
                      <span className="text-lg font-semibold">
                        {formatCurrency(tier.discounted_price, tier.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(tier.base_price, tier.currency)}
                      </span>
                      {tier.discount_pct && (
                        <Badge variant="secondary">{Number(tier.discount_pct).toFixed(0)}% off</Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-lg font-semibold">
                      {formatCurrency(tier.base_price, tier.currency)}
                    </span>
                  )}
                </div>
                {(tier.valid_from || tier.valid_until) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tier.valid_from && `From ${new Date(tier.valid_from).toLocaleDateString()}`}
                    {tier.valid_from && tier.valid_until && " · "}
                    {tier.valid_until && `Until ${new Date(tier.valid_until).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add form */}
      {showAddForm && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <p className="text-sm font-medium">New Pricing Tier</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={newTier.label}
                  onChange={(e) => setNewTier((t) => ({ ...t, label: e.target.value }))}
                  placeholder="e.g. Standard"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Currency</Label>
                <Select
                  value={newTier.currency}
                  onValueChange={(val) => setNewTier((t) => ({ ...t, currency: val }))}
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
                  value={newTier.base_price}
                  onChange={(e) => setNewTier((t) => ({ ...t, base_price: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Discounted Price</Label>
                <Input
                  type="number"
                  value={newTier.discounted_price}
                  onChange={(e) => setNewTier((t) => ({ ...t, discounted_price: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                {saving && <Spinner className="mr-2" />}
                Add Tier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showAddForm && (
        <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full border-dashed">
          <IconPlus data-icon="inline-start" />
          Add Pricing Tier
        </Button>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Tier</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this pricing tier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
