# LEARNING V2 — Implementation Review

> **Reviewer**: Automated audit against spec, audit, execution plan, and strategic context  
> **Date**: 2026-04-09  
> **Scope**: ~28 files (6 modified + 22 new)  
> **Reference documents**: SPEC, AUDIT, EXECUTION_PLAN, STRATEGIC_CONTEXT

---

## 1. Executive Summary

The implementation delivers a coherent learning shell architecture that closely follows the spec's structural intent: nested routes, stepId-based URLs, separated contexts, serial markViewed queue, AppLayout adaptive mode, and zero `navigate(-1)`. The wiring is functional and the code is well-organized.

However, the review identifies **3 critical issues**, **5 high-severity issues**, and several medium/low findings that must be addressed before this ships to production. The most dangerous issues are: (1) feature flag defaulting to `true` without rollback safety, (2) XSS exposure via unsanitized `dangerouslySetInnerHTML`, and (3) a `getBackTarget` navigation gap that drops stepId context when returning from activities.

**Recommendation**: **APPROVE WITH RESERVATIONS** — require the 3 critical and 5 high items resolved before merge to main. Medium/low items can be tracked as follow-up.

---

## 2. Spec Compliance Matrix

| Spec Requirement | Status | Notes |
|---|---|---|
| AppLayout detects `/learn/` and hides Sidebar/Topbar | **PASS** | `AppLayout.tsx:18-21` uses `matchPath` correctly |
| Routes: `/learn/:courseId` with nested children | **PASS** | `routes/index.tsx:148-163` correctly nested |
| URL uses stepId (UUID), never stepIndex | **PASS** | All navigation functions use stepId |
| Activities inline: `/steps/:stepId/activities/:activityId` | **PASS** | Route + ActivityFlow correctly wired |
| Context separated: Data + Nav | **PASS** | `learning.context.tsx` cleanly split |
| markViewed: serial queue, no optimistic update | **PASS** | `learning.hooks.ts:113-209` fully implemented |
| Zero `navigate(-1)` | **PASS** | Verified across all 22 new files |
| Server decides next step | **PASS** | `next` from `CourseInteractiveDTO` drives all forward navigation |
| Entry points respect feature flag | **PARTIAL** | ContinueCard + CourseDetailPage check flag, but flag defaults to `true` (see Critical #1) |
| Legacy fallback when flag off | **PASS** | `LearningShell` redirects to `/courses/:courseId/interactive` |
| ActionBar declarative from child | **PASS** | `setActionBar` called in StepView, ActivityFlow, CourseOverview, CompletionCards |

---

## 3. Critical Issues

### C1. Feature flag defaults to `true` — no safe rollback path
**File**: `src/features/auth/auth.store.ts:27`  
**Severity**: CRITICAL  
**Impact**: All users enter the V2 flow immediately. If V2 has any regression, there is no way to disable it without a code deploy. The comment "Incident fix: new learning flow must be default entry path" suggests this was an intentional override, but it contradicts the execution plan's Phase 0 (Feature Flag) which explicitly calls for `default: false` with controlled rollout.

**Evidence**:
```ts
// Line 27 — should be `return false` for safe rollout
return true;
```

**Fix**: Revert to `return false`. Use `?learning_v2=true` URL parameter or localStorage override for testing. If the decision is to go all-in on V2, remove the flag entirely rather than leaving a dead toggle.

---

### C2. XSS via `dangerouslySetInnerHTML` without sanitization
**File**: `src/components/learning/StepContentRenderers.tsx:24`  
**Severity**: CRITICAL  
**Impact**: Any admin can inject arbitrary JavaScript via step content body. In a multi-tenant SaaS, this is a cross-tenant XSS vector.

**Evidence**:
```tsx
// Line 24 — TODO acknowledged but not mitigated
dangerouslySetInnerHTML={{ __html: body }}
```

**Fix**: Add DOMPurify sanitization immediately. Even a minimal `DOMPurify.sanitize(body)` call eliminates the risk. The TODO comment referencing "phase-6" is not acceptable for a production deploy.

---

### C3. `getBackTarget` drops stepId when returning from activity
**File**: `src/features/learning/learning.utils.ts:54-58`  
**Severity**: CRITICAL  
**Impact**: When user presses "Voltar para a aula" from an activity, the back target is `/learn/:courseId/lessons/:lessonId` — without a stepId. This triggers `LessonRedirect` which must re-resolve the step via API, causing a visible flash/reload and potentially navigating to a different step than the one the user was on.

**Evidence**:
```ts
// Line 54-58 — missing stepId in return path
if (pathname.includes('/activities/') && lessonId) {
  return {
    label: 'Voltar para a aula',
    path: `/t/${slug}/app/learn/${courseId}/lessons/${lessonId}`  // no /steps/:stepId
  };
}
```

**Fix**: Include `params.stepId` in the return path when available:
```ts
path: `/t/${slug}/app/learn/${courseId}/lessons/${lessonId}/steps/${params.stepId}`
```
The `LearningRouteParams` interface already includes `stepId` — it just isn't used.

---

## 4. High-Severity Issues

### H1. `useStepViewTracker` resets all state on courseId/lessonId change, including in-flight requests
**File**: `src/features/learning/learning.hooks.ts:123-135`  
**Severity**: HIGH  
**Impact**: If the user navigates between lessons quickly, the `useEffect` cleanup resets `queueRef`, `pendingSetRef`, `inFlightSetRef`, etc. Any markViewed call that was in-flight for the previous lesson is silently abandoned (the promise continues but its result is discarded). While the retry mechanism exists, the reset clears `attemptCountRef`, so the abandoned request loses its retry count.

**Fix**: Either (a) wait for in-flight requests to drain before resetting, or (b) track abandoned requests and re-queue them.

---

### H2. `CourseOverview` uses server `next` for lesson click but ignores unlock status
**File**: `src/components/learning/CourseOverview.tsx:116-132`  
**Severity**: HIGH  
**Impact**: The overview shows all lessons and allows clicking on any lesson. When the user clicks a lesson that matches `next`, it correctly navigates with the server-provided step/activity. But when clicking a lesson that does NOT match `next`, it calls `selectLesson(lesson.id)` without checking unlock status. This navigates to the lesson, which then may show an error or empty state because the lesson is locked.

**Fix**: Use `useLessonUnlock` for each lesson in the overview (similar to `LearningOutline`), or disable locked lessons.

---

### H3. Outline `useLessonUnlock` fires N+1 queries (one per lesson)
**File**: `src/components/learning/LearningOutline.tsx:205`  
**Severity**: HIGH  
**Impact**: For courses with many lessons, the outline fires one `useLessonUnlock` query per lesson row. This was identified as an anti-pattern in the AUDIT document (Issue #6) and the execution plan explicitly calls for a batch endpoint or inclusion in `CourseInteractiveDTO`.

**Evidence**: The original `CourseOutlineSidebar` had the same N+1 problem. The new implementation replicates it.

**Fix**: Either (a) add unlock status to `CourseInteractiveDTO.modules[].lessons[]` response, or (b) create a batch unlock endpoint. Failing that, at minimum gate the queries behind intersection observer so only visible lessons fetch.

---

### H4. `ActivityPlayerPage` legacy still uses `navigate(-1)` for SimTrading
**File**: `src/pages/student/ActivityPlayerPage.tsx:147`  
**Severity**: HIGH  
**Impact**: The legacy `ActivityPlayerPage` has a `SimTradingChallengeFlow` that calls `navigate(-1)` when the user completes a challenge. The spec explicitly forbids `navigate(-1)`. While this is the legacy page, it's still reachable via routes `/lessons/:lessonId/activities/:activityId` and `/activity/:activityId` and will remain so even after V2 launch.

**Fix**: Replace `navigate(-1)` with a deterministic target (e.g., dashboard or the originating lesson).

---

### H5. Route strings are hardcoded in 5+ files with no centralized helper
**Files**: `learning.context.tsx`, `learning.utils.ts`, `LearningShell.tsx`, `StepView.tsx`, `ActivityFlow.tsx`, etc.  
**Severity**: HIGH  
**Impact**: Route patterns like `/t/:slug/app/learn/:courseId/lessons/:lessonId/steps/:stepId` appear in at least 8 locations. Any route structure change requires finding and updating all occurrences. This is a maintenance hazard and a bug vector.

**Fix**: Extract a `learningRoutes` helper object with functions like `toStep(slug, courseId, lessonId, stepId)`, `toActivity(slug, courseId, lessonId, stepId, activityId)`, etc.

---

## 5. Medium-Severity Issues

### M1. `CompletionCards` has dual export (named + default)
**File**: `src/components/learning/CompletionCards.tsx:11,158`  
Both `export function CourseCompletionCard()` and `export default CourseCompletionCard` exist. The lazy import in `routes/index.tsx:60` uses `default`, so the named export is dead code. Minor but confusing.

### M2. `ActivityReviewBlock` casts `option` to access `isCorrect`
**File**: `src/components/learning/ActivityReviewBlock.tsx:144-146`  
```ts
const withCorrect = option as typeof option & { isCorrect?: boolean };
```
This type assertion hides a real type gap. The `option` type from the API doesn't include `isCorrect`, but the backend returns it when review is allowed. The type should be properly extended.

### M3. `resolveStorageUrl` duplicated between `StepContentRenderers.tsx` and `CourseDetailPage.tsx`
**Files**: `StepContentRenderers.tsx:210-221`, `CourseDetailPage.tsx:15-26`  
Identical logic for resolving storage URLs. Should be extracted to a shared util.

### M4. `useActivitySession.isRetrying` is set to `true` on reset but never used for display
**File**: `src/components/learning/activity-flow.hooks.ts:54-59`  
`resetSession` sets `isRetrying = true`, which is used in `ActivityFlow` line 121 to suppress showing stale results. This works, but the naming is confusing — "retrying" implies the submission is in-flight, not that the user clicked "redo".

### M5. `StepView` passes `next` to `resolveStepIdResult` without scoping to lesson
**File**: `src/components/learning/StepView.tsx:43-46`  
```ts
const resolution = useMemo(
  () => resolveStepIdResult(steps, stepIdFromUrl),
  [stepIdFromUrl, steps]
);
```
The `next` parameter is not passed. This means `resolveStepId` won't use the server's next hint for this lesson. However, `LessonRedirect` does pass it. This inconsistency means: direct URL with stepId works fine, but URL without stepId (going to LessonRedirect) uses the server hint, while URL with wrong stepId (going to StepView) falls back to first-pending without consulting the server.

### M6. No error boundary around `<Outlet />` in LearningShell
**File**: `src/components/learning/LearningShell.tsx:95-101`  
If any child route component throws during render, it will crash the entire shell. An error boundary would allow graceful recovery.

### M7. `ContinueLearningCard` computes `nextUrl` but uses context navigation functions instead
**File**: `src/components/learning/ContinueLearningCard.tsx:19,90-102`  
`nextUrl` is computed via `buildLearningNextUrl` on line 19 but never referenced. The actual navigation uses `selectStep`/`startActivity`/`selectLesson` from context. Dead computation.

### M8. LearningActionBar "Anterior" label is hardcoded in Portuguese
**File**: `src/components/learning/LearningActionBar.tsx:21`  
While most of the new learning code uses hardcoded Portuguese strings (acceptable as per codebase convention), the `nextLabel` has a fallback `'Próximo'` with an accent on line 34, while other components use `'Proximo'` without accent. Inconsistent.

---

## 6. Low-Severity Issues

### L1. `LearningPhase1Placeholder` is imported but only used as a guard
**File**: `src/components/learning/LearningPhase1Placeholder.tsx`  
This placeholder only renders in `LearningShell` when `tenantSlug` or `courseId` are missing — a situation that should never occur given the route structure. It's dead code in practice.

### L2. `ActivityEmptyState` and `ActivityErrorState` have no `data-testid` attributes
Makes automated testing harder.

### L3. `useCourseInteractive` has `staleTime: 5 min` but `invalidateLearningCache` is called after every markViewed
**Files**: `learning.hooks.ts:30`, `learning.hooks.ts:164-169`  
Every successful markViewed invalidates the course-interactive query. With `staleTime: 5min`, the invalidation triggers a refetch. For a student viewing 10 steps in sequence, this means 10 refetches of the full course data within minutes.

### L4. No loading state transition animation between steps
When navigating between steps via the ActionBar, the content changes instantly with no transition. The legacy `AppLayout` had `AnimatePresence` transitions but the learning shell's `<Outlet />` has no such wrapper.

### L5. `getBackTarget` uses `pathname.includes('/activities/')` which could false-positive
**File**: `src/features/learning/learning.utils.ts:54`  
If a course title or lesson title contains the word "activities", this check would incorrectly trigger. Using `matchPath` or checking the URL pattern more precisely would be safer.

---

## 7. Security Concerns

| Concern | Severity | Status |
|---|---|---|
| XSS via `dangerouslySetInnerHTML` | CRITICAL | **OPEN** — See C2 |
| Storage URL resolution uses `http://localhost` in dev | LOW | Acceptable for dev mode |
| No CSRF token on markViewed POST | LOW | Assuming auth cookie + SameSite policy |
| Tenant slug from URL params used directly in API calls | LOW | Backend must validate tenant membership |

---

## 8. Performance Considerations

1. **N+1 unlock queries in outline** (H3) — Will degrade with scale.
2. **markViewed invalidates full course data on every step** (L3) — Consider batching invalidation or debouncing.
3. **Lazy imports for all new components** — Good. All learning components are correctly lazy-loaded.
4. **`staleTime: 0` on activity and submission queries** — Correct for freshness, but could cause excessive refetches if the user revisits the same activity.
5. **`useMemo` usage** — Generally appropriate. No obvious unnecessary recomputations.

---

## 9. Architectural Alignment

### What was executed well:
- **Context split** (Data vs Nav) follows the spec precisely and enables independent re-renders.
- **Serial markViewed queue** is a clean implementation with proper retry limits.
- **Route structure** with nested children and `<Outlet />` is idiomatic React Router v6.
- **Adaptive AppLayout** detection is minimal and non-intrusive.
- **ActionBar as declarative slot** — child components register their config, parent renders. Clean separation.
- **SimTrading integration** — fullscreen mode + dedicated flow preserves the existing terminal without modification.
- **Legacy page guard** — `ActivityPlayerPage` now handles missing `lessonId` gracefully.

### What deviates from spec/plan:
- **Feature flag default** contradicts Phase 0 of execution plan.
- **No centralized route builder** was specified in the execution plan as a Phase 1 task.
- **Outline N+1** was explicitly called out in the audit as a mandatory fix.
- **DOMPurify** was listed as Phase 6 in the execution plan but the spec requires it for production.

---

## 10. Verdict

| Category | Count |
|---|---|
| Critical | 3 |
| High | 5 |
| Medium | 8 |
| Low | 5 |
| **Total** | **21** |

### Recommendation: **APPROVE WITH RESERVATIONS**

The implementation demonstrates strong architectural alignment with the spec. The codebase is well-structured, the component hierarchy is clean, and the core flows (step navigation, activity submission, sim trading integration) are functionally correct.

**Must-fix before merge (blockers)**:
1. C1 — Feature flag default to `false` (or remove the flag entirely)
2. C2 — Add DOMPurify sanitization to `TextStepContent`
3. C3 — Fix `getBackTarget` to preserve stepId
4. H4 — Replace `navigate(-1)` in legacy ActivityPlayerPage

**Should-fix before first production deploy**:
5. H1 — Handle in-flight markViewed on lesson change
6. H2 — Gate locked lessons in CourseOverview
7. H3 — Address N+1 unlock queries
8. H5 — Centralize route construction

**Can track as tech debt**:
- All Medium and Low items
- Route centralization (H5) can be a follow-up PR if the team prefers incremental progress
