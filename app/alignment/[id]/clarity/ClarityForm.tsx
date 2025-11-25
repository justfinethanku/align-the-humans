"use client"

/**
 * Clarity Form Client Component
 *
 * Three-section AI-assisted form for defining alignment goals:
 * 1. What are you aligning over? (topic)
 * 2. Who are you aligning with? (partner selection)
 * 3. What's the desired result? (desired outcome)
 *
 * Features:
 * - AI-powered suggestions for each section
 * - Partner search/selection with invite capability
 * - Auto-save form progress
 * - Question generation integration
 *
 * Design reference: page_design_templates/{dark_mode,light_mode}/define_alignment_clarity_page
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ChevronDown, Loader2, ArrowRight, Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/app/lib/supabase-browser"

// Types
interface PreselectedPartner {
  id: string
  name: string
}

interface ClarityFormProps {
  alignmentId: string
  userId: string
  userDisplayName: string
  initialTitle: string
  status: string
  templateSeed: string
  initialClarity: {
    topic?: string
    partner?: string
    desiredOutcome?: string
  }
  preselectedPartner?: PreselectedPartner | null
}

interface AISuggestion {
  text: string
  confidence: number
}

interface Partner {
  id: string
  display_name: string | null
  email?: string
}

export function ClarityForm({
  alignmentId,
  userId,
  userDisplayName,
  initialTitle,
  status,
  templateSeed,
  initialClarity,
  preselectedPartner,
}: ClarityFormProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  // Form state - initialize with preselected partner if provided
  const [topic, setTopic] = React.useState(initialClarity.topic || initialTitle)
  const [partnerText, setPartnerText] = React.useState(initialClarity.partner || "")
  const [selectedPartner, setSelectedPartner] = React.useState<Partner | null>(
    preselectedPartner
      ? { id: preselectedPartner.id, display_name: preselectedPartner.name }
      : null
  )
  const [desiredOutcome, setDesiredOutcome] = React.useState(initialClarity.desiredOutcome || "")

  // UI state
  const [openSections, setOpenSections] = React.useState({
    topic: true,
    partner: false,
    outcome: false,
  })
  const [loadingSuggestions, setLoadingSuggestions] = React.useState<{
    topic: boolean
    partner: boolean
    outcome: boolean
  }>({
    topic: false,
    partner: false,
    outcome: false,
  })
  const [suggestions, setSuggestions] = React.useState<{
    topic: AISuggestion[]
    partner: AISuggestion[]
    outcome: AISuggestion[]
  }>({
    topic: [],
    partner: [],
    outcome: [],
  })

  // Partner search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Partner[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  // Save and navigation state
  const [isSaving, setIsSaving] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Auto-save timer
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout>()

  /**
   * Saves form progress to database (updates alignment clarity draft)
   */
  const saveProgress = React.useCallback(async () => {
    const trimmedTopic = topic.trim()
    const trimmedPartner = partnerText.trim()
    const trimmedOutcome = desiredOutcome.trim()

    if (!trimmedTopic && !trimmedPartner && !trimmedOutcome) {
      return
    }

    const payload: Record<string, unknown> = {}
    if (trimmedTopic) {
      payload.title = trimmedTopic
    }

    const clarityDraft = {
      topic: trimmedTopic || undefined,
      partner: trimmedPartner || undefined,
      desiredOutcome: trimmedOutcome || undefined,
    }

    if (clarityDraft.topic || clarityDraft.partner || clarityDraft.desiredOutcome) {
      payload.clarityDraft = clarityDraft
    }

    if (Object.keys(payload).length === 0) {
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/alignment/${alignmentId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to save progress")
      }
    } catch (err) {
      console.error("Auto-save error:", err)
      // Don't show error to user for auto-save failures
    } finally {
      setIsSaving(false)
    }
  }, [alignmentId, topic, partnerText, desiredOutcome])

  /**
   * Auto-save form progress when topic, partner, or desired outcome changes
   */
  React.useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    if (topic.trim() || partnerText.trim() || desiredOutcome.trim()) {
      autoSaveTimerRef.current = setTimeout(() => {
        void saveProgress()
      }, 1000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [topic, partnerText, desiredOutcome, saveProgress])

  /**
   * Fetches AI suggestions for a given section
   */
  async function fetchSuggestions(section: "topic" | "partner" | "outcome") {
    setLoadingSuggestions((prev) => ({ ...prev, [section]: true }))
    setError(null)

    try {
      let prompt = ""
      let currentValue = ""

      if (section === "topic") {
        prompt = "Suggest clear, specific topics for an alignment conversation"
        currentValue = topic
      } else if (section === "partner") {
        prompt = "Suggest common relationship types for alignment conversations"
        currentValue = partnerText
      } else {
        prompt = "Suggest clear desired outcomes for alignment conversations"
        currentValue = desiredOutcome
      }

      const response = await fetch("/api/alignment/clarity/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          currentValue,
          prompt,
          alignmentContext: {
            topic: topic || "alignment",
            participants: [userDisplayName],
            desiredOutcome: desiredOutcome || "mutual agreement",
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions")
      }

      const data = await response.json()
      setSuggestions((prev) => ({
        ...prev,
        [section]: data.suggestions || [],
      }))
    } catch (err) {
      console.error("Suggestion fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch suggestions")
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [section]: false }))
    }
  }

  /**
   * Uses an AI suggestion
   */
  function applySuggestion(section: "topic" | "partner" | "outcome", text: string) {
    if (section === "topic") {
      setTopic(text)
    } else if (section === "partner") {
      setPartnerText(text)
    } else {
      setDesiredOutcome(text)
    }

    // Clear suggestions after use
    setSuggestions((prev) => ({ ...prev, [section]: [] }))
  }

  /**
   * Toggles section accordion
   */
  function toggleSection(section: "topic" | "partner" | "outcome") {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  /**
   * Debounced partner search
   */
  React.useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      performPartnerSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  /**
   * Performs partner search API call
   */
  async function performPartnerSearch(query: string) {
    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/partners/search?q=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error("Failed to search partners")
      }

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      console.error("Partner search error:", err)
      setError(err instanceof Error ? err.message : "Failed to search partners")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  /**
   * Selects a partner from search results
   */
  function selectPartner(partner: Partner) {
    setSelectedPartner(partner)
    setPartnerText(partner.display_name || partner.email || "")
    setSearchQuery("")
    setSearchResults([])
  }

  /**
   * Validates form and proceeds to question generation
   */
  async function handleContinue() {
    setError(null)

    // Validation
    if (!topic.trim()) {
      setError("Please describe what you're aligning over")
      setOpenSections((prev) => ({ ...prev, topic: true }))
      return
    }

    if (!partnerText.trim() && !selectedPartner) {
      setError("Please specify who you're aligning with")
      setOpenSections((prev) => ({ ...prev, partner: true }))
      return
    }

    if (!desiredOutcome.trim()) {
      setError("Please describe the desired result")
      setOpenSections((prev) => ({ ...prev, outcome: true }))
      return
    }

    try {
      setIsGenerating(true)

      // First, save final clarity data
      await saveProgress()

      // Generate questions using AI
      if (selectedPartner) {
        await ensurePartnerParticipant(selectedPartner)
      }

      const response = await fetch("/api/alignment/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alignmentId,
          templateSeed: templateSeed || "custom",
          clarity: {
            topic: topic.trim(),
            participants: [userDisplayName, partnerText.trim()],
            desiredOutcome: desiredOutcome.trim(),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to generate questions")
      }

      await response.json()

      // Navigate to questionnaire
      router.push(`/alignment/${alignmentId}/questions`)
    } catch (err) {
      console.error("Question generation error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate questions. Please try again."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Checks if form is valid for submission
   */
  const isFormValid =
    topic.trim().length > 0 &&
    (partnerText.trim().length > 0 || selectedPartner !== null) &&
    desiredOutcome.trim().length > 0

  /**
   * Ensures the selected partner is added to the alignment participants list
   */
  async function ensurePartnerParticipant(partner: Partner) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Authentication required")
      if (partner.id === user.id) return

      const { data: existingParticipant, error: existingError } = await supabase
        .from("alignment_participants")
        .select("id")
        .eq("alignment_id", alignmentId)
        .eq("user_id", partner.id)
        .maybeSingle()

      if (existingError) {
        console.error("Failed to check existing participant", existingError)
        throw existingError
      }

      if (!existingParticipant) {
        const { error: insertError } = await supabase
          .from("alignment_participants")
          .insert({
            alignment_id: alignmentId,
            user_id: partner.id,
            role: "partner",
          })

        if (insertError) {
          console.error("Failed to add partner participant", insertError)
          throw insertError
        }
      }
    } catch (partnerError) {
      throw partnerError
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="flex h-6 w-6 items-center justify-center text-blue-600">
            <svg
              fill="currentColor"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
            >
              <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
            Align The Humans
          </h2>
          {isSaving && (
            <span className="ml-auto text-xs text-gray-500">Saving...</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10">
        <div className="mx-auto w-full max-w-3xl px-4">
          {/* Page Heading */}
          <div className="mb-8 px-4">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900 dark:text-gray-100">
              Define Your Alignment
            </h1>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Step 1 of 5: What decision needs to be made?
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="mx-4 mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Accordion Sections */}
          <div className="space-y-4 px-4">
            {/* Section 1: What are you aligning over? */}
            <details
              className="group rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
              open={openSections.topic}
              onToggle={() => toggleSection("topic")}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-4">
                <p className="text-base font-semibold leading-normal text-gray-900 dark:text-gray-100">
                  What decision needs to be made?
                </p>
                <ChevronDown className="h-5 w-5 text-gray-600 transition-transform duration-200 group-open:rotate-180 dark:text-gray-400" />
              </summary>
              <div className="px-4 pb-4">
                <Label htmlFor="topic" className="sr-only">
                  Topic
                </Label>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  What do you need to decide together? Works for anything from chore schedules to strategic direction.
                </p>
                <Textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Creating a fair chore schedule for our household"
                  className="min-h-28 resize-y"
                />

                {/* AI Suggestions Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSuggestions("topic")}
                    disabled={loadingSuggestions.topic}
                    className="mb-3"
                  >
                    {loadingSuggestions.topic ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting suggestions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Suggestions
                      </>
                    )}
                  </Button>

                  {/* Suggestions Display */}
                  {suggestions.topic.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        AI Suggestions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.topic.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 pl-3 dark:border-gray-800 dark:bg-gray-800"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {suggestion.text}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => applySuggestion("topic", suggestion.text)}
                              className="h-auto rounded-md bg-blue-600/20 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-600/30 dark:bg-blue-600/30 dark:text-blue-400 dark:hover:bg-blue-600/40"
                            >
                              Use this
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>

            {/* Section 2: Who are you aligning with? */}
            <details
              className="group rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
              open={openSections.partner}
              onToggle={() => toggleSection("partner")}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-4">
                <p className="text-base font-semibold leading-normal text-gray-900 dark:text-gray-100">
                  Who are you aligning with?
                </p>
                <ChevronDown className="h-5 w-5 text-gray-600 transition-transform duration-200 group-open:rotate-180 dark:text-gray-400" />
              </summary>
              <div className="px-4 pb-4">
                <Label htmlFor="partner" className="sr-only">
                  Partner
                </Label>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Who are you making this decision with?
                </p>

                {/* Selected Partner Display */}
                {selectedPartner ? (
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedPartner.display_name || "Anonymous User"}
                      </p>
                      {selectedPartner.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedPartner.email}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPartner(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Partner Search */}
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search for a partner by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mb-4 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => selectPartner(result)}
                            className="flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 last:border-b-0 dark:border-gray-800 dark:hover:bg-gray-800/50"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
                              <UserPlus className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                                {result.display_name || "Anonymous User"}
                              </p>
                              {result.email && (
                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                  {result.email}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Manual Partner Input */}
                    <Textarea
                      id="partner"
                      value={partnerText}
                      onChange={(e) => setPartnerText(e.target.value)}
                      placeholder="e.g., My roommate, my cofounder, my spouse, partner@example.com"
                      className="min-h-28 resize-y"
                    />
                  </>
                )}

                {/* AI Suggestions Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSuggestions("partner")}
                    disabled={loadingSuggestions.partner}
                    className="mb-3"
                  >
                    {loadingSuggestions.partner ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting suggestions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Suggestions
                      </>
                    )}
                  </Button>

                  {/* Suggestions Display */}
                  {suggestions.partner.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        AI Suggestions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.partner.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 pl-3 dark:border-gray-800 dark:bg-gray-800"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {suggestion.text}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => applySuggestion("partner", suggestion.text)}
                              className="h-auto rounded-md bg-blue-600/20 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-600/30 dark:bg-blue-600/30 dark:text-blue-400 dark:hover:bg-blue-600/40"
                            >
                              Use this
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>

            {/* Section 3: What's the desired result? */}
            <details
              className="group rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
              open={openSections.outcome}
              onToggle={() => toggleSection("outcome")}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-4">
                <p className="text-base font-semibold leading-normal text-gray-900 dark:text-gray-100">
                  What does success look like?
                </p>
                <ChevronDown className="h-5 w-5 text-gray-600 transition-transform duration-200 group-open:rotate-180 dark:text-gray-400" />
              </summary>
              <div className="px-4 pb-4">
                <Label htmlFor="outcome" className="sr-only">
                  Desired Result
                </Label>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  What would a great outcome look like for both of you?
                </p>
                <Textarea
                  id="outcome"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  placeholder="e.g., A chore schedule that feels fair to both of us"
                  className="min-h-28 resize-y"
                />

                {/* AI Suggestions Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSuggestions("outcome")}
                    disabled={loadingSuggestions.outcome}
                    className="mb-3"
                  >
                    {loadingSuggestions.outcome ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting suggestions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get AI Suggestions
                      </>
                    )}
                  </Button>

                  {/* Suggestions Display */}
                  {suggestions.outcome.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        AI Suggestions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.outcome.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 pl-3 dark:border-gray-800 dark:bg-gray-800"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {suggestion.text}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => applySuggestion("outcome", suggestion.text)}
                              className="h-auto rounded-md bg-blue-600/20 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-600/30 dark:bg-blue-600/30 dark:text-blue-400 dark:hover:bg-blue-600/40"
                            >
                              Use this
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>

          {/* Continue Button */}
          <div className="mt-6 flex justify-end px-4">
            <Button
              onClick={handleContinue}
              disabled={!isFormValid || isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
