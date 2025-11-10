# User-Facing Copy Documentation
## Human Alignment Application

**Document Purpose:** Complete extraction of all user-facing text from the Human Alignment application.

**Date Created:** 2025-11-10

**Note:** This document captures EXACT copy as it appears in the code. No modifications or improvements have been made.

---

## Page: Homepage
**File:** `app/page.tsx`

### Metadata
- Title: "Human Alignment - AI-Guided Mutual Agreement Platform"
- Description: "Bridge disagreements through AI-facilitated conversations. Transform conflicts into clarity with structured alignment for partnerships, cofounders, and relationships."
- Keywords: "alignment, agreement, AI mediation, conflict resolution, partnership, cofounder agreement"
- OG Title: "Human Alignment - AI-Guided Mutual Agreement Platform"
- OG Description: "Bridge disagreements through AI-facilitated conversations"

### Section: About
- Heading: "What is Human Alignment?"
- Body: "Human Alignment uses AI to facilitate structured conversations between partners, helping you work through disagreements systematically and reach mutual understanding."
- Body: "Whether you're cofounders negotiating equity, partners making business decisions, or couples navigating life choices, our 5-step process guides you from conflict to consensus with AI-powered analysis and suggestions."

### Section: Footer
- Copyright: "© 2025 Human Alignment. All rights reserved."
- Link: "About"
- Link: "How It Works"
- Link: "Use Cases"
- Link: "Testimonials"

---

## Component: Hero
**File:** `components/homepage/Hero.tsx`

### Section: Main Hero
- Heading: "Human Alignment" (with line break before Alignment)
- Subheading: "Bridge disagreements through AI-facilitated conversations"
- Button: "Start Free Alignment"

---

## Component: Flow Visualization
**File:** `components/homepage/FlowVisualization.tsx`

### Section: Process Steps
- Heading: "Our 5-Step Process"

#### Step 1
- Number: "1."
- Title: "Setup"
- Description: "Select your partner and choose a template to begin the structured conversation and shared categorization touchpoints."

#### Step 2
- Number: "2."
- Title: "Clarify"
- Description: "Our AI assistant tailors essential issues to gather context surrounding your partnership and understand unique circumstances and priorities."

#### Step 3
- Number: "3."
- Title: "Answer"
- Description: "Each partner independently answers prompts the AI has tailored based on prior common issues to aid in building consensus among both parties."

#### Step 4
- Number: "4."
- Title: "Analyze"
- Description: "Our AI analyzes responses to find common ground, areas of conflict, and provides clear understanding of motivations and priorities."

#### Step 5
- Number: "5."
- Title: "Resolve"
- Description: "Facilitate straightforward reasoning and collaborative finalize that align both parties as committed to fairness."

---

## Component: Stats Section
**File:** `components/homepage/StatsSection.tsx`

### Section: Statistics
- Stat 1: "87%" - "Success Rate"
- Stat 2: "10k+" - "Agreements Reached"
- Stat 3: "70%" - "Faster Agreement"

---

## Component: Use Cases
**File:** `components/homepage/UseCases.tsx`

### Section: Use Cases
- Heading: "Perfect For Any Partnership"

#### Use Case 1: Business Partnerships
- Title: "Business Partnerships"
- Description: "Align on goals, equity, and responsibilities for your venture. Navigate complex commercial agreements and operational decisions with clarity."

#### Use Case 2: Cofounder Agreements
- Title: "Cofounder Agreements"
- Description: "Build solid foundation for your startup journey. Define equity splits, roles, and decision-making processes before challenges arise."

#### Use Case 3: Living Arrangements
- Title: "Living Arrangements"
- Description: "Navigate life decisions together effectively. Resolve roommate conflicts and household decisions through structured conversations."

#### Use Case 4: Strategic Decisions
- Title: "Strategic Decisions"
- Description: "Ensure projects are aligned before starting work. Coordinate team objectives and organizational alignment systematically."

---

## Component: Testimonials
**File:** `components/homepage/Testimonials.tsx`

### Section: Testimonials
- Heading: "What Our Users Say"

#### Testimonial 1
- Quote: "This tool saved our early-stage startup! We had disagreements on equity split, decision-making authority, and exit scenarios. Human Alignment helped us work through them systematically, and the AI caught potential conflicts we hadn't even considered. Within 48 hours, we had a solid cofounder agreement."
- Name: "Sarah Chen"
- Role: "Co-Founder & CEO"
- Company: "CloudSync AI"

#### Testimonial 2
- Quote: "After 15 years of marriage, we thought we knew how to communicate. But when it came to deciding whether to relocate for my job, we were stuck. The structured process helped us articulate what really mattered to each of us, and the AI analysis revealed compromises neither of us had thought of. We made the decision together, feeling heard and aligned."
- Name: "Marcus Johnson"
- Role: "Product Manager"
- Company: "Personal Use"

#### Testimonial 3
- Quote: "Our business partnership was on the verge of dissolving over operational disagreements. The AI's analysis was eerily accurate—it identified that our real conflict wasn't about the specifics we were arguing about, but underlying differences in risk tolerance and growth pace. Armed with that insight, we restructured our roles and saved the partnership."
- Name: "Priya Patel"
- Role: "Managing Partner"
- Company: "Patel & Associates Law"

#### Testimonial 4
- Quote: "I was skeptical about using AI for something as nuanced as conflict resolution, but I was desperate. My co-founder and I were deadlocked on product direction. The platform didn't just help us compromise—it helped us discover a third option that was better than either of our original proposals. The 'analyze' phase is genuinely insightful."
- Name: "David Kim"
- Role: "Technical Co-Founder"
- Company: "ByteForge Labs"

---

## Component: CTA Section
**File:** `components/homepage/CTASection.tsx`

### Section: Final CTA
- Heading: "Ready to align?"
- Subheading: "Start building stronger agreements through AI-guided conversations. Transform conflicts into clarity in minutes, not months."
- Button: "Get Started"
- Button: "Sign In"
- Trust Indicator: "Join 10,000+ users reaching meaningful agreements"

---

## Component: Header
**File:** `components/layout/Header.tsx`

### Section: Navigation
- Logo: "Human" (regular) + "Alignment" (colored accent)
- Nav Link: "About"
- Nav Link: "How It Works"
- Nav Link: "Use Cases"
- Nav Link: "Testimonials"
- Button: "Sign In"
- Button: "Get Started"
- Mobile Menu Button: "Toggle mobile menu" (aria-label)

---

## Page: Login
**File:** `app/(auth)/login/page.tsx`

### Section: Login Form
- Heading: "Log In to Your Account"
- Subheading: "Welcome back! Please enter your details."
- Label: "Email"
- Placeholder: "Enter your email"
- Label: "Password"
- Link: "Forgot password?"
- Placeholder: "Enter your password"
- Button: "Toggle password visibility" (aria-label)
- Button: "Logging in..." (loading state)
- Button: "Log In" (default state)
- Divider: "OR"
- Button: "Continue with Google (Coming Soon)" (disabled)
- Footer text: "Don't have an account?"
- Link: "Sign up"

### Section: Error Messages
- Error: "{state.error}" (dynamic error message from server)

---

## Page: Signup
**File:** `app/(auth)/signup/page.tsx`

### Section: Signup Form
- Heading: "Create Your Account"
- Subheading: "Start having more productive conversations today."
- Placeholder: "Username"
- Placeholder: "Email address"
- Placeholder: "Password"
- Placeholder: "Confirm Password"
- Button: "Toggle password visibility" (aria-label)
- Checkbox: "I agree to the"
- Link: "Terms of Service"
- Button: "Creating Account..." (loading state)
- Button: "Sign Up" (default state)
- Footer text: "Already have an account?"
- Link: "Log in"

### Section: Success Message
- Success: "Account created successfully! Redirecting to dashboard..." (or dynamic success message)

### Section: Field Error Messages
- Error: "{state.fieldErrors.username}" (dynamic)
- Error: "{state.fieldErrors.email}" (dynamic)
- Error: "{state.fieldErrors.password}" (dynamic)
- Error: "{state.fieldErrors.confirmPassword}" (dynamic)

---

## Page: Dashboard
**File:** `app/dashboard/page.tsx` & `app/dashboard/DashboardClient.tsx`

### Section: Header
- Logo: "Align The Humans"
- Button: "Notifications" (aria-label)

### Section: Main Content - Current Alignments
- Heading: "Current Alignments"
- Button: "Start New Alignment"

### Section: Empty State - Alignments
- Icon description: Document icon
- Heading: "No alignments yet"
- Body: "Start your first alignment to collaborate with partners on reaching mutual agreements"
- Button: "Start Your First Alignment"

### Section: Main Content - Partners
- Heading: "Your Partners"
- Button: "Add Partner"
- Placeholder: "Search partners..."

### Section: Error Messages
- Error heading: "Error loading alignments"
- Error body: "{alignmentsError.message}" (dynamic)
- Error heading: "Error loading partners"
- Error body: "{partnersError.message}" (dynamic)

---

## Component: Alignment Card
**File:** `components/dashboard/AlignmentCard.tsx`

### Section: Card Content
- Heading: "{alignment.title}" or "Untitled Alignment"
- Status Badge: (formatted status label - e.g., "Active", "Analyzing", "Complete")
- Description: "{alignment.description}" (truncated to 100 chars)
- Label: "Progress"
- Progress: "{progress}%"
- Label: "With:"
- Partner: "{partnerDisplay}"
- Next Step: "Next step: {nextSteps} →"
- Updated: "Updated {lastUpdated}"

### Section: Next Steps Text (by status)
- draft: "Complete setup"
- active: "Complete your answers"
- analyzing: "Review AI analysis"
- resolving: "Review conflicts and negotiate"
- complete: "View final agreement"
- waiting_partner: "Waiting for partner to respond"
- in_conflict_resolution: "Review AI suggestions"
- aligned_awaiting_signatures: "Sign agreement"
- stalled: "Resume alignment"

---

## Component: Partners List
**File:** `components/dashboard/PartnersList.tsx`

### Section: Empty State
- Icon description: Users icon
- Heading: "No partners yet"
- Body: "Add a partner to start collaborating on alignments"

### Section: Partner Item
- Name: "{displayName}"
- Count: "1 alignment" (singular)
- Count: "{alignment_count} alignments" (plural)
- Button: "More actions for {displayName}" (aria-label)

---

## Component: Add Partner Modal
**File:** `components/dashboard/AddPartnerModal.tsx`

### Section: Modal Header
- Title: "Add Partner"
- Description: "Search for a user by display name or email, or send an invite to a new user."

### Section: Mode Toggle
- Button: "Search Users"
- Button: "Send Invite"

### Section: Search Mode
- Label: "Search by name or email"
- Placeholder: "Enter display name or email..."
- Label: "Search Results"
- Loading: "Searching..."
- Empty: "No users found matching \"{searchQuery}\""
- User display: "{user.display_name}" or "Anonymous User"
- User email: "{user.email}"

### Section: Manual Invite Mode
- Label: "Email Address"
- Placeholder: "partner@example.com"
- Help text: "An invitation link will be sent to this email address."

### Section: Action Buttons
- Button: "Cancel"
- Button: "Adding..." (loading state)
- Button: "Add Partner" (default state)

### Section: Error Messages
- Error: "{error}" (dynamic error message)

---

## Page: New Alignment
**File:** `app/alignment/new/page.tsx` & `app/alignment/new/NewAlignmentClient.tsx`

### Section: Header
- Logo: "Align The Humans"
- Button: "Back to Dashboard"

### Section: Main Content
- Progress: "Step 1 of 5"
- Heading: "Start a New Alignment"
- Subheading: "Choose a template to get started, or describe your own situation below. The AI will guide you through the process."

### Section: Template Grid

#### Template 1: Operating Agreement
- Title: "Operating Agreement"
- Description: "Comprehensive business partnership terms"
- Button: "Creating..." (loading state)
- Button: "Selected" (selected state)
- Button: "Select" (default state)

#### Template 2: Cofounder Equity Split
- Title: "Cofounder Equity Split"
- Description: "Negotiate equity and roles"

#### Template 3: Roommate Agreement
- Title: "Roommate Agreement"
- Description: "Living arrangement terms"

#### Template 4: Marketing Strategy
- Title: "Marketing Strategy"
- Description: "Align on marketing decisions"

#### Template 5: Business Operations
- Title: "Business Operations"
- Description: "Day-to-day operational alignment"

#### Template 6: Custom
- Title: "Custom"
- Description: "Describe your own alignment needs"

### Section: Custom Description
- Heading: "Or Describe Your Own"
- Description: "If none of the templates fit, describe your situation. Our AI will create a custom-tailored conversation flow for you."
- Placeholder: "e.g., 'My co-founder and I need to agree on a vesting schedule for our company equity...'"
- Button: "Creating..." (loading state)
- Button: "Continue with Custom" (default state)

### Section: Error Messages
- Error: "{error}" (dynamic error message)

---

## Page: Join Alignment
**File:** `app/join/[token]/page.tsx` & `app/join/[token]/JoinAlignmentClient.tsx`

### Section: Header
- Heading: "You're Invited to Join an Alignment"

### Section: Alignment Preview
- Heading: "{alignment.title}"
- Description: "{alignment.description}"
- Creator: "Shared by {alignment.creatorName}"
- Expiration: "{expirationText}"

### Section: Authentication CTAs (Not logged in)
- Button: "Sign in to Join"
- Divider: "OR"
- Button: "Create Account"

### Section: Join CTA (Logged in)
- Button: "Joining..." (loading state)
- Button: "Join Alignment" (default state)

### Section: Footer
- Info text: "By joining this alignment, you agree to participate in a structured conversation to reach mutual agreement with your partner."

### Section: Error States

#### Invalid Link Format
- Heading: "Invalid Invitation Link"
- Body: "This invitation link is not valid. Please check the link and try again."
- Button: "Go to Homepage"

#### Invitation Not Found
- Heading: "Invitation Not Found"
- Body: "This invitation link does not exist or has been removed."
- Button: "Go to Homepage"

#### Invitation Revoked
- Heading: "Invitation Revoked"
- Body: "This invitation link has been revoked by the alignment creator."
- Button: "Go to Homepage"

#### Invitation Expired
- Heading: "Invitation Expired"
- Body: "This invitation link has expired. Please request a new invitation from the alignment creator."
- Button: "Go to Homepage"

#### Invitation Limit Reached
- Heading: "Invitation Limit Reached"
- Body: "This invitation link has reached its usage limit. Please request a new invitation from the alignment creator."
- Button: "Go to Homepage"

#### Alignment Completed
- Heading: "Alignment Completed"
- Body: "This alignment has been completed and is no longer accepting new participants."
- Button: "Go to Homepage"

#### Alignment Cancelled
- Heading: "Alignment Cancelled"
- Body: "This alignment has been cancelled and is no longer active."
- Button: "Go to Homepage"

### Section: Join Error
- Error icon description: Error icon
- Error: "{error}" (dynamic error message)

---

## Page: Clarity/Define Alignment
**File:** `app/alignment/[id]/clarity/page.tsx` & `app/alignment/[id]/clarity/ClarityForm.tsx`

### Section: Header
- Logo: "Align The Humans"
- Status: "Saving..." (when auto-saving)

### Section: Main Content
- Heading: "Define Your Alignment"
- Subheading: "Step 1 of 3: Clarify your goals for this conversation."

### Section: Accordion Section 1 - Topic
- Question: "What are you aligning over?"
- Label: "Topic" (sr-only)
- Help text: "Describe the topic or decision you need to align on."
- Placeholder: "e.g., Deciding on our vacation destination for this summer"
- Button: "Getting suggestions..." (loading state)
- Button: "Get AI Suggestions" (default state)
- Suggestions heading: "AI Suggestions"
- Button: "Use this" (for each suggestion)

### Section: Accordion Section 2 - Partner
- Question: "Who are you aligning with?"
- Label: "Partner" (sr-only)
- Help text: "Who is the other person in this conversation?"
- Selected partner display: "{selectedPartner.display_name}" or "Anonymous User"
- Selected partner email: "{selectedPartner.email}"
- Button: "Change"
- Search placeholder: "Search for a partner by name or email..."
- Manual placeholder: "e.g., My spouse, my business partner, my friend, partner@example.com"
- Button: "Getting suggestions..." (loading state)
- Button: "Get AI Suggestions" (default state)

### Section: Accordion Section 3 - Outcome
- Question: "What's the desired result?"
- Label: "Desired Result" (sr-only)
- Help text: "What does a successful outcome look like for this conversation?"
- Placeholder: "e.g., A clear, mutual decision"
- Button: "Getting suggestions..." (loading state)
- Button: "Get AI Suggestions" (default state)

### Section: Action Buttons
- Button: "Generating Questions..." (loading state)
- Button: "Continue" (default state)

### Section: Error Messages
- Error: "{error}" (dynamic error message)
- Validation: "Please describe what you're aligning over"
- Validation: "Please specify who you're aligning with"
- Validation: "Please describe the desired result"

---

## Component: Invite Status
**File:** `components/alignment/InviteStatus.tsx`

### Section: Loading State
- Loading text: "Loading status..."

### Section: Error State
- Error: "{error}" (dynamic error message)

### Section: Partner Joined
- Heading: "Partner Joined"
- Badge: "Active"
- Body: "{partnerName} joined this alignment"
- Date: "{formattedDate}"

### Section: Waiting for Partner
- Heading: "Waiting for Partner"
- Badge: "Pending"
- Body: "Your partner hasn't joined yet. Share the link below to invite them to this alignment."

---

## Component: Share Link Button
**File:** `components/alignment/ShareLinkButton.tsx`

### Section: Loading State
- Loading text: "Loading share link..."

### Section: Error State
- Error: "Failed to load share link"
- Button: "Retry"

### Section: Share Link Display
- Label: "Invite link" (aria-label)
- Button: "Copy link" (aria-label)
- Expiration: "Expires in {days} day(s)" or "Expires today"

### Section: Action Buttons
- Button: "Share" (mobile only with Web Share API)
- Button: "Regenerating..." (loading state)
- Button: "Regenerate" (default state)

### Section: Regenerate Dialog
- Title: "Regenerate Share Link?"
- Description: "This will create a new share link and invalidate the current one. The old link will immediately stop working. Your partner will need the new link to join."
- Button: "Cancel"
- Button: "Regenerate Link"

### Section: Toast Messages
- Success: "Link copied to clipboard!"
- Error: "Failed to copy link"
- Success: "Share successful!"
- Error: "Failed to share link"
- Success: "New share link generated!"
- Success description: "The old link will no longer work."
- Error: "Failed to regenerate link"

---

## Component: Status Badge
**File:** `components/dashboard/StatusBadge.tsx`

### Section: Status Labels (Formatted)
- draft: "Draft"
- active: "Active"
- analyzing: "Analyzing"
- resolving: "Resolving"
- complete: "Complete"
- waiting_partner: "Waiting Partner"
- in_conflict_resolution: "In Conflict Resolution"
- aligned_awaiting_signatures: "Aligned Awaiting Signatures"
- stalled: "Stalled"

---

## Page: Root Error
**File:** `app/error.tsx`

### Section: Error State
- Heading: "Something went wrong"
- Body: "We encountered an unexpected error. Please try again."
- Error detail: "{error.message}" (if available)
- Button: "Try Again"

---

## Page: Root Loading
**File:** `app/loading.tsx`

### Section: Loading State
- Loading text: "Loading..."

---

## Summary

**Total Pages Documented:** 9 core pages
- Homepage
- Login
- Signup
- Dashboard
- New Alignment
- Join Alignment (with invitation flow)
- Clarity/Define Alignment
- Root Error
- Root Loading

**Total Components Documented:** 11 major components
- Hero
- Flow Visualization
- Stats Section
- Use Cases
- Testimonials
- CTA Section
- Header
- Alignment Card
- Partners List
- Add Partner Modal
- Invite Status
- Share Link Button
- Status Badge

**Total Copy Elements:** 300+ distinct user-facing text strings

**Note:** This document captures the core user-facing pages and components. Additional pages (questions, analysis, resolution, document) were not yet fully documented in this extraction pass but follow similar patterns with their own specific copy.

---

## Document Metadata
- **Extraction Date:** 2025-11-10
- **Files Read:** 25+ source files
- **Lines of Code Analyzed:** 5,000+
- **Methodology:** Direct file reading with exact text extraction
- **No Modifications Made:** All copy is documented as-is from source code
