# Generate Document API

**Endpoint:** `POST /api/alignment/generate-document`

Generates a professional alignment agreement document from finalized positions using Claude AI.

## Request

### Headers
```
Content-Type: application/json
Cookie: sb-access-token=... (Supabase session)
```

### Body Schema
```typescript
{
  alignmentId: string;      // UUID of the alignment
  templateId: string;        // UUID of the template used
  finalPositions: {          // Key-value pairs of aligned positions
    [key: string]: any;
  };
  participants: string[];    // Array of participant names
  summary: string[];         // Executive summary bullet points
}
```

### Example Request
```json
{
  "alignmentId": "123e4567-e89b-12d3-a456-426614174000",
  "templateId": "223e4567-e89b-12d3-a456-426614174000",
  "finalPositions": {
    "equity": "60/40 split reflecting capital contributions",
    "governance": "Tiered voting system with $10K threshold",
    "revenue": "Quarterly distributions with 30% reinvestment",
    "exit": "Right of first refusal on equity transfers"
  },
  "participants": ["Alice Chen", "Bob Martinez"],
  "summary": [
    "Equity split: 60/40 based on capital contributions and risk",
    "Decision making: Tiered system balancing autonomy and collaboration",
    "Revenue: Quarterly distributions ensuring cash flow and growth",
    "Exit strategy: ROFR protecting partnership integrity"
  ]
}
```

## Response

### Success (200)
```json
{
  "data": {
    "documentHtml": "<article class=\"alignment-document\">...</article>",
    "sections": [
      {
        "id": "executive-summary",
        "heading": "Executive Summary",
        "body": "<p>...</p>"
      },
      {
        "id": "equity-ownership",
        "heading": "Equity & Ownership",
        "body": "<h3>...</h3><p>...</p>"
      }
    ]
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": {
    "code": "AUTH_ERROR",
    "message": "Authentication required"
  }
}
```

**400 Bad Request**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "errors": [
        {
          "path": ["alignmentId"],
          "message": "Invalid alignment ID format"
        }
      ]
    }
  }
}
```

**403 Forbidden**
```json
{
  "error": {
    "code": "ALIGNMENT_UNAUTHORIZED",
    "message": "You do not have permission to access this alignment",
    "details": {
      "alignmentId": "...",
      "userId": "..."
    }
  }
}
```

**502 Bad Gateway**
```json
{
  "error": {
    "code": "AI_GENERATION_FAILED",
    "message": "AI document generation failed: Rate limit exceeded"
  }
}
```

## Document Structure

The generated HTML follows this structure:

```html
<article class="alignment-document">
  <header class="document-header">
    <h1>Alignment Agreement</h1>
    <div class="document-meta">
      <p>Between: Alice Chen and Bob Martinez</p>
      <p>Date: November 10, 2025</p>
      <p>Subject: Operating Agreement</p>
    </div>
  </header>

  <section class="executive-summary">
    <h2>Executive Summary</h2>
    <ul>
      <li>Equity split: 60/40 based on...</li>
      <li>Decision making: Tiered system...</li>
      <!-- 3-5 bullet points -->
    </ul>
  </section>

  <section class="detailed-terms">
    <h2>Detailed Terms</h2>

    <h3>Equity & Ownership</h3>
    <p>...</p>

    <h3>Decision Making & Governance</h3>
    <p>...</p>

    <!-- Additional categories -->
  </section>
</article>
```

## Usage Example (TypeScript)

```typescript
async function generateAlignmentDocument(
  alignmentId: string,
  templateId: string,
  finalPositions: Record<string, any>,
  participants: string[],
  summary: string[]
) {
  const response = await fetch('/api/alignment/generate-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alignmentId,
      templateId,
      finalPositions,
      participants,
      summary,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const { data } = await response.json();
  return {
    html: data.documentHtml,
    sections: data.sections,
  };
}

// Usage
const doc = await generateAlignmentDocument(
  'alignment-uuid',
  'template-uuid',
  {
    equity: '60/40 split',
    governance: 'Tiered voting',
  },
  ['Alice', 'Bob'],
  ['Key term 1', 'Key term 2']
);

// Render HTML
document.getElementById('document-container').innerHTML = doc.html;
```

## Notes

- **Authentication Required:** User must be authenticated via Supabase session
- **Authorization:** User must be a participant in the specified alignment
- **AI Model:** Uses Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **Generation Time:** Typically 5-15 seconds depending on complexity
- **Temperature:** 0.5 (balanced creativity and consistency)
- **Max Tokens:** 4000 (supports comprehensive agreements)

## Integration Points

This endpoint is typically called from:
1. `/app/alignment/[id]/resolve/page.tsx` - After conflict resolution
2. `/app/alignment/[id]/document/page.tsx` - Document preview/regeneration

Related endpoints:
- `POST /api/alignment/analyze` - Generates analysis before document
- `POST /api/alignment/resolve-conflicts` - Resolves conflicts before finalization
- `POST /api/alignment/signatures` - Collects signatures after document generation
