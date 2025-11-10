/**
 * Example usage of AddPartnerModal component
 *
 * This file demonstrates how to integrate the AddPartnerModal
 * into a dashboard or partner management page.
 *
 * DO NOT import this file - it's documentation only.
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddPartnerModal } from "@/components/dashboard/AddPartnerModal"
import { UserPlus } from "lucide-react"

export function DashboardWithPartnerModal() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [partners, setPartners] = useState<string[]>([]) // List of partner IDs

  const handlePartnerAdded = (partnerId: string) => {
    console.log("Partner added:", partnerId)

    // Refresh partner list
    setPartners((prev) => [...prev, partnerId])

    // Optionally: Show success toast/notification
    // toast.success("Partner added successfully!")

    // Optionally: Refetch partners from API
    // refreshPartners()
  }

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1>My Partners</h1>

        {/* Trigger Button */}
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Partner List */}
      <div className="mt-6">
        {/* Your partner list UI here */}
      </div>

      {/* Modal */}
      <AddPartnerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onPartnerAdded={handlePartnerAdded}
      />
    </div>
  )
}

/**
 * Props Interface:
 *
 * AddPartnerModalProps {
 *   open: boolean              // Control modal visibility
 *   onOpenChange: (open: boolean) => void  // Handle modal close
 *   onPartnerAdded?: (partnerId: string) => void  // Success callback
 * }
 *
 *
 * API Endpoints Required:
 *
 * 1. GET /api/partners/search?q={query}
 *    Response: { results: Array<{ id: string, display_name: string | null, email: string }> }
 *
 * 2. POST /api/partners/add
 *    Body: { userId: string } OR { email: string }
 *    Response: { partnerId: string }
 *
 *
 * Features:
 *
 * - Dual mode: Search existing users OR send invite to new email
 * - Debounced search (300ms) to reduce API calls
 * - Loading states for search and add operations
 * - Error handling with user-friendly messages
 * - Keyboard accessible (Tab, Escape, Enter)
 * - Dark mode support
 * - Mobile responsive
 * - ARIA labels for accessibility
 */
