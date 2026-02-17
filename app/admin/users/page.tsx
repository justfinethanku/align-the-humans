/**
 * Admin Users Page
 * Lists all user profiles with admin status and creation dates
 */

import { createServerClient } from '@/app/lib/supabase-server';

async function getAllUsers() {
  const supabase = createServerClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return profiles ?? [];
}

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Users</h1>
        <p className="mt-2 text-zinc-400">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Display Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  User ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-100">
                      {user.display_name || (
                        <span className="text-zinc-500 italic">No name</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                      {user.id.slice(0, 8)}...{user.id.slice(-4)}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-700/50 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {users.length > 0 && (
          <div className="border-t border-zinc-800 px-6 py-4">
            <p className="text-sm text-zinc-400">
              Total: {users.length} {users.length === 1 ? 'user' : 'users'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
