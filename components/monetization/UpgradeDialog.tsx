'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

import { MONETIZATION_TIERS } from '@/app/lib/monetization'
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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-slate-700 bg-slate-950 text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your free creator alignment is in use</DialogTitle>
          <DialogDescription className="text-slate-300">
            Drafts stay free. Choose early access for the next alignment you want to activate.
            Invited partners never pay or use their own free alignment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-3">
          {MONETIZATION_TIERS.map((tier) => (
            <section
              key={tier.id}
              className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-5"
            >
              {tier.badge && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-400">
                  {tier.badge}
                </p>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className="text-xs text-slate-400">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{tier.description}</p>
              <ul className="my-5 space-y-2 text-sm text-slate-300">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <UpgradeInterestButton
                tier={tier.id}
                context={context}
                onSuccess={() => onOpenChange(false)}
                className="mt-auto w-full"
              />
            </section>
          ))}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <Button variant="ghost" asChild>
            <Link href="/pricing">See full pricing</Link>
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
