"use client"

import * as React from "react"
import { Search, UserPlus, Loader2, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Types
interface Profile {
  id: string
  display_name: string | null
  email?: string
}

interface SearchResult extends Profile {
  email: string
}

interface AddPartnerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPartnerAdded?: (partnerId: string) => void
}

export function AddPartnerModal({
  open,
  onOpenChange,
  onPartnerAdded,
}: AddPartnerModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([])
  const [selectedUser, setSelectedUser] = React.useState<SearchResult | null>(
    null
  )
  const [isSearching, setIsSearching] = React.useState(false)
  const [isAdding, setIsAdding] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [mode, setMode] = React.useState<"search" | "manual">("search")
  const [manualEmail, setManualEmail] = React.useState("")

  // Debounced search
  React.useEffect(() => {
    if (mode !== "search" || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, mode])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/partners/search?q=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error("Failed to search for users")
      }

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during search"
      )
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Email validation regex
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddPartner = async () => {
    setError(null)

    if (mode === "search" && !selectedUser) {
      setError("Please select a user from the search results to add as your partner.")
      return
    }

    if (mode === "manual") {
      const trimmedEmail = manualEmail.trim()
      if (!trimmedEmail) {
        setError("Please enter an email address for your partner.")
        return
      }
      if (!isValidEmail(trimmedEmail)) {
        setError("Please enter a valid email address (e.g., partner@example.com).")
        return
      }
    }

    setIsAdding(true)

    try {
      const response = await fetch("/api/partners/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "search"
            ? { userId: selectedUser?.id }
            : { email: manualEmail.trim() }
        ),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || "Failed to add partner"

        // Provide more helpful error messages based on common cases
        if (errorMessage.toLowerCase().includes("already")) {
          throw new Error("This person is already in your partners list.")
        } else if (errorMessage.toLowerCase().includes("not found")) {
          throw new Error("No account found with this email. They may need to sign up first.")
        } else if (errorMessage.toLowerCase().includes("yourself")) {
          throw new Error("You cannot add yourself as a partner.")
        } else {
          throw new Error(errorMessage)
        }
      }

      const data = await response.json()

      // Success - close modal and notify parent
      onPartnerAdded?.(data.partnerId)
      handleClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or contact support if the issue persists."
      )
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedUser(null)
    setError(null)
    setMode("search")
    setManualEmail("")
    onOpenChange(false)
  }

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Partner</DialogTitle>
          <DialogDescription>
            Add someone to start aligning with. Works for roommates, cofounders, family members, or colleagues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 border-b border-border pb-4">
            <Button
              variant={mode === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("search")}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Users
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("manual")}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Invite
            </Button>
          </div>

          {/* Search Mode */}
          {mode === "search" && (
            <>
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search">Search by name or email</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Enter display name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchQuery.trim().length >= 2 && (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  <div className="max-h-[240px] overflow-y-auto rounded-md border border-input">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No users found matching &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className={cn(
                              "w-full px-4 py-3 text-left transition-colors hover:bg-accent focus:bg-accent focus:outline-none",
                              selectedUser?.id === user.id &&
                                "bg-accent/50 font-medium"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserPlus className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-medium">
                                  {user.display_name || "Anonymous User"}
                                </p>
                                <p className="truncate text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                              {selectedUser?.id === user.id && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Manual Invite Mode */}
          {mode === "manual" && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="partner@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                An invitation link will be sent to this email address.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isAdding}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPartner}
            disabled={
              isAdding ||
              (mode === "search" && !selectedUser) ||
              (mode === "manual" && !manualEmail.trim())
            }
            type="button"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Partner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
