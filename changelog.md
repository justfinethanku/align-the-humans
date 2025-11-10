# CHANGELOG.md

**DO NOT USE THIS FILE FOR SESSION LOGS**

All detailed changelogs should be created in the `/changelog/` directory as session-specific markdown files.

**IMPORTANT:** After creating a detailed changelog, you MUST also add a summary entry to `/changelog/README` following the template below.

---


## Format for Session Changelogs

Filename: `YYYY-MM-DD-HHMM-descriptive-keywords.md`

Location: `/changelog/`

### README Summary Entry (REQUIRED)

After creating your detailed changelog, add a summary to `/changelog/README` using this template:

```
### [YYYY-MM-DD-HHMM - descriptive-name](./YYYY-MM-DD-HHMM-descriptive-name.md)
**Keywords:** [KEYWORD] [KEYWORD] [KEYWORD]
High-level non-verbose succinct description of what's in the session summary.
```

**Example:**
```
### [2025-11-10-0032 - supabase database setup](./2025-11-10-0032-supabase-database-setup.md)
**Keywords:** [DATABASE] [SUPABASE] [RLS]
Comprehensive Supabase database setup with 8 tables, RLS policies, realtime triggers, and production-ready Next.js examples.
```

## Session Changelog Format

Each session changelog should include:

### Header
- **Keywords:** Searchable tags in brackets (e.g., [DATABASE] [MIGRATION] [BREAKING])
- **Session:** Time of day and estimated duration
- **Commit:** Git commit SHA(s) for the work

### Sections
- **What Changed:** Files modified, features added, code refactored
- **Why:** Problems being solved, motivations, business context
- **How It Was Done:** Implementation approach, technical decisions
- **Issues Encountered:** Bugs found, challenges faced, solutions applied
- **Dependencies:** Packages added/removed, environment changes
- **Testing Notes:** What was tested, what wasn't, edge cases covered
- **Next Steps:** Follow-up work required, future enhancements
- **Impact Assessment:** Performance, UX, developer experience improvements
- **Lessons Learned:** What worked well, what could be improved, key takeaways

## Why Session Changelogs?

1. **Better Organization:** One file per work session makes navigation easier
2. **Searchable:** Filename keywords enable fast searching (git grep, file explorer)
3. **Context-Rich:** Each changelog documents complete context for future reference
4. **Git-Friendly:** Smaller files = less merge conflicts
5. **Historical Reference:** Easy to find "when did we migrate to AI Gateway?" → search for filename
6. **Onboarding:** New developers can read session logs to understand evolution


---

**Do NOT put work logs in this file. Use the `/changelog/` directory.**
