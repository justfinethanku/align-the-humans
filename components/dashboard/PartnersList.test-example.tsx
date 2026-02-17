/**
 * Example usage of PartnersList component
 * This file demonstrates how to use the component and provides test data
 * DO NOT IMPORT IN PRODUCTION CODE
 */

import { PartnersList, PartnerWithDetails } from "./PartnersList"

// Mock data for testing
const mockPartners: PartnerWithDetails[] = [
  {
    id: "partner-1",
    created_by: "user-123",
    created_at: "2025-01-10T10:00:00Z",
    updated_at: "2025-01-10T10:00:00Z",
    profile: {
      id: "profile-1",
      display_name: "John Smith",
      is_admin: false,
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-01-01T10:00:00Z",
    },
    alignment_count: 3,
    last_active: "2025-01-10T10:00:00Z",
  },
  {
    id: "partner-2",
    created_by: "user-123",
    created_at: "2025-01-08T14:30:00Z",
    updated_at: "2025-01-08T14:30:00Z",
    profile: {
      id: "profile-2",
      display_name: "Samantha Green",
      is_admin: false,
      created_at: "2025-01-05T09:00:00Z",
      updated_at: "2025-01-05T09:00:00Z",
    },
    alignment_count: 1,
    last_active: "2025-01-08T14:30:00Z",
  },
  {
    id: "partner-3",
    created_by: "user-123",
    created_at: "2025-01-05T16:20:00Z",
    updated_at: "2025-01-05T16:20:00Z",
    profile: {
      id: "profile-3",
      display_name: "Alex Johnson",
      is_admin: false,
      created_at: "2025-01-03T11:00:00Z",
      updated_at: "2025-01-03T11:00:00Z",
    },
    alignment_count: 5,
    last_active: "2025-01-09T08:15:00Z",
  },
];

// Empty state example
const emptyPartners: PartnerWithDetails[] = [];

// Usage examples
export function PartnersListExample() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-xl font-bold">Populated State</h2>
        <PartnersList
          partners={mockPartners}
          onPartnerClick={(id) => console.log("Clicked partner:", id)}
          onPartnerAction={(id) => console.log("Action for partner:", id)}
        />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold">Empty State</h2>
        <PartnersList partners={emptyPartners} />
      </div>
    </div>
  );
}
