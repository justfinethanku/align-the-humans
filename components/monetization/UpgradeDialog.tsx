'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

import { PILOT_OFFER } from '@/app/lib/monetization'
import { UpgradeInterestButton } from '@/components/monetization/UpgradeInterestButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: string
}

export function UpgradeDialog({ open, onOpenChange, context }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-slate-700 bg-slate-950 text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your free creator alignment is in use</DialogTitle>
          <DialogDescription className="text-slate-300">
            Drafts stay free. Request a pilot spot to run your next partnership alignment. Invited
            partners never pay or use their own free alignment.
          </DialogDescription>
        </DialogHeader>

        <section className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-semibold">{PILOT_OFFER.name}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{PILOT_OFFER.price}</span>
            <span className="text-sm text-slate-400">{PILOT_OFFER.cadence}</span>
          </div>
          <ul className="my-5 space-y-2 text-sm text-slate-300">
            {PILOT_OFFER.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="mb-5 text-sm text-slate-400">{PILOT_OFFER.billingNote}</p>
          <UpgradeInterestButton
            tier={PILOT_OFFER.id}
            context={context}
            onSuccess={() => onOpenChange(false)}
            className="w-full"
          />
        </section>

        <DialogFooter className="items-center sm:justify-between">
          <Button variant="ghost" asChild>
            <Link href="/pricing">See pricing details</Link>
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
