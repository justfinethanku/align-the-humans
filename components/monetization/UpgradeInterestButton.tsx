'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { UpgradeTierId } from '@/app/lib/monetization'

interface UpgradeInterestButtonProps {
  tier: UpgradeTierId
  context: string
  onSuccess?: () => void
  className?: string
}

export function UpgradeInterestButton({
  tier,
  context,
  onSuccess,
  className,
}: UpgradeInterestButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function recordInterest() {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/upgrade-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, context }),
      })

      if (response.status === 401) {
        toast.error('Create an account to request a pilot spot.')
        router.push('/signup?redirectTo=/pricing')
        return
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error?.message || 'Could not record your interest')
      }

      toast.success('Pilot spot requested. We’ll be in touch before anything is charged.')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record your interest')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={recordInterest}
      disabled={isSubmitting}
      className={className}
    >
      {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
      Request a pilot spot
    </Button>
  )
}
