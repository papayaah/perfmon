# Design Document: Project Grouping

## Overview

This design extends the existing PerfMon application to support optional project-based organization of Lighthouse audit results. The feature integrates seamlessly into the current workflow, allowing users to continue using a flat chronological list or optionally group results into named projects. The design prioritizes speed and simplicity - users can run audits immediately without interruption, and project assignment is entirely optional.

## Architecture

The project grouping feature follows PerfMon's existing architecture patterns:

- **Data Layer**: Extends IndexedDB schema to include projects and project associations
- **UI Layer**: Enhances existing Preact components with project controls
- **State Management**: Uses Preact hooks for local state management
- **Storage**: All data persists client-side in IndexedDB (no backend changes)

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                      PerfMon Application                     │
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │   UI Layer     │◄────────┤  State (Hooks)   │           │
│  │  (Preact JSX)  │         └──────────────────┘           │
│  └────────┬───────┘                                         │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │  Database API  │◄────────┤   IndexedDB      │           │
│  │   (db.js)      │         │  - reports       │           │
│  │                │         │  - projects      │           │
│  └────────────────┘         └──────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema Extensions

**New Object Store: `projects`**
```javascript
{
  id: number,           // Auto-increment primary key
  name: string,         // Project name (max 100 chars)
  createdAt: timestamp, // Creation timestamp
  updatedAt: timestamp  // Last modification timestamp
}

// Indexes:
// - name (unique)
// - createdAt
```

**Modified Object Store: `reports`**
```javascript
{
  id: number,
  url: string,
  deviceType: string,
  timestamp: timestamp,
  scores: object,
  audits: object,
  thumbnail: string,
  projectId: number | null  // NEW: Reference to project, null if unassigned
}

// New Index:
// - projectId
```

### 2. Database API Extensions (db.js)

```javascript
// Project CRUD operations
export const addProject = async (name: string) => Promise<number>
export const getProjects = async () => Promise<Project[]>
export const updateProject = async (id: number, updates: Partial<Project>) => Promise<void>
export const deleteProject = async (id: number) => Promise<void>
export const getProjectByName = async (name: string) => Promise<Project | undefined>

// Report-Project operations
export const getReportsByProject = async (projectId: number | null) => Promise<Report[]>
export const updateReportProject = async (reportId: number, projectId: number | null) => Promise<void>
export const getProjectStats = async (projectId: number) => Promise<ProjectStats>

// Types
interface Project {
  id: number
  name: string
  createdAt: number
  updatedAt: number
}

interface ProjectStats {
  totalReports: number
  uniqueUrls: number
  averagePerformance: number
  dateRange: { earliest: number, latest: number } | null
}
```

### 3. UI Components

#### ProjectSelector Component
A type-ahead input field for selecting or creating projects during audit submission.

```javascript
<ProjectSelector
  value={string}
  onChange={(projectName: string) => void}
  projects={Project[]}
/>
```

Features:
- Autocomplete dropdown showing matching projects
- Creates new project automatically on submission if name doesn't exist
- Optional - can be left empty
- Filters projects as user types

#### ViewToggle Component
Toggle between flat list view and project list view.

```javascript
<ViewToggle
  mode={'flat' | 'projects'}
  onChange={(mode: 'flat' | 'projects') => void}
/>
```

#### ProjectList Component
Displays projects as clickable buttons/links with result counts.

```javascript
<ProjectList
  projects={ProjectWithCount[]}
  selectedProjectId={number | null}
  onSelectProject={(projectId: number | null) => void}
  onRenameProject={(projectId: number, newName: string) => void}
  onDeleteProject={(projectId: number) => void}
/>

interface ProjectWithCount extends Project {
  reportCount: number
}
```

#### ProjectBadge Component
Small badge showing project name on report items.

```javascript
<ProjectBadge
  projectName={string}
  onClick={() => void}  // Navigate to project view
/>
```

### 4. Modified App Component

The main App component will be enhanced with:

1. **New State Variables**:
   - `viewMode`: 'flat' | 'projects'
   - `selectedProjectId`: number | null
   - `projects`: Project[]
   - `projectInput`: string (for the project selector)

2. **New Functions**:
   - `loadProjects()`: Load all projects from DB
   - `handleProjectSelect(projectId)`: Filter reports by project
   - `handleViewModeChange(mode)`: Switch between flat/project views
   - `handleProjectCreate(name)`: Create new project
   - `handleProjectRename(id, name)`: Rename project
   - `handleProjectDelete(id)`: Delete project and unassign reports

3. **Modified Functions**:
   - `runAnalysis()`: Accept optional projectId parameter
   - `loadHistory()`: Filter by selectedProjectId if in project view

## Data Models

### Project Model
```typescript
interface Project {
  id: number              // Auto-increment primary key
  name: string            // 1-100 characters, unique
  createdAt: number       // Unix timestamp
  updatedAt: number       // Unix timestamp
}
```

### Report Model (Extended)
```typescript
interface Report {
  id: number
  url: string
  deviceType: 'mobile' | 'desktop'
  timestamp: number
  scores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  audits: {
    performance: Audit[]
    accessibility: Audit[]
    bestPractices: Audit[]
    seo: Audit[]
  }
  thumbnail: string
  projectId: number | null  // NEW: null for unassigned
}
```

### View State Model
```typescript
interface ViewState {
  mode: 'flat' | 'projects'
  selectedProjectId: number | null
}
```

## UI Layout

### Main Interface with Project Features

```
┌─────────────────────────────────────────────────────────────┐
│  [Home] PerfMon                              [Theme Toggle]  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [URL Input Field]                          [Search]│    │
│  │ [Project: ____________] (optional, type-ahead)     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Desktop] [Mobile] [Both]                                  │
│  Quick: [5173] [4173] [3000] [8080] [▼]                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  View: [● Flat List] [ Projects]                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [📸] localhost:5173                    [98][92][100]│    │
│  │      Desktop • 2 mins ago                    [89]  │    │
│  │      Project: My App                    [↻] [🗑]  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ [📸] example.com                       [85][78][95] │    │
│  │      Mobile • 1 hour ago                     [92]  │    │
│  │      (No project)                       [↻] [🗑]  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Project List View

```
┌─────────────────────────────────────────────────────────────┐
│  View: [ Flat List] [● Projects]                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📁 My App (12 reports)                    [✏️] [🗑] │    │
│  │    Avg Performance: 94 • 5 URLs                     │    │
│  │    Nov 15 - Dec 1, 2025                             │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 📁 Client Website (8 reports)             [✏️] [🗑] │    │
│  │    Avg Performance: 87 • 3 URLs                     │    │
│  │    Nov 20 - Nov 30, 2025                            │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 📂 Unassigned (15 reports)                          │    │
│  │    Various URLs                                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Project Detail View (After Clicking a Project)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Projects                                          │
│                                                              │
│  📁 My App (12 reports)                                     │
│  Avg Performance: 94 • 5 URLs • Nov 15 - Dec 1             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [📸] localhost:5173                    [98][92][100]│    │
│  │      Desktop • 2 mins ago                    [89]  │    │
│  │                                         [↻] [🗑]  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ [📸] localhost:5173                    [96][90][100]│    │
│  │      Mobile • 1 hour ago                     [88]  │    │
│  │                                         [↻] [🗑]  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project creation stores with unique ID
*For any* valid project name (non-empty, ≤100 characters), when a project is created, querying IndexedDB should return a project with that name and a unique identifier.
**Validates: Requirements 1.1**

### Property 2: Auto-creation on audit submission
*For any* non-empty project name provided during audit submission, if a project with that name doesn't exist, the system should create it automatically.
**Validates: Requirements 1.2**

### Property 3: Project list sorted by creation date
*For any* set of projects, when retrieving the project list, the returned projects should be ordered by createdAt timestamp in descending order (newest first).
**Validates: Requirements 1.3**

### Property 4: Projects have creation timestamps
*For any* newly created project, the project record should contain a createdAt timestamp that is set to the time of creation.
**Validates: Requirements 1.4**

### Property 5: Project name length validation
*For any* string up to 100 characters, it should be accepted as a valid project name, and any string over 100 characters should be rejected or truncated.
**Validates: Requirements 1.5**

### Property 6: Default audit assignment is unassigned
*For any* audit run without a project specified, the resulting report should have projectId === null.
**Validates: Requirements 2.1**

### Property 7: Project assignment updates report
*For any* report and any project, when assigning the report to the project, the report's projectId should be updated to match the project's id.
**Validates: Requirements 2.2**

### Property 8: Project filter returns only matching reports
*For any* project and any set of reports, when filtering reports by that project, all returned reports should have projectId equal to the project's id.
**Validates: Requirements 2.3**

### Property 9: Default view shows only unassigned
*For any* set of reports containing both assigned and unassigned reports, when viewing the default flat list, only reports with projectId === null should be returned.
**Validates: Requirements 2.4**

### Property 10: Single project association invariant
*For any* report at any time, the report should have either null or exactly one projectId value (never multiple, never undefined).
**Validates: Requirements 2.5**

### Property 11: Move operation updates project reference
*For any* report with projectId A, when moved to project B, the report's projectId should equal B.
**Validates: Requirements 3.1**

### Property 12: Unassign operation sets null
*For any* report with a projectId, when unassigned, the report's projectId should be null.
**Validates: Requirements 3.3**

### Property 13: Batch move updates all reports
*For any* set of reports and any target project, when moving all reports to the target project, every report in the set should have projectId equal to the target project's id.
**Validates: Requirements 3.4**

### Property 14: Rename updates project name
*For any* project and any valid new name, when renaming the project, querying the project by id should return the new name.
**Validates: Requirements 4.1**

### Property 15: Empty name rename rejected
*For any* project and any empty or whitespace-only string, attempting to rename the project should be rejected and the original name preserved.
**Validates: Requirements 4.2**

### Property 16: Rename preserves associations
*For any* project with associated reports, when renaming the project, all reports that referenced the project before renaming should still reference the same projectId after renaming.
**Validates: Requirements 4.3**

### Property 17: Rename updates timestamp
*For any* project, when renamed, the project's updatedAt timestamp should be greater than its value before the rename.
**Validates: Requirements 4.4**

### Property 18: Delete removes project
*For any* project, when deleted, querying IndexedDB for that project id should return undefined/null.
**Validates: Requirements 5.1**

### Property 19: Delete unassigns reports
*For any* project with associated reports, when the project is deleted, all reports that had that projectId should now have projectId === null.
**Validates: Requirements 5.2**

### Property 20: Delete preserves report data
*For any* project with associated reports, when the project is deleted, all reports should still exist with their original data (url, scores, audits, etc.) intact, only projectId should change to null.
**Validates: Requirements 5.3**

### Property 21: Flat view returns all reports chronologically
*For any* set of reports with various projectIds and timestamps, when viewing flat list mode, all reports should be returned sorted by timestamp in descending order regardless of projectId.
**Validates: Requirements 6.2**

### Property 22: Project list includes accurate counts
*For any* set of projects, when retrieving the project list with counts, each project's reportCount should equal the actual number of reports with that projectId.
**Validates: Requirements 6.3**

### Property 23: View mode persists across sessions
*For any* view mode selection ('flat' or 'projects'), when the application restarts, the view mode should be restored to the previously selected value.
**Validates: Requirements 6.5**

### Property 24: Project statistics accuracy
*For any* project with N reports, the project statistics should accurately reflect:
- totalReports === N
- uniqueUrls === count of distinct URLs in those reports
- averagePerformance === mean of performance scores across those reports
- dateRange === {earliest: min(timestamps), latest: max(timestamps)}
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 25: Backward compatibility for unassigned reports
*For any* existing report without a projectId field (or with projectId === undefined), the system should treat it as unassigned (equivalent to projectId === null).
**Validates: Requirements 8.1**

### Property 26: Operations preserve project associations
*For any* set of reports, when performing search or sort operations, each report's projectId should remain unchanged after the operation.
**Validates: Requirements 8.4**

## Error Handling

### Database Errors
- **Connection Failures**: If IndexedDB fails to initialize, display error message and disable project features gracefully
- **Transaction Failures**: Wrap all database operations in try-catch blocks, rollback on failure
- **Constraint Violations**: Handle unique constraint violations (duplicate project names) with user-friendly error messages

### Validation Errors
- **Empty Project Names**: Reject with message "Project name cannot be empty"
- **Long Project Names**: Truncate to 100 characters or reject with message "Project name too long (max 100 characters)"
- **Invalid Project IDs**: Handle references to non-existent projects by treating as unassigned

### Data Integrity
- **Orphaned Reports**: If a report references a deleted project, treat as unassigned
- **Missing Fields**: Provide defaults (projectId: null) for reports without project fields
- **Type Mismatches**: Validate projectId is number or null, coerce if necessary

### UI Error States
- **Empty States**: Show helpful messages when projects or reports are empty
- **Loading States**: Display loading indicators during async operations
- **Network Errors**: Not applicable (client-side only), but handle IndexedDB quota errors

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Database Operations**:
- Creating a project with a specific name returns expected structure
- Deleting a non-existent project handles gracefully
- Updating a project with invalid data rejects appropriately

**UI Components**:
- ProjectSelector renders with empty project list
- ViewToggle switches between modes correctly
- ProjectList displays projects with correct counts

**Edge Cases**:
- Empty project name validation
- Project name at exactly 100 characters
- Deleting project with zero reports
- Moving report to non-existent project
- Empty project statistics (7.5)

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property testing library):

**Configuration**:
- Each property test should run a minimum of 100 iterations
- Use fast-check's built-in generators for strings, numbers, arrays
- Create custom generators for Project and Report types

**Test Tagging**:
Each property-based test must include a comment tag in this exact format:
```javascript
// **Feature: project-grouping, Property N: [property description]**
```

**Property Test Coverage**:
- Each correctness property listed above must be implemented as a single property-based test
- Tests should generate random valid inputs (project names, report data, timestamps)
- Tests should verify the property holds across all generated inputs
- Tests should use fast-check's `fc.assert` with appropriate generators

**Example Property Test Structure**:
```javascript
// **Feature: project-grouping, Property 1: Project creation stores with unique ID**
test('project creation stores with unique ID', () => {
  fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 100 }),
      async (projectName) => {
        const id = await addProject(projectName);
        const project = await getProjectById(id);
        expect(project).toBeDefined();
        expect(project.name).toBe(projectName);
        expect(project.id).toBe(id);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify component interactions:
- Creating project through UI updates database and refreshes list
- Assigning report to project updates both report and project views
- Deleting project cascades to unassign all reports
- View mode toggle persists to localStorage and affects displayed reports

### Test Organization

```
src/
  db.test.js              # Unit tests for database operations
  db.properties.test.js   # Property-based tests for database
  components/
    ProjectSelector.test.jsx
    ViewToggle.test.jsx
    ProjectList.test.jsx
  integration/
    project-workflow.test.js
```

## Implementation Notes

### Migration Strategy

Since this is an enhancement to an existing application:

1. **Database Migration**: Add new object store and indexes without breaking existing data
2. **Backward Compatibility**: Treat reports without projectId as unassigned (null)
3. **Gradual Rollout**: Project features are optional, users can continue using flat list
4. **No Data Loss**: Existing reports remain accessible and functional

### Performance Considerations

- **Indexing**: Create index on projectId for fast filtering
- **Caching**: Cache project list in component state, refresh only on changes
- **Lazy Loading**: Load project statistics only when viewing project details
- **Debouncing**: Debounce type-ahead search in ProjectSelector (300ms)

### Accessibility

- **Keyboard Navigation**: All project controls accessible via keyboard
- **Screen Readers**: Proper ARIA labels on all interactive elements
- **Focus Management**: Maintain focus when switching views
- **Color Contrast**: Ensure project badges meet WCAG AA standards

### Future Enhancements

- Project colors/icons for visual distinction
- Project descriptions/notes
- Export/import projects with reports
- Project templates for common setups
- Project sharing (if backend added)
