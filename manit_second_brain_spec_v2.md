# MANIT AI Second Brain — Engineering Specification v2.0

> **Audience:** AI coding agent (Cursor / Windsurf). Implement exactly as described. Every section is a direct instruction, not a suggestion.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Objectives](#2-core-objectives)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Authentication System](#4-authentication-system)
5. [Feature Specifications](#5-feature-specifications)
6. [Technical Architecture](#6-technical-architecture)
7. [Database Schemas](#7-database-schemas)
8. [API Contract](#8-api-contract)
9. [AI Subsystems](#9-ai-subsystems)
10. [Frontend Pages & Components](#10-frontend-pages--components)
11. [UI Design System](#11-ui-design-system)
12. [Admin Dashboard](#12-admin-dashboard)
13. [Security Requirements](#13-security-requirements)
14. [Environment Variables](#14-environment-variables)
15. [Folder Structure](#15-folder-structure)
16. [Deployment](#16-deployment)
17. [Implementation Phases](#17-implementation-phases)

---

## 1. Project Overview

**MANIT Second Brain** is a full-stack AI-powered knowledge-sharing platform exclusively for students and alumni of MANIT Bhopal. It functions as a living institutional memory — where college experiences, placement stories, exam strategies, and hostel tips are stored, surfaced, and answered by AI.

**Core value proposition:**
- Students stop asking the same questions repeatedly
- Juniors get reliable, experience-backed guidance instantly
- Alumni knowledge is preserved and accessible
- AI summarizes community knowledge into direct answers

**Tech stack:** MERN (MongoDB Atlas + Express.js + React.js + Node.js) with Gemini/OpenAI AI integration and MongoDB Atlas Vector Search for semantic retrieval.

---

## 2. Core Objectives

| Objective | How it is achieved |
|---|---|
| Preserve alumni knowledge | Posts stored permanently with embeddings |
| Surface relevant information | Semantic vector search on every AI query |
| Reduce repetitive questions | AI answers synthesize existing posts first |
| Trust & quality | AI moderation pipeline flags harmful content |
| Searchable institutional memory | Category-based feed + AI chat interface |
| Role-based access | Student / Alumni / Admin with enforced JWT middleware |

---

## 3. User Roles & Permissions

### 3.1 Role Matrix

| Action | Student | Alumni | Admin |
|---|---|---|---|
| Register / Login | ✅ | ✅ | Separate passkey login |
| Create posts | ✅ | ✅ | ❌ |
| Read posts | ✅ | ✅ | ✅ |
| Upvote / Downvote posts | ✅ | ✅ | ❌ |
| Ask AI doubts | ✅ | ✅ | ❌ |
| View own AI chat history | ✅ | ✅ | ❌ |
| View flagged posts queue | ❌ | ❌ | ✅ |
| Approve / Delete posts | ❌ | ❌ | ✅ |
| Change post category | ❌ | ❌ | ✅ |
| Access analytics dashboard | ❌ | ❌ | ✅ |
| Alumni badge on posts | ❌ | ✅ | ❌ |

### 3.2 Role Assignment Logic

Role is **never manually selected**. It is derived automatically from the email at registration.

```
email format: <rollnumber>@stu.manit.ac.in
batch year   = first two digits of rollnumber

if batch_year >= 23  → role = "student"
if batch_year <  23  → role = "alumni"
```

Example:
- `24112011371@stu.manit.ac.in` → batch 24 → `student`
- `19112011020@stu.manit.ac.in` → batch 19 → `alumni`

Reject any email not matching `*@stu.manit.ac.in` at both frontend (validation) and backend (middleware).

---

## 4. Authentication System

### 4.1 Student / Alumni Registration

**Endpoint:** `POST /api/auth/register`

Steps:
1. Validate email ends with `@stu.manit.ac.in` — reject otherwise with error `"Only MANIT student emails are allowed."`
2. Extract roll number prefix (digits before `@`)
3. Extract first two digits as `batchYear`
4. Assign `role = batchYear >= 23 ? "student" : "alumni"`
5. Hash password with `bcrypt` (salt rounds: 12)
6. Save user document
7. Return JWT token + user object (exclude password)

**Validation rules:**
- Name: required, min 2 chars
- Email: must match regex `/^\d+@stu\.manit\.ac\.in$/`
- Password: min 8 chars, must include at least one number

### 4.2 Student / Alumni Login

**Endpoint:** `POST /api/auth/login`

1. Find user by email
2. Compare password with `bcrypt.compare`
3. Return signed JWT (`expiresIn: "7d"`) + user object

### 4.3 Admin Login

**Endpoint:** `POST /api/admin/login`

- Admin has no registration flow
- Admin credentials stored in `.env` as `ADMIN_EMAIL` and `ADMIN_PASSKEY`
- Passkey compared directly (store hashed in `.env` using bcrypt offline hash)
- On success: return JWT with `role: "admin"` payload
- All `/api/admin/*` routes protected by `requireAdmin` middleware

### 4.4 JWT Middleware

Create two middleware functions:

```js
// requireAuth — validates any logged-in user
// requireAdmin — validates role === "admin" in JWT payload
```

Attach decoded user to `req.user` on every protected route.

### 4.5 Token Storage (Frontend)

Store JWT in `localStorage` key `manit_token`. Attach to every Axios request via a global interceptor:

```js
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem("manit_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 5. Feature Specifications

### 5.1 Post Creation

**What a post contains:**
- `content` (string, required, min 20 chars, max 2000 chars)
- `links` (array of strings, optional) — any valid URL accepted

**Supported link types (show icons for these):**
- YouTube (`youtube.com`, `youtu.be`)
- GitHub (`github.com`)
- Google Drive (`drive.google.com`)
- Other (generic link icon)

**Post submission flow:**
1. User submits post from frontend
2. Backend saves post with `moderationStatus: "pending"`
3. Background job calls AI moderation (see §9.2)
4. If SAFE: update to `moderationStatus: "approved"`, call AI categorization (§9.1), generate and store embedding (§9.3)
5. If FLAGGED: update to `moderationStatus: "flagged"`, store `moderationReason`, hide from public feed
6. Post appears in public feed only when `moderationStatus === "approved"`

> **Important:** Do not make the user wait for AI processing. Return `201 Created` immediately after saving with `pending` status. Run moderation asynchronously.

### 5.2 Post Feed

**Feed behavior:**
- Fetch only posts where `moderationStatus === "approved"`
- Group by category into horizontal sections (tabs or sidebar nav)
- Default sort: by net votes (`upvotes - downvotes`) descending
- Secondary sort: `createdAt` descending (recency as tiebreaker)
- Show role badge on each post card: `STUDENT` (blue) or `ALUMNI` (gold/amber)
- Paginate: 10 posts per page, infinite scroll or "Load More"

**Categories (tabs/sections):**
1. Semester Exam Tips
2. Placement Experiences
3. Coding Resources
4. Hostel Reviews
5. Faculty Reviews
6. Career Advice
7. Others

### 5.3 Voting System

- One vote per user per post (upvote OR downvote, not both)
- Clicking the same vote again toggles it off (removes vote)
- Switching vote (up→down) replaces previous vote
- Vote stored in `votes` collection (not embedded in post) for scalability
- Real-time vote count update on frontend (optimistic UI)

**Vote API:** `PUT /api/posts/vote`
```json
{ "postId": "...", "voteType": "upvote" | "downvote" }
```

Backend logic:
- Check existing vote for `(userId, postId)`
- If same type: remove vote (toggle off)
- If different type: replace vote
- If none: create vote
- Recalculate and return updated `upvotes` / `downvotes` count

### 5.4 AI Doubt Chat

**Interface:** Chat UI similar to ChatGPT — message bubbles, input at bottom, history on left (collapsible sidebar on mobile).

**Conversation persistence:**
- All Q&A stored in `ai_chats` collection linked to `studentId`
- Conversation history loads on login from DB
- User can **delete** individual messages or **clear all** history
- History is private — never visible to other users or admin

**Query flow (backend):**

```
1. Receive user question
2. Generate embedding for the question (Gemini or OpenAI embeddings)
3. Run MongoDB Atlas Vector Search → retrieve top 5 semantically similar posts
4. If relevance score > threshold (0.75):
     Build context from retrieved posts → call Gemini/GPT with RAG prompt
5. If no relevant posts found (score < 0.75):
     Call Gemini/GPT with general knowledge prompt (no RAG context)
6. Return AI answer + list of referenced post IDs
7. Save { studentId, question, aiAnswer, referencedPosts, createdAt } to DB
```

**In the chat UI:** If referenced posts exist, show them as cards below the AI answer labeled "Sources from MANIT community."

**Rate limiting:** Max 20 AI chat requests per user per hour. Return `429 Too Many Requests` with message `"You've reached your hourly limit. Try again later."` 

---

## 6. Technical Architecture

### 6.1 System Diagram

```
Browser (React) 
    │
    ▼
Axios (with JWT interceptor)
    │
    ▼
Express.js API Server (Node.js)
    ├── Auth routes
    ├── Post routes
    ├── AI routes (rate-limited)
    └── Admin routes
         │
         ├── MongoDB Atlas (primary DB)
         │     ├── users
         │     ├── posts (with vector embeddings)
         │     ├── ai_chats
         │     ├── votes
         │     └── flagged_posts
         │
         └── AI Provider (Gemini / OpenAI)
               ├── Text generation
               ├── Embedding generation
               └── Moderation
```

### 6.2 Frontend Stack

| Library | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Tailwind CSS v3 | Utility-first styling |
| Framer Motion | Page transitions + animations |
| Axios | HTTP client with interceptors |
| Recharts | Analytics charts |
| React Hot Toast | Notifications |
| Lucide React | Icons |

### 6.3 Backend Stack

| Library | Purpose |
|---|---|
| Node.js 20 | Runtime |
| Express.js | Web framework |
| mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth |
| express-rate-limit | Rate limiting AI routes |
| dotenv | Environment config |
| cors | CORS handling |

### 6.4 AI Provider Strategy

Support both providers via a unified adapter. Select provider via `AI_PROVIDER` env variable.

```js
// server/ai/aiAdapter.js
const provider = process.env.AI_PROVIDER; // "gemini" | "openai"

export async function generateText(prompt) { ... }
export async function generateEmbedding(text) { ... }
```

**Gemini (primary / free):**
- Model: `gemini-1.5-flash` for text generation
- Model: `text-embedding-004` for embeddings
- SDK: `@google/generative-ai`

**OpenAI (fallback / paid):**
- Model: `gpt-4o-mini` for text generation
- Model: `text-embedding-3-small` for embeddings
- SDK: `openai`

### 6.5 MongoDB Atlas Vector Search

- Store `embedding` field (1536-dim for OpenAI, 768-dim for Gemini) on every approved post
- Create Atlas Search index on `posts.embedding` field of type `knnVector`
- Use `$vectorSearch` aggregation stage for similarity queries

```js
// Example vector search aggregation
db.posts.aggregate([
  {
    $vectorSearch: {
      index: "post_embeddings",
      path: "embedding",
      queryVector: userQuestionEmbedding,
      numCandidates: 50,
      limit: 5
    }
  },
  {
    $project: {
      content: 1,
      category: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
])
```

---

## 7. Database Schemas

### 7.1 Users Collection

```js
// server/models/User.js
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^\d+@stu\.manit\.ac\.in$/
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "alumni"],
    required: true
  },
  batchYear: {
    type: Number,
    required: true
  }
}, { timestamps: true });
```

### 7.2 Posts Collection

```js
// server/models/Post.js
const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ["student", "alumni"], required: true },
  content: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  links: [{ type: String }],
  category: {
    type: String,
    enum: [
      "Semester Exam Tips",
      "Placement Experiences",
      "Coding Resources",
      "Hostel Reviews",
      "Faculty Reviews",
      "Career Advice",
      "Others"
    ],
    default: "Others"
  },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  moderationStatus: {
    type: String,
    enum: ["pending", "approved", "flagged"],
    default: "pending"
  },
  moderationReason: { type: String, default: null },
  embedding: { type: [Number], default: [] } // vector embedding for semantic search
}, { timestamps: true });
```

### 7.3 Votes Collection

```js
// server/models/Vote.js
const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  voteType: {
    type: String,
    enum: ["upvote", "downvote"],
    required: true
  }
}, { timestamps: true });

voteSchema.index({ userId: 1, postId: 1 }, { unique: true });
```

### 7.4 AI Chats Collection

```js
// server/models/AiChat.js
const aiChatSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  question: { type: String, required: true },
  aiAnswer: { type: String, required: true },
  referencedPosts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Post" 
  }]
}, { timestamps: true });

aiChatSchema.index({ studentId: 1, createdAt: -1 });
```

---

## 8. API Contract

All responses follow this envelope:

```json
{ "success": true | false, "data": { ... }, "message": "..." }
```

### 8.1 Auth Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register student/alumni |
| POST | `/api/auth/login` | None | Login student/alumni |
| POST | `/api/admin/login` | None | Admin passkey login |
| GET | `/api/auth/me` | Required | Get current user |

**Register request body:**
```json
{ "name": "Rahul Kumar", "email": "24112011371@stu.manit.ac.in", "password": "pass1234" }
```

**Register response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "_id": "...", "name": "Rahul Kumar", "email": "...", "role": "student" }
  }
}
```

### 8.2 Post Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | Required | Get all approved posts |
| GET | `/api/posts?category=Hostel+Reviews` | Required | Filter by category |
| POST | `/api/posts` | Required | Create new post |
| PUT | `/api/posts/vote` | Required | Upvote / downvote |
| GET | `/api/posts/:id` | Required | Single post detail |

**Create post request body:**
```json
{ "content": "Here's how I prepared for DBMS exam...", "links": ["https://youtube.com/..."] }
```

**Get posts query params:**
- `category` (optional): filter by category
- `page` (optional, default 1): pagination
- `limit` (optional, default 10): posts per page
- `sort` (optional, default `votes`): `votes` | `recent`

### 8.3 AI Routes

| Method | Route | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/api/ai/ask` | Required | 20/hr/user | Submit AI doubt query |
| GET | `/api/ai/history` | Required | None | Get user's chat history |
| DELETE | `/api/ai/history/:id` | Required | None | Delete one chat entry |
| DELETE | `/api/ai/history` | Required | None | Clear all chat history |

**Ask request body:**
```json
{ "question": "How was the Infosys hiring process at MANIT?" }
```

**Ask response:**
```json
{
  "success": true,
  "data": {
    "answer": "Based on experiences shared by MANIT students...",
    "referencedPosts": [ { "_id": "...", "content": "...", "category": "..." } ],
    "chatId": "..."
  }
}
```

### 8.4 Admin Routes

All require `requireAdmin` middleware.

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/flagged-posts` | Get all flagged posts |
| PUT | `/api/admin/approve/:id` | Approve a flagged post |
| DELETE | `/api/admin/delete/:id` | Permanently delete post |
| PUT | `/api/admin/category/:id` | Change post category |
| GET | `/api/admin/analytics` | Get analytics data |

**Analytics response shape:**
```json
{
  "totalPosts": 340,
  "totalUsers": 128,
  "flaggedCount": 7,
  "topCategory": "Placement Experiences",
  "categoryBreakdown": [
    { "category": "Placement Experiences", "count": 90 },
    { "category": "Coding Resources", "count": 72 }
  ],
  "topPosts": [
    { "_id": "...", "content": "...", "upvotes": 45, "category": "..." }
  ]
}
```

---

## 9. AI Subsystems

### 9.1 Categorization

**Trigger:** Called after a post passes moderation (status becomes `approved`).

**Prompt:**
```
You are categorizing posts for a college knowledge platform.

Classify the following post into EXACTLY ONE of these categories:
- Semester Exam Tips
- Placement Experiences
- Coding Resources
- Hostel Reviews
- Faculty Reviews
- Career Advice
- Others

Post content:
"""
{POST_CONTENT}
"""

Respond with ONLY the category name, nothing else.
```

**Implementation:** Parse the response, validate it against the enum list, fall back to `"Others"` if unrecognized.

### 9.2 Content Moderation

**Trigger:** Called immediately after every new post is saved (asynchronous background call).

**Prompt:**
```
You are a content moderator for a college community platform.

Analyze the following post for:
- Spam or promotional content
- Abusive, offensive, or toxic language
- Threats or harassment
- Misinformation or factually dangerous claims
- Personally identifying information of others

Post content:
"""
{POST_CONTENT}
"""

Respond with ONLY a JSON object in this exact format:
{
  "status": "SAFE" | "FLAGGED",
  "reason": null | "brief reason string (max 100 chars)"
}

No markdown, no explanation, just the JSON.
```

**Implementation:**
- Parse JSON response (strip markdown fences if present)
- If `status === "FLAGGED"`: set `moderationStatus: "flagged"`, save `moderationReason`
- If `status === "SAFE"`: set `moderationStatus: "approved"`, proceed to categorize + embed

### 9.3 Embedding Generation

**Trigger:** Called on every post that is approved (after categorization).

```js
// server/ai/embeddingService.js
async function embedPost(postContent) {
  const embedding = await generateEmbedding(postContent); // from aiAdapter.js
  await Post.findByIdAndUpdate(postId, { embedding });
}
```

Embedding dimension must match the Atlas Vector Search index configuration. Document in `.env`:
```
EMBEDDING_DIM=768       # for Gemini text-embedding-004
# EMBEDDING_DIM=1536   # for OpenAI text-embedding-3-small
```

### 9.4 AI Doubt Answering

**RAG Prompt (when relevant posts found):**
```
You are an AI assistant for MANIT Bhopal students. Answer the student's question 
using the relevant community posts provided below as your primary knowledge source.

Be concise, practical, and specific to MANIT context. 
Format your answer in clear paragraphs. Do not use bullet points unless listing steps.

Student's Question:
{QUESTION}

Relevant Community Posts:
{RETRIEVED_POSTS_AS_NUMBERED_LIST}

Answer:
```

**Fallback Prompt (no relevant posts):**
```
You are an AI assistant for MANIT Bhopal students. 
Answer the following question based on your general knowledge about Indian engineering colleges, 
placements, and college life. Be helpful and practical.

Question:
{QUESTION}

Answer:
```

---

## 10. Frontend Pages & Components

### 10.1 Page Map

| Route | Component | Auth Required | Description |
|---|---|---|---|
| `/` | `HomePage` | No | Landing / redirect to feed |
| `/register` | `RegisterPage` | No | Registration form |
| `/login` | `LoginPage` | No | Login form |
| `/feed` | `FeedPage` | Yes | Main post feed |
| `/post/new` | `CreatePostPage` | Yes | Create new post |
| `/chat` | `ChatPage` | Yes | AI doubt chat |
| `/admin` | `AdminDashboard` | Admin only | Admin panel |

### 10.2 Shared Components

```
components/
├── Navbar.jsx              # Top nav with user info + logout
├── PostCard.jsx            # Post display card with vote buttons
├── RoleBadge.jsx           # "STUDENT" or "ALUMNI" pill badge
├── CategoryTabs.jsx        # Horizontal tab bar for feed filtering
├── LinkPreview.jsx         # Render link with icon (YouTube/GitHub/etc.)
├── LoadingSpinner.jsx      # Centered spinner
├── ProtectedRoute.jsx      # Wrapper that checks auth
└── AdminRoute.jsx          # Wrapper that checks admin role
```

### 10.3 FeedPage Specification

Layout:
- Full-width with sticky `Navbar`
- Left sidebar (desktop): category list, collapsible on mobile
- Center: post cards list
- Each `PostCard` shows:
  - Author name + role badge
  - Content (truncated to 200 chars with "Read more" expansion)
  - Links section with icons
  - Category pill
  - Vote buttons (↑ count | ↓ count)
  - Timestamp (relative: "2 hours ago")

### 10.4 CreatePostPage Specification

- Textarea for content (shows character count `0 / 2000`)
- Dynamic link input: "Add Link" button adds an input row, "×" removes it
- Link type auto-detected and icon shown beside URL
- Submit button → disabled while submitting
- After submit: show toast "Post submitted! It will appear after review." → navigate to `/feed`

### 10.5 ChatPage Specification

Layout:
- Left panel (250px): conversation history list, "New Chat" button, "Clear All" button
- Right panel: active chat with messages
- Bottom: input + send button
- Messages: user messages right-aligned (accent color), AI messages left-aligned (dark card)
- Below each AI message: "Sources from MANIT community" expandable section showing referenced post cards (if any)
- Typing indicator (animated dots) while AI is responding
- On mobile: history panel hidden, accessible via hamburger icon

### 10.6 Auth Pages

- Single-column centered card layout
- Email field: on blur, validate MANIT domain and show inline error if invalid
- Password field: show/hide toggle
- On register: show role that will be assigned (`"You will be registered as: Student"`) after valid email is entered
- Redirect to `/feed` on success

---

## 11. UI Design System

### 11.1 Color Palette

```css
:root {
  --bg-primary: #0a0a0f;       /* near-black background */
  --bg-secondary: #12121a;     /* card backgrounds */
  --bg-glass: rgba(255,255,255,0.04); /* glassmorphism base */
  --border-glass: rgba(255,255,255,0.08);

  --accent-blue: #3b82f6;      /* student badge, primary CTA */
  --accent-amber: #f59e0b;     /* alumni badge, gold highlights */
  --accent-purple: #8b5cf6;    /* AI chat elements */
  --accent-green: #10b981;     /* success states */
  --accent-red: #ef4444;       /* downvote, error states */

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
}
```

### 11.2 Glassmorphism Card Style

```css
.glass-card {
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
}
```

Apply to: PostCard, ChatMessage (AI), Modal overlays, Navbar.

### 11.3 Typography

- **Display / Headings:** `'Syne'` (Google Fonts) — geometric, modern
- **Body / UI text:** `'DM Sans'` (Google Fonts) — clean, readable
- Font sizes follow Tailwind scale: `text-sm` for metadata, `text-base` for body, `text-xl+` for headings

### 11.4 Animations (Framer Motion)

- **Page transitions:** `opacity 0→1`, `y 20→0`, `duration: 0.3`
- **PostCard entry:** stagger children with `0.05s` delay per card
- **Vote button:** scale `1→1.15→1` on click (spring)
- **Chat message entry:** slide in from bottom with fade
- **Skeleton loaders:** pulsing shimmer while fetching posts

### 11.5 Role Badges

```jsx
// Student
<span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
  STUDENT
</span>

// Alumni
<span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
  ALUMNI
</span>
```

---

## 12. Admin Dashboard

### 12.1 Layout

- Separate login page at `/admin/login` (not linked from main nav)
- After login: redirect to `/admin`
- Sidebar nav: Analytics | Flagged Posts | All Posts

### 12.2 Analytics Panel

Metrics cards (top row):
- Total Posts
- Total Users
- Flagged Posts (pending review)
- Top Category

Charts:
- Bar chart: Posts by category (Recharts `BarChart`)
- (Optional) Line chart: Posts over time

Top 3 Upvoted Posts:
- Show as ranked cards with medal icons (🥇🥈🥉)

### 12.3 Flagged Posts Queue

Table columns: Content (truncated) | Author | Role | Flag Reason | Date | Actions

Actions per row:
- **Approve** button → calls `PUT /api/admin/approve/:id` → triggers categorization + embedding
- **Delete** button → calls `DELETE /api/admin/delete/:id` → confirm dialog before deletion

### 12.4 Category Edit

On any post in admin view: dropdown to change category → calls `PUT /api/admin/category/:id`.

---

## 13. Security Requirements

| Requirement | Implementation |
|---|---|
| Password hashing | `bcrypt` with salt rounds = 12 |
| Auth tokens | JWT, `expiresIn: "7d"`, secret from env |
| MANIT email enforcement | Regex validation at frontend + backend |
| Input sanitization | Trim and escape all string inputs before DB save |
| Admin route protection | `requireAdmin` middleware on all `/api/admin/*` |
| Rate limiting (AI) | `express-rate-limit`: 20 requests/hour per user IP + userId |
| CORS | Restrict to frontend origin via env variable |
| Secrets management | All API keys and secrets in `.env`, never hardcoded |
| XSS prevention | Never render user content with `dangerouslySetInnerHTML` |
| Password in response | Never return `password` field in any API response (use `.select("-password")`) |

---

## 14. Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/manit-second-brain

# JWT
JWT_SECRET=your_long_random_secret_here

# Admin Credentials
ADMIN_EMAIL=admin@manit.ac.in
ADMIN_PASSKEY_HASH=<bcrypt hash of passkey>

# AI Provider: "gemini" or "openai"
AI_PROVIDER=gemini

# Gemini (if AI_PROVIDER=gemini)
GEMINI_API_KEY=your_gemini_key

# OpenAI (if AI_PROVIDER=openai)
OPENAI_API_KEY=your_openai_key

# Embedding dimensions (match to provider)
EMBEDDING_DIM=768
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 15. Folder Structure

```
manit-second-brain/
│
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── RoleBadge.jsx
│   │   │   ├── CategoryTabs.jsx
│   │   │   ├── LinkPreview.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── SkeletonCard.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── FeedPage.jsx
│   │   │   ├── CreatePostPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       └── AdminDashboard.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── usePosts.js
│   │   │   └── useChat.js
│   │   ├── services/
│   │   │   ├── axiosInstance.js    # Axios with JWT interceptor
│   │   │   ├── authService.js
│   │   │   ├── postService.js
│   │   │   └── aiService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── utils/
│   │   │   ├── linkUtils.js        # Detect link type + icon
│   │   │   └── timeUtils.js        # Relative time formatting
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind directives + CSS vars
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── postController.js
│   │   ├── aiController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── aiRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── requireAuth.js
│   │   ├── requireAdmin.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Vote.js
│   │   └── AiChat.js
│   ├── services/
│   │   ├── vectorSearchService.js  # MongoDB Atlas Vector Search queries
│   │   └── postProcessingService.js # Orchestrates moderate → categorize → embed
│   ├── ai/
│   │   ├── aiAdapter.js            # Unified provider abstraction
│   │   ├── moderationService.js
│   │   ├── categorizationService.js
│   │   ├── embeddingService.js
│   │   └── doubtAnswerService.js
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── app.js                      # Express app setup (middleware, routes)
│   └── server.js                   # Entry point (listens on PORT)
│
├── .env                            # Backend env (gitignored)
├── .gitignore
└── README.md
```

---

## 16. Deployment

### Frontend → Vercel

1. Connect GitHub repo to Vercel
2. Set root directory to `client/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env variable: `VITE_API_BASE_URL=https://your-render-backend.onrender.com`

### Backend → Render

1. Connect GitHub repo to Render
2. Set root directory to `server/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all backend `.env` variables in Render's environment settings

### Database → MongoDB Atlas

1. Create free M0 cluster
2. Create database `manit-second-brain`
3. Collections: `users`, `posts`, `votes`, `ai_chats`
4. **Create Vector Search Index** on `posts` collection:
   - Field: `embedding`
   - Type: `knnVector`
   - Dimensions: match `EMBEDDING_DIM` env variable
   - Similarity: `cosine`
5. Whitelist Render's IP (or allow all IPs: `0.0.0.0/0` for simplicity)

---

## 17. Implementation Phases

### Phase 1 — Foundation (Week 1)
- [ ] Project scaffold (Vite + Express)
- [ ] MongoDB connection
- [ ] User model + auth routes (register/login/admin)
- [ ] JWT middleware
- [ ] Login + Register pages with MANIT email validation
- [ ] AuthContext + ProtectedRoute
- [ ] Basic Navbar

### Phase 2 — Core Features (Week 2)
- [ ] Post model + create post API
- [ ] Feed API with category filter + pagination
- [ ] Vote model + vote API
- [ ] FeedPage UI with PostCard, CategoryTabs, RoleBadges
- [ ] CreatePostPage with link inputs
- [ ] Optimistic vote UI

### Phase 3 — AI Integration (Week 3)
- [ ] `aiAdapter.js` with Gemini + OpenAI support
- [ ] Moderation service + prompt
- [ ] Categorization service + prompt
- [ ] Embedding service
- [ ] Async post-processing pipeline
- [ ] Admin flagged posts queue + approve/delete
- [ ] Vector Search index setup in Atlas

### Phase 4 — AI Chat + Admin (Week 4)
- [ ] Doubt answering service (RAG + fallback)
- [ ] AI chat API with history persistence
- [ ] ChatPage UI (history sidebar + message bubbles + sources)
- [ ] Rate limiting on AI routes
- [ ] Admin analytics API + dashboard UI (charts)

### Phase 5 — Polish + Deploy (Week 5)
- [ ] Framer Motion transitions on all pages
- [ ] Skeleton loaders for feed and chat
- [ ] Mobile responsiveness pass
- [ ] Error boundary + toast notifications
- [ ] Final `.env` setup
- [ ] Deploy frontend → Vercel, backend → Render
- [ ] Configure CORS for production URLs
- [ ] End-to-end testing of all flows

---

*Spec version: 2.0 | Last updated: May 2025 | Project: MANIT Second Brain*
