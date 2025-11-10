/**
 * Test component to verify dashboard hooks functionality
 * Place this in a test route like app/test/hooks/page.tsx
 *
 * Usage:
 * 1. Copy this file to app/test/hooks/page.tsx
 * 2. Navigate to /test/hooks in your browser
 * 3. Ensure you're logged in
 * 4. Verify hooks load data correctly
 */

'use client';

import { useDashboardData, usePartners, useAlignmentUpdates } from '@/app/lib/hooks';
import { useState } from 'react';

export default function DashboardHooksTest() {
  const [updateLog, setUpdateLog] = useState<string[]>([]);

  // Test useDashboardData
  const {
    alignments,
    loading: alignmentsLoading,
    error: alignmentsError,
    refetch: refetchAlignments,
  } = useDashboardData();

  // Test usePartners
  const {
    partners,
    loading: partnersLoading,
    error: partnersError,
    refetch: refetchPartners,
  } = usePartners();

  // Test useAlignmentUpdates
  const { connected, error: realtimeError, disconnect } = useAlignmentUpdates({
    onInsert: (alignment) => {
      setUpdateLog((prev) => [
        `[${new Date().toLocaleTimeString()}] INSERT: ${alignment.title || alignment.id}`,
        ...prev.slice(0, 9), // Keep last 10 events
      ]);
    },
    onUpdate: (alignment) => {
      setUpdateLog((prev) => [
        `[${new Date().toLocaleTimeString()}] UPDATE: ${alignment.title || alignment.id} - Status: ${alignment.status}`,
        ...prev.slice(0, 9),
      ]);
    },
    onDelete: (alignment) => {
      setUpdateLog((prev) => [
        `[${new Date().toLocaleTimeString()}] DELETE: ${alignment.id}`,
        ...prev.slice(0, 9),
      ]);
    },
    enabled: true,
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '32px', fontWeight: 'bold' }}>
        Dashboard Hooks Test
      </h1>

      {/* useDashboardData Test */}
      <section style={{ marginBottom: '32px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          1. useDashboardData()
        </h2>

        <div style={{ marginBottom: '12px' }}>
          <strong>Status:</strong>{' '}
          {alignmentsLoading ? 'Loading...' : alignmentsError ? 'Error' : 'Success'}
        </div>

        {alignmentsError && (
          <div style={{ color: 'red', marginBottom: '12px' }}>
            <strong>Error:</strong> {alignmentsError.message}
          </div>
        )}

        {!alignmentsLoading && !alignmentsError && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <strong>Alignments Found:</strong> {alignments.length}
            </div>

            {alignments.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Sample Data:</strong>
                <pre style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(alignments[0], null, 2)}
                </pre>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <strong>All Alignments:</strong>
              <ul style={{ marginTop: '8px', listStyle: 'disc', paddingLeft: '20px' }}>
                {alignments.map((alignment) => (
                  <li key={alignment.id}>
                    {alignment.title || 'Untitled'} - Status: {alignment.ui_status} - Round: {alignment.current_round} - Participants: {alignment.participants.length}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <button
          onClick={() => refetchAlignments()}
          disabled={alignmentsLoading}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: alignmentsLoading ? 'not-allowed' : 'pointer',
            opacity: alignmentsLoading ? 0.6 : 1,
          }}
        >
          {alignmentsLoading ? 'Refetching...' : 'Refetch Alignments'}
        </button>
      </section>

      {/* usePartners Test */}
      <section style={{ marginBottom: '32px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          2. usePartners()
        </h2>

        <div style={{ marginBottom: '12px' }}>
          <strong>Status:</strong>{' '}
          {partnersLoading ? 'Loading...' : partnersError ? 'Error' : 'Success'}
        </div>

        {partnersError && (
          <div style={{ color: 'red', marginBottom: '12px' }}>
            <strong>Error:</strong> {partnersError.message}
          </div>
        )}

        {!partnersLoading && !partnersError && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <strong>Partners Found:</strong> {partners.length}
            </div>

            {partners.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>All Partners:</strong>
                <ul style={{ marginTop: '8px', listStyle: 'disc', paddingLeft: '20px' }}>
                  {partners.map((partner) => (
                    <li key={partner.id}>
                      Partner ID: {partner.id.slice(0, 8)}... - Alignments: {partner.alignment_count}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => refetchPartners()}
          disabled={partnersLoading}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: partnersLoading ? 'not-allowed' : 'pointer',
            opacity: partnersLoading ? 0.6 : 1,
          }}
        >
          {partnersLoading ? 'Refetching...' : 'Refetch Partners'}
        </button>
      </section>

      {/* useAlignmentUpdates Test */}
      <section style={{ marginBottom: '32px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          3. useAlignmentUpdates()
        </h2>

        <div style={{ marginBottom: '12px' }}>
          <strong>Realtime Status:</strong>{' '}
          <span style={{ color: connected ? 'green' : 'red' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {realtimeError && (
          <div style={{ color: 'red', marginBottom: '12px' }}>
            <strong>Error:</strong> {realtimeError.message}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <strong>Event Log:</strong>
          {updateLog.length === 0 ? (
            <p style={{ marginTop: '8px', fontStyle: 'italic', color: '#666' }}>
              No events yet. Try updating an alignment in another tab.
            </p>
          ) : (
            <ul style={{ marginTop: '8px', listStyle: 'none', padding: 0 }}>
              {updateLog.map((log, index) => (
                <li
                  key={index}
                  style={{
                    padding: '8px',
                    background: index % 2 === 0 ? '#f9f9f9' : '#fff',
                    borderBottom: '1px solid #eee',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  {log}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={disconnect}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      </section>

      {/* Test Instructions */}
      <section style={{ padding: '16px', background: '#e7f3ff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
          Testing Instructions
        </h2>
        <ol style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <li>Ensure you are logged in (check auth state)</li>
          <li>Verify useDashboardData() loads your alignments</li>
          <li>Verify usePartners() loads your partners</li>
          <li>Check useAlignmentUpdates() shows &quot;Connected&quot;</li>
          <li>Open another tab and update an alignment</li>
          <li>Watch for real-time events in the Event Log</li>
          <li>Test refetch buttons to ensure manual refresh works</li>
        </ol>
      </section>
    </div>
  );
}
