# Phase 2.3 & 2.4 Execution Plan

> **Goal**: Complete Admin Dashboard Stats (Phase 2.3) and Branch Management List View (Phase 2.4)

---

## 📋 PHASE 2.3: Admin Dashboard Stats

### Overview
Replace mock data with real database statistics on the admin dashboard.

### Task Breakdown

#### **2.3.1-2.3.5: Backend - Create Stats API**

**File**: `backend/src/modules/analytics/analytics.controller.ts`
**Changes**:
- Add `GET /api/analytics/admin/stats` endpoint
- Add `@UseGuards(JwtAuthGuard, RolesGuard)`
- Add `@Roles(UserRole.ADMIN)` decorator
- Return aggregated stats

**File**: `backend/src/modules/analytics/analytics.service.ts`
**Changes**:
- Add `getAdminStats()` method
- Query counts using Prisma:
  - `totalBranches`: `prisma.branch.count({ where: { isActive: true } })`
  - `totalDoctors`: `prisma.doctor.count({ where: { isActive: true } })`
  - `totalPatients`: `prisma.patient.count()` (or via User with role PATIENT)
  - `totalAppointmentsToday`: Count appointments where appointmentDate is today

**File**: `backend/src/modules/analytics/dto/admin-stats.dto.ts` (NEW)
```typescript
export class AdminStatsDto {
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;
}
```

#### **2.3.6-2.3.7: Frontend - Connect to Real Data**

**File**: `frontend/src/lib/api/analytics.api.ts` (NEW or UPDATE)
**Changes**:
- Add `getAdminStats()` method
- Call `GET /api/analytics/admin/stats`

**File**: `frontend/src/app/(admin)/admin/dashboard/page.tsx`
**Changes**:
- Replace mock data fetch with real API call
- Import analytics API
- Update useEffect to call `analyticsApi.getAdminStats()`
- Remove simulated delay
- Keep loading states and error handling

#### **Files to Create/Modify**:

| File | Action | Lines |
|------|--------|-------|
| `backend/src/modules/analytics/analytics.controller.ts` | Modify | +20 |
| `backend/src/modules/analytics/analytics.service.ts` | Modify | +40 |
| `backend/src/modules/analytics/dto/admin-stats.dto.ts` | Create | 15 |
| `frontend/src/lib/api/analytics.api.ts` | Create/Modify | 10 |
| `frontend/src/app/(admin)/admin/dashboard/page.tsx` | Modify | 20 |

#### **Testing Checklist**:
- [ ] API returns correct branch count (5 seeded branches)
- [ ] API returns correct doctor count (10 seeded doctors)
- [ ] API returns correct patient count (3 seeded patients)
- [ ] API returns today's appointments count (varies)
- [ ] Frontend displays real data with loading states
- [ ] Stats update when database changes

---

## 📋 PHASE 2.4: Branch Management - List View

### Overview
Create a data table to display all branches with search, filter, and pagination.

### Task Breakdown

#### **2.4.1: Backend - Enhanced Branch List API**

**File**: `backend/src/modules/branches/branches.controller.ts`
**Changes**:
- Add query parameters to `GET /api/branches`:
  - `search` (string, optional) - search by name
  - `status` (string, optional) - 'active' | 'inactive' | 'all'
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 10)
- Return paginated response with metadata

**File**: `backend/src/modules/branches/dto/branch-query.dto.ts` (NEW)
```typescript
export class BranchQueryDto {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number = 1;
  limit?: number = 10;
}
```

**File**: `backend/src/modules/branches/branches.service.ts`
**Changes**:
- Modify `findAll()` to accept query parameters
- Add search filter (case-insensitive name search)
- Add status filter
- Add pagination (skip, take)
- Return format:
```typescript
{
  data: Branch[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### **2.4.2-2.4.6: Frontend - Branch List Page**

**File**: `frontend/src/components/ui/data-table.tsx` (NEW)
**Purpose**: Reusable data table component
**Features**:
- Column headers
- Sortable columns
- Row actions (edit, delete)
- Empty state
- Loading state

**File**: `frontend/src/app/(admin)/admin/branches/page.tsx`
**Complete Rewrite**:

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Branches                    [Add Branch]    │
│ Manage clinic locations                     │
├─────────────────────────────────────────────┤
│ [Search...]  [Status: All ▼]               │
├─────────────────────────────────────────────┤
│ Name      │ Address    │ Phone    │ Actions│
├─────────────────────────────────────────────┤
│ Downtown  │ 123 Main.. │ +95 1..  │ ✏️ 🗑️  │
│ Northside │ 456 Oak..  │ +95 1..  │ ✏️ 🗑️  │
│ ...       │ ...        │ ...      │ ...    │
├─────────────────────────────────────────────┤
│ Showing 1-5 of 5          [<] 1 [>]        │
└─────────────────────────────────────────────┘
```

**Features**:
1. **Search Bar**: Real-time search by branch name
2. **Status Filter**: Dropdown - All, Active, Inactive
3. **Data Table**: Columns - Name, Address, Phone, Manager, Status, Actions
4. **Pagination**: Show 10 items per page
5. **Actions**: Edit button (links to edit page), Delete button (opens modal)
6. **Loading State**: Skeleton rows while fetching
7. **Empty State**: "No branches found" message

**File**: `frontend/src/lib/api/branches.api.ts`
**Changes**:
- Update `getAll()` to accept query parameters
- Add query string building

**File**: `frontend/src/types/branch.types.ts` (NEW or UPDATE)
```typescript
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  isActive: boolean;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface BranchQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

export interface PaginatedBranches {
  data: Branch[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### **Files to Create/Modify**:

| File | Action | Lines |
|------|--------|-------|
| `backend/src/modules/branches/branches.controller.ts` | Modify | +30 |
| `backend/src/modules/branches/branches.service.ts` | Modify | +50 |
| `backend/src/modules/branches/dto/branch-query.dto.ts` | Create | 15 |
| `frontend/src/components/ui/data-table.tsx` | Create | 100 |
| `frontend/src/app/(admin)/admin/branches/page.tsx` | Rewrite | 150 |
| `frontend/src/lib/api/branches.api.ts` | Modify | +20 |
| `frontend/src/types/branch.types.ts` | Create | 30 |

#### **Testing Checklist**:
- [ ] View all 5 seeded branches in table
- [ ] Search filters branches by name
- [ ] Status filter shows only active/inactive/all
- [ ] Pagination works (if more than 10 branches)
- [ ] Table sorts by name
- [ ] Edit button links to edit page
- [ ] Delete button opens confirmation modal
- [ ] Loading state shows while fetching
- [ ] Empty state shows when no results

---

## 🎯 Execution Order

### Phase 2.3 (Recommended First - Quick Win)
1. ✅ Create backend DTO for stats
2. ✅ Implement `getAdminStats()` in AnalyticsService
3. ✅ Add endpoint in AnalyticsController
4. ✅ Create/update frontend API client
5. ✅ Update dashboard page to fetch real data
6. ✅ Test and verify stats match database

### Phase 2.4 (After 2.3)
1. ✅ Create backend DTO for branch queries
2. ✅ Enhance `findAll()` with search/filter/pagination
3. ✅ Update BranchesController with query params
4. ✅ Create reusable DataTable component
5. ✅ Create/update branch types
6. ✅ Update frontend API with query params
7. ✅ Rewrite branches page with full functionality
8. ✅ Test all features (search, filter, pagination)

---

## 📊 Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| 2.3 | 8 tasks | 1-2 hours |
| 2.4 | 8 tasks | 3-4 hours |
| **Total** | **16 tasks** | **4-6 hours** |

---

## 🔗 Dependencies

- Phase 2.3: No dependencies (standalone)
- Phase 2.4: Depends on Phase 2.5 (which is complete ✅)
- Can execute 2.3 and 2.4 in parallel if needed

---

## ✅ Success Criteria

### Phase 2.3 Complete When:
- [ ] Admin dashboard shows real stats from database
- [ ] Stats update automatically when data changes
- [ ] Loading states work properly
- [ ] API is admin-only protected

### Phase 2.4 Complete When:
- [ ] Branch list page displays all branches in table
- [ ] Search filters branches by name
- [ ] Status filter works (All/Active/Inactive)
- [ ] Pagination works correctly
- [ ] Edit/Delete actions are accessible
- [ ] UI is responsive and matches design system

---

Ready to execute Phase 2.3 first? It's a quick win and will make the dashboard functional immediately! 🚀
