"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Partner, Profile } from "@/app/lib/types"
import { cn } from "@/lib/utils"

/**
 * Extended partner type with display information and alignment count
 * Used for dashboard display purposes
 */
export interface PartnerWithDetails extends Partner {
  profile: Profile | null;
  alignment_count: number;
  last_active?: string; // ISO 8601 timestamp of last alignment activity
}

interface PartnersListProps {
  partners: PartnerWithDetails[];
  className?: string;
  onPartnerClick?: (partnerId: string) => void;
  onPartnerAction?: (partnerId: string) => void;
}

/**
 * Generates initials from display name for avatar fallback
 * @param name Display name
 * @returns Up to 2 initials
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * PartnersList component displays user's partners with avatars and alignment counts
 *
 * Features:
 * - Avatar display with fallback to initials
 * - Display name and alignment count
 * - Empty state when no partners
 * - Optional click handlers for interaction
 * - Responsive layout
 * - Light/dark mode support
 *
 * @example
 * ```tsx
 * <PartnersList
 *   partners={partnersData}
 *   onPartnerClick={(id) => router.push(`/partners/${id}`)}
 * />
 * ```
 */
export function PartnersList({
  partners,
  className,
  onPartnerClick,
  onPartnerAction,
}: PartnersListProps) {
  // Empty state
  if (partners.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/30",
          className
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
          <svg
            className="h-6 w-6 text-slate-400 dark:text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          No partners yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add someone to start aligning with - roommate, cofounder, spouse, or colleague. One structure for any partnership.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {partners.map((partner) => {
        const displayName = partner.profile?.display_name || "Unknown";
        const initials = getInitials(partner.profile?.display_name);
        const alignmentText =
          partner.alignment_count === 1
            ? "1 alignment"
            : `${partner.alignment_count} alignments`;

        return (
          <div
            key={partner.id}
            className={cn(
              "flex items-center justify-between rounded-lg bg-slate-100/80 p-3 transition-colors dark:bg-slate-800/50",
              onPartnerClick && "cursor-pointer hover:bg-slate-200/80 dark:hover:bg-slate-700/60"
            )}
            onClick={() => onPartnerClick?.(partner.id)}
            role={onPartnerClick ? "button" : undefined}
            tabIndex={onPartnerClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onPartnerClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onPartnerClick(partner.id);
              }
            }}
            aria-label={`${displayName}, ${alignmentText}`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={undefined}
                  alt={`Avatar for ${displayName}`}
                />
                <AvatarFallback
                  className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {alignmentText}
                </p>
              </div>
            </div>
            {onPartnerAction && (
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onPartnerAction(partner.id);
                }}
                aria-label={`More actions for ${displayName}`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
