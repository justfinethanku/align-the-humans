"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn, getStatusColor, dateUtils, stringUtils } from "@/app/lib/utils"
import { type Alignment, type UIStatus, type AlignmentStatus } from "@/app/lib/types"

/**
 * AlignmentCard Props
 *
 * Extended alignment type with UI-specific fields
 */
export interface AlignmentCardProps {
  alignment: Alignment & {
    description?: string | null;
    ui_status?: UIStatus;
    partner_name?: string | null;
    partner_names?: string[];
  };
  onClick?: (alignment: Alignment) => void;
  className?: string;
}

/**
 * Calculates progress percentage based on alignment status
 *
 * Status progression: draft (0%) → active (25%) → analyzing (50%) → resolving (75%) → complete (100%)
 */
function getProgressPercentage(status: AlignmentStatus | UIStatus): number {
  const progressMap: Record<string, number> = {
    draft: 0,
    active: 25,
    analyzing: 50,
    resolving: 75,
    complete: 100,
    waiting_partner: 25,
    in_conflict_resolution: 75,
    aligned_awaiting_signatures: 90,
    stalled: 0,
  };

  return progressMap[status] ?? 0;
}

/**
 * Gets the progress bar color based on status
 */
function getProgressColor(status: AlignmentStatus | UIStatus): string {
  const colorMap: Record<string, string> = {
    draft: "bg-slate-500",
    active: "bg-indigo-500",
    analyzing: "bg-purple-500",
    resolving: "bg-orange-500",
    complete: "bg-green-500",
    waiting_partner: "bg-yellow-500",
    in_conflict_resolution: "bg-orange-500",
    aligned_awaiting_signatures: "bg-blue-500",
    stalled: "bg-gray-500",
  };

  return colorMap[status] ?? "bg-primary";
}

/**
 * Derives "next steps" text from status
 */
function getNextStepsText(status: AlignmentStatus | UIStatus): string {
  const nextStepsMap: Record<string, string> = {
    draft: "Define your decision",
    active: "Complete your independent thinking",
    analyzing: "Review AI synthesis",
    resolving: "Discover solutions together",
    complete: "View your alignment",
    waiting_partner: "Waiting for partner to respond",
    in_conflict_resolution: "Review AI suggestions",
    aligned_awaiting_signatures: "Sign agreement",
    stalled: "Resume alignment",
  };

  return nextStepsMap[status] ?? "Continue alignment";
}

/**
 * Formats status for display
 */
function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * AlignmentCard Component
 *
 * Displays alignment summary per plan_a.md lines 653-692
 *
 * Features:
 * - Title and description (truncated)
 * - Status badge with color coding
 * - Progress bar
 * - Next steps text
 * - Partner name(s)
 * - Last updated timestamp
 * - Hover effects
 * - Click handler
 * - Light/dark mode support
 */
export function AlignmentCard({ alignment, onClick, className }: AlignmentCardProps) {
  // Determine status to use (prefer ui_status if available, fallback to status)
  const displayStatus = alignment.ui_status || alignment.status;

  // Calculate derived values
  const progress = getProgressPercentage(displayStatus);
  const progressColor = getProgressColor(displayStatus);
  const nextSteps = getNextStepsText(displayStatus);
  const statusColor = getStatusColor(displayStatus);
  const statusLabel = formatStatusLabel(displayStatus);

  // Truncate description if it exists
  const description = alignment.description
    ? stringUtils.truncate(alignment.description, 100)
    : null;

  // Format last updated timestamp
  const lastUpdated = dateUtils.formatRelative(alignment.updated_at);

  // Get partner name(s)
  const partnerDisplay = alignment.partner_names && alignment.partner_names.length > 0
    ? alignment.partner_names.join(", ")
    : alignment.partner_name || "Unknown Partner";

  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick(alignment);
    }
  };

  return (
    <Card
      className={cn(
        "group flex flex-col gap-5 p-5 transition-all cursor-pointer",
        "hover:shadow-md dark:hover:border-slate-700/60",
        "border-transparent dark:border-slate-800/20",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View alignment: ${alignment.title || 'Untitled'}`}
    >
      {/* Header: Title and Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 line-clamp-2">
          {alignment.title || "Untitled Alignment"}
        </h3>
        <Badge
          className={cn(
            "whitespace-nowrap shrink-0",
            statusColor
          )}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
          {description}
        </p>
      )}

      {/* Progress Section */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Progress</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {progress}%
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          aria-label={`Progress: ${progress}%`}
        />
      </div>

      {/* Partner Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">With:</span> {partnerDisplay}
      </div>

      {/* Footer: Next Steps and Last Updated */}
      <div className="flex flex-col gap-1 mt-2">
        <div className="text-sm font-bold text-primary-600 transition-colors group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300">
          Next step: {nextSteps} →
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Updated {lastUpdated}
        </div>
      </div>
    </Card>
  );
}

