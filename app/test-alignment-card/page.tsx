"use client"

import { AlignmentCard } from "@/components/dashboard/AlignmentCard"
import { type Alignment, type UIStatus } from "@/app/lib/types"

// Mock data for testing
const mockAlignments: Array<Alignment & { description?: string; ui_status?: UIStatus; partner_name?: string }> = [
  {
    id: "1",
    partner_id: "partner1",
    status: "resolving",
    ui_status: "in_conflict_resolution",
    current_round: 2,
    title: "Cofounder Agreement",
    description: "Finalizing roles, equity splits, and responsibilities for the new venture. This includes decision-making authority and vesting schedules.",
    created_by: "user1",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    partner_name: "John Smith",
  },
  {
    id: "2",
    partner_id: "partner2",
    status: "active",
    ui_status: "waiting_partner",
    current_round: 1,
    title: "Q3 Marketing Budget",
    description: "Defining allocation of funds for upcoming marketing campaigns and initiatives including social media, content creation, and paid ads.",
    created_by: "user1",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
    partner_name: "Sarah Johnson",
  },
  {
    id: "3",
    partner_id: "partner3",
    status: "resolving",
    ui_status: "aligned_awaiting_signatures",
    current_round: 3,
    title: "Project Phoenix Scope",
    description: "The project scope, timeline, and deliverables have been successfully aligned. Both parties agree on deliverables and milestones.",
    created_by: "user1",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    partner_name: "Michael Chen",
  },
  {
    id: "4",
    partner_id: "partner4",
    status: "complete",
    current_round: 2,
    title: "Operating Agreement",
    description: "All terms finalized and signed. Agreement covers management structure, profit distribution, and dispute resolution.",
    created_by: "user1",
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(), // 14 days ago
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    partner_name: "Emma Davis",
  },
  {
    id: "5",
    partner_id: "partner5",
    status: "active",
    ui_status: "stalled",
    current_round: 1,
    title: "Remote Work Policy",
    description: "Defining guidelines for remote work, communication expectations, and office hours. No activity in over a week.",
    created_by: "user1",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago
    partner_name: "Alex Rodriguez",
  },
];

export default function TestAlignmentCardPage() {
  const handleClick = (alignment: Alignment) => {
    console.log("Clicked alignment:", alignment.title);
    alert(`Clicked: ${alignment.title}`);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            AlignmentCard Component Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Testing all status variations and responsive behavior
          </p>
        </div>

        {/* Light Mode Grid */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Light Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6 rounded-lg">
            {mockAlignments.map((alignment) => (
              <AlignmentCard
                key={alignment.id}
                alignment={alignment}
                onClick={handleClick}
              />
            ))}
          </div>
        </section>

        {/* Dark Mode Grid */}
        <section className="dark">
          <h2 className="text-2xl font-bold text-slate-50 mb-4">
            Dark Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-background-dark p-6 rounded-lg">
            {mockAlignments.map((alignment) => (
              <AlignmentCard
                key={alignment.id}
                alignment={alignment}
                onClick={handleClick}
              />
            ))}
          </div>
        </section>

        {/* Single Card Examples */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Individual Status Examples
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                In Conflict Resolution
              </h3>
              <AlignmentCard
                alignment={mockAlignments[0]}
                onClick={handleClick}
                className="max-w-md"
              />
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Waiting Partner
              </h3>
              <AlignmentCard
                alignment={mockAlignments[1]}
                onClick={handleClick}
                className="max-w-md"
              />
            </div>
            <div className="dark bg-background-dark p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Awaiting Signatures (Dark Mode)
              </h3>
              <AlignmentCard
                alignment={mockAlignments[2]}
                onClick={handleClick}
                className="max-w-md"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
