"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmActionButtonProps = {
  formId: string;
  triggerLabel: string;
  confirmLabel: string;
  title: string;
  description: string;
  triggerVariant?: "default" | "outline";
  triggerClassName?: string;
};

export function ConfirmActionButton({
  formId,
  triggerLabel,
  confirmLabel,
  title,
  description,
  triggerVariant = "outline",
  triggerClassName,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    form?.requestSubmit();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className={triggerClassName}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-white/70 bg-white/95">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-indigo-600 text-white hover:bg-indigo-500">
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
