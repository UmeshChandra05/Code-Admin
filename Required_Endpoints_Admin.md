# Required Endpoints — Admin Module (`code-canvas-admin`)

> Audit of all API endpoints from `coding-platform-api-endpoints.md` against the current admin UI.
> Organized by: **✅ Used** (has UI) | **⚠️ Available but No Dedicated UI** | **🔧 Enhancement Opportunities**

---

## Endpoint Coverage Summary

| Category | Total Endpoints | Used in UI | No UI Yet |
|----------|:-:|:-:|:-:|
| Authentication | 1 | 1 | 0 |
| Tags | 5 | 5 | 0 |
| Modules | 5 | 5 | 0 |
| Problems | 6 | 6 | 0 |
| Test Cases | 4 | 3 | 1 |
| Contests | 10 | 10 | 0 |
| Submissions | 4 | 4 | 0 |
| **Totals** | **35** | **34** | **1** |

---

## ✅ Endpoints Currently Used

### Authentication
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | `Login.tsx` — Login form |

### Tags (Full CRUD)
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `POST` | `/api/coding-platform/tag/create` | `TagsPage.tsx` — Create dialog |
| `GET` | `/api/coding-platform/tag/getall` | `TagsPage.tsx` — Table listing |
| `GET` | `/api/coding-platform/tag/get/:id` | `api.ts` — Defined but no standalone UI (used internally) |
| `PUT` | `/api/coding-platform/tag/update/:id` | `TagsPage.tsx` — Edit dialog |
| `DELETE` | `/api/coding-platform/tag/delete/:id` | `TagsPage.tsx` — Delete button |

### Modules (Full CRUD)
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `POST` | `/api/coding-platform/module/create` | `ModulesPage.tsx` — Create dialog |
| `GET` | `/api/coding-platform/module/getall` | `ModulesPage.tsx` — Table listing |
| `GET` | `/api/coding-platform/module/get/:id` | `api.ts` — Defined but no standalone UI (used internally) |
| `PUT` | `/api/coding-platform/module/update/:id` | `ModulesPage.tsx` — Edit dialog |
| `DELETE` | `/api/coding-platform/module/delete/:id` | `ModulesPage.tsx` — Delete button |

### Problems (Full CRUD + Toggle)
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `POST` | `/api/coding-platform/problem/create` | `ProblemsPage.tsx` — Create form |
| `GET` | `/api/coding-platform/problem/getall` | `ProblemsPage.tsx` — Table listing, `Dashboard.tsx` — Stats |
| `GET` | `/api/coding-platform/problem/get/:id` | `ProblemsPage.tsx` — Detail view / Edit |
| `PUT` | `/api/coding-platform/problem/update/:id` | `ProblemsPage.tsx` — Edit form |
| `DELETE` | `/api/coding-platform/problem/delete/:id` | `ProblemsPage.tsx` — Delete button |
| `PATCH` | `/api/coding-platform/problem/:id/toggle-active` | `ProblemsPage.tsx` — Toggle active |

### Test Cases
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `POST` | `/api/coding-platform/problem/:id/testcase` | `ProblemsPage.tsx` — Add test case |
| `PUT` | `/api/coding-platform/problem/testcase/:id` | `ProblemsPage.tsx` — Edit test case |
| `DELETE` | `/api/coding-platform/problem/testcase/:id` | `ProblemsPage.tsx` — Delete test case |

### Contests (Full CRUD + Management)
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `POST` | `/api/coding-platform/contest/create` | `ContestsPage.tsx` — Create form |
| `GET` | `/api/coding-platform/contest/getall` | `ContestsPage.tsx` — Table, `Dashboard.tsx` — Stats |
| `GET` | `/api/coding-platform/contest/get/:id` | `ContestDetailPage.tsx` — Detail view |
| `PUT` | `/api/coding-platform/contest/update/:id` | `ContestsPage.tsx` — Edit form |
| `DELETE` | `/api/coding-platform/contest/delete/:id` | `ContestsPage.tsx` — Delete (DRAFT only) |
| `POST` | `/api/coding-platform/contest/:id/add-problem` | `ContestDetailPage.tsx` — Add problem |
| `DELETE` | `/api/coding-platform/contest/:id/remove-problem/:pid` | `ContestDetailPage.tsx` — Remove problem |
| `PUT` | `/api/coding-platform/contest/:id/reorder-problems` | `ContestDetailPage.tsx` — Reorder |
| `PATCH` | `/api/coding-platform/contest/:id/publish` | `ContestsPage.tsx` — Publish button |
| `POST` | `/api/coding-platform/contest/update-statuses` | `ContestsPage.tsx` — Update statuses |

### Contest Leaderboard & Submissions
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `GET` | `/api/coding-platform/contest/:id/leaderboard` | `ContestDetailPage.tsx` — Leaderboard tab |
| `GET` | `/api/coding-platform/contest/:id/submissions` | `ContestDetailPage.tsx` — Submissions tab |

### Submissions
| Method | Endpoint | UI Location |
|--------|----------|-------------|
| `GET` | `/api/coding-platform/submissions` | `SubmissionsPage.tsx` — Table listing |
| `GET` | `/api/coding-platform/submissions/stats` | `SubmissionsPage.tsx` — Stats bar, `Dashboard.tsx` — Stats |
| `GET` | `/api/coding-platform/submissions/:id` | `SubmissionsPage.tsx` — Detail sheet |
| `DELETE` | `/api/coding-platform/submissions/:id` | `SubmissionsPage.tsx` — Delete button |

---

## ⚠️ Endpoints with No Dedicated UI

### Test Cases — Bulk Add
| Method | Endpoint | Status |
|--------|----------|--------|
| `POST` | `/api/coding-platform/problem/:id/testcases/bulk` | API function exists in `api.ts` (`bulkAddTestCases`) but **no UI to upload/bulk-create test cases** |

> **Recommendation:** Add a "Bulk Import Test Cases" feature (JSON/CSV upload or multi-row form) to `ProblemsPage.tsx` when viewing a problem's test cases. This would significantly speed up problem creation.

---

## 🔧 Enhancement Opportunities

### 1. Problem Detail Page (Standalone)
**Priority:** Medium
Currently, problem details open inline in `ProblemsPage.tsx` via a dialog/sheet. Consider a dedicated `/admin/problems/:id` detail page for:
- Full-screen code editor for starter/solution code
- Better test case management (drag-to-reorder, bulk operations)
- Problem preview as students would see it
- Submission statistics per-problem

### 2. Dashboard Enhancements
**Priority:** Low
- Add "Problems by Difficulty" breakdown chart
- Add "Most Failed Problems" list
- Add "Recent Contest Activity" timeline
- Add "Student Activity" heatmap

### 3. Student Management
**Priority:** High — **No endpoints currently exist for this**
The admin panel has no ability to:
- View registered students
- View a student's submission history
- Ban/unban students from contests
- Reset student passwords

> **Note:** These endpoints would need to be added to the backend first.

### 4. Contest Analytics
**Priority:** Medium
- Per-problem solve rate during a contest
- Submission timeline graph
- Score distribution histogram
- First-solve tracking

### 5. Export Enhancements
**Priority:** Low
- Bulk export all problems with test cases
- Contest results export (leaderboard + submissions)
- Student progress reports
