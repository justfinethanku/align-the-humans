# XSS Sanitization Test Cases

## Testing the DOMPurify Implementation in document-content.tsx

### Test Setup
The document-content.tsx component now sanitizes all HTML before rendering using DOMPurify with these settings:
- Allowed tags: h1-h6, p, ul, ol, li, strong, em, br, div, section, article, span, blockquote, hr, table elements
- Allowed attributes: class, id
- No data attributes
- No script execution

### Test Case 1: Normal Document Content (Should Pass Through)

**Input HTML:**
```html
<div class="document-header">
  <h1>Partnership Agreement</h1>
  <div class="document-meta">
    <p>Date: January 15, 2025</p>
  </div>
</div>
<section>
  <h2>Terms and Conditions</h2>
  <p>This agreement establishes the following terms:</p>
  <ul>
    <li><strong>Term 1:</strong> Revenue split 50/50</li>
    <li><strong>Term 2:</strong> Monthly meetings required</li>
  </ul>
</section>
```

**Expected Output:** Rendered exactly as input with all formatting preserved.

**Testing:** Generate a normal document and verify all headings, paragraphs, lists, and styling work correctly.

---

### Test Case 2: Script Tag Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<script>alert('XSS Attack!')</script>
<p>Some content</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<p>Some content</p>
```

**Result:** Script tag completely removed, alert does not execute.

**Testing:** Try to inject script tag via API endpoint or direct HTML. Browser console should show NO alert.

---

### Test Case 3: Event Handler Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<img src="x" onerror="alert('XSS via onerror')">
<p onclick="alert('XSS via onclick')">Click me</p>
<div onload="alert('XSS via onload')">Content</div>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<img src="x">
<p>Click me</p>
<div>Content</div>
```

**Result:** All event handlers (onerror, onclick, onload) stripped. No alerts execute.

**Testing:** Inject HTML with event handlers. Verify no JavaScript executes when hovering/clicking.

---

### Test Case 4: Iframe Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<iframe src="https://evil.com/steal-data.html"></iframe>
<p>More content</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<p>More content</p>
```

**Result:** Iframe tag completely removed.

**Testing:** Try to inject iframe. Verify no embedded content loads.

---

### Test Case 5: Object/Embed Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<object data="https://evil.com/malware.swf"></object>
<embed src="https://evil.com/malware.swf">
<p>Content</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<p>Content</p>
```

**Result:** Object and embed tags completely removed.

---

### Test Case 6: Data Attribute Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<div data-evil="javascript:alert('XSS')">Content</div>
<p data-hack="malicious">Text</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<div>Content</div>
<p>Text</p>
```

**Result:** All data-* attributes stripped (ALLOW_DATA_ATTR: false).

---

### Test Case 7: Style Tag Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<style>body { display: none; }</style>
<p>Content</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<p>Content</p>
```

**Result:** Style tag removed (not in ALLOWED_TAGS).

---

### Test Case 8: Link Tag Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<link rel="stylesheet" href="https://evil.com/malicious.css">
<p>Content</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<p>Content</p>
```

**Result:** Link tag removed.

---

### Test Case 9: Meta Tag Injection (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<meta http-equiv="refresh" content="0;url=https://evil.com">
<p>Content</p>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<p>Content</p>
```

**Result:** Meta tag removed.

---

### Test Case 10: Complex Nested Attack (Should Be Blocked)

**Input HTML:**
```html
<h1>Agreement</h1>
<div>
  <script>alert('XSS')</script>
  <p>Legitimate content</p>
  <img src="x" onerror="alert('XSS2')">
  <ul>
    <li onclick="alert('XSS3')">Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
```

**Expected Output:**
```html
<h1>Agreement</h1>
<div>
  <p>Legitimate content</p>
  <img src="x">
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
```

**Result:** All malicious code stripped, legitimate structure preserved.

---

## How to Test

### Manual Testing Steps

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Create Test Alignment:**
   - Log in to application
   - Create a new alignment
   - Complete all phases through to document generation

3. **Inject Test Payloads:**
   - Modify the `/api/alignment/generate-document/route.ts` temporarily
   - Add test XSS payloads to the generated HTML
   - Example:
   ```typescript
   const testHtml = `
     <h1>Test Document</h1>
     <script>alert('XSS TEST')</script>
     <p>Normal content</p>
     <img src=x onerror=alert('XSS2')>
   `;
   return NextResponse.json({
     data: { documentHtml: testHtml }
   });
   ```

4. **Verify Sanitization:**
   - Load the document page
   - Open browser console (F12)
   - Verify NO alert dialogs appear
   - Inspect HTML in Elements tab
   - Verify script tags are removed
   - Verify event handlers are stripped
   - Verify normal content renders correctly

### Automated Testing (Future)

Create Jest test:
```typescript
import DOMPurify from 'isomorphic-dompurify';

describe('Document HTML Sanitization', () => {
  it('should remove script tags', () => {
    const dirty = '<h1>Title</h1><script>alert("XSS")</script>';
    const clean = DOMPurify.sanitize(dirty, sanitizeConfig);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('<h1>Title</h1>');
  });

  it('should remove event handlers', () => {
    const dirty = '<p onclick="alert(\'XSS\')">Text</p>';
    const clean = DOMPurify.sanitize(dirty, sanitizeConfig);
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('<p>Text</p>');
  });

  // Add more test cases...
});
```

## Success Criteria

- All test cases pass
- No alert dialogs execute
- No malicious scripts run
- Legitimate formatting preserved
- Browser console shows no errors
- HTML structure intact (minus dangerous elements)

## Security Notes

This fix addresses XSS but should be part of defense-in-depth:
1. Sanitize on render (DONE - this fix)
2. Validate AI responses before storage (TODO)
3. Add Content Security Policy headers (TODO)
4. Implement rate limiting on API endpoints (TODO)
5. Add automated security testing (TODO)
