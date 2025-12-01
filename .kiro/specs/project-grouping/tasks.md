# Implementation Plan

- [ ] 1. Extend database schema and API
  - Add new `projects` object store to IndexedDB with indexes
  - Add `projectId` field to existing `reports` object store with index
  - Implement project CRUD functions (addProject, getProjects, updateProject, deleteProject, getProjectByName)
  - Implement report-project association functions (getReportsByProject, updateReportProject, getProjectStats)
  - Handle database migration to preserve existing reports
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 3.1, 3.3, 4.1, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4_

- [ ]* 1.1 Write property test for project creation
  - **Property 1: Project creation stores with unique ID**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for auto-creation
  - **Property 2: Auto-creation on audit submission**
  - **Validates: Requirements 1.2**

- [ ]* 1.3 Write property test for project list sorting
  - **Property 3: Project list sorted by creation date**
  - **Validates: Requirements 1.3**

- [ ]* 1.4 Write property test for creation timestamps
  - **Property 4: Projects have creation timestamps**
  - **Validates: Requirements 1.4**

- [ ]* 1.5 Write property test for name length validation
  - **Property 5: Project name length validation**
  - **Validates: Requirements 1.5**

- [ ]* 1.6 Write property test for default assignment
  - **Property 6: Default audit assignment is unassigned**
  - **Validates: Requirements 2.1**

- [ ]* 1.7 Write property test for project assignment
  - **Property 7: Project assignment updates report**
  - **Validates: Requirements 2.2**

- [ ]* 1.8 Write property test for project filtering
  - **Property 8: Project filter returns only matching reports**
  - **Validates: Requirements 2.3**

- [ ]* 1.9 Write property test for default view
  - **Property 9: Default view shows only unassigned**
  - **Validates: Requirements 2.4**

- [ ]* 1.10 Write property test for single association invariant
  - **Property 10: Single project association invariant**
  - **Validates: Requirements 2.5**

- [ ]* 1.11 Write property test for move operation
  - **Property 11: Move operation updates project reference**
  - **Validates: Requirements 3.1**

- [ ]* 1.12 Write property test for unassign operation
  - **Property 12: Unassign operation sets null**
  - **Validates: Requirements 3.3**

- [ ]* 1.13 Write property test for batch move
  - **Property 13: Batch move updates all reports**
  - **Validates: Requirements 3.4**

- [ ]* 1.14 Write property test for rename operation
  - **Property 14: Rename updates project name**
  - **Validates: Requirements 4.1**

- [ ]* 1.15 Write property test for empty name rejection
  - **Property 15: Empty name rename rejected**
  - **Validates: Requirements 4.2**

- [ ]* 1.16 Write property test for rename preserving associations
  - **Property 16: Rename preserves associations**
  - **Validates: Requirements 4.3**

- [ ]* 1.17 Write property test for rename timestamp update
  - **Property 17: Rename updates timestamp**
  - **Validates: Requirements 4.4**

- [ ]* 1.18 Write property test for project deletion
  - **Property 18: Delete removes project**
  - **Validates: Requirements 5.1**

- [ ]* 1.19 Write property test for delete unassigning reports
  - **Property 19: Delete unassigns reports**
  - **Validates: Requirements 5.2**

- [ ]* 1.20 Write property test for delete preserving report data
  - **Property 20: Delete preserves report data**
  - **Validates: Requirements 5.3**

- [ ]* 1.21 Write property test for flat view
  - **Property 21: Flat view returns all reports chronologically**
  - **Validates: Requirements 6.2**

- [ ]* 1.22 Write property test for project counts
  - **Property 22: Project list includes accurate counts**
  - **Validates: Requirements 6.3**

- [ ]* 1.23 Write property test for view mode persistence
  - **Property 23: View mode persists across sessions**
  - **Validates: Requirements 6.5**

- [ ]* 1.24 Write property test for project statistics
  - **Property 24: Project statistics accuracy**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ]* 1.25 Write property test for backward compatibility
  - **Property 25: Backward compatibility for unassigned reports**
  - **Validates: Requirements 8.1**

- [ ]* 1.26 Write property test for operation preservation
  - **Property 26: Operations preserve project associations**
  - **Validates: Requirements 8.4**

- [ ] 2. Checkpoint - Ensure database layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Create ProjectSelector component
  - Build type-ahead input component with autocomplete dropdown
  - Implement filtering logic to show matching projects as user types
  - Handle project selection and new project name entry
  - Style component to match existing PerfMon design
  - _Requirements: 1.2, 2.1_

- [ ]* 3.1 Write unit tests for ProjectSelector
  - Test rendering with empty project list
  - Test filtering projects as user types
  - Test selecting existing project
  - Test entering new project name

- [ ] 4. Create ViewToggle component
  - Build toggle control for switching between 'flat' and 'projects' modes
  - Implement state management for selected mode
  - Style component to match existing PerfMon design
  - _Requirements: 6.1_

- [ ]* 4.1 Write unit tests for ViewToggle
  - Test rendering both modes
  - Test mode switching
  - Test active state styling

- [ ] 5. Create ProjectList component
  - Build list view showing projects with report counts
  - Implement project selection handler
  - Add rename and delete actions for each project
  - Display project statistics (count, date range, avg score)
  - Handle empty state when no projects exist
  - Style component to match existing PerfMon design
  - _Requirements: 6.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 5.1 Write unit tests for ProjectList
  - Test rendering with empty project list
  - Test rendering with multiple projects
  - Test project selection
  - Test rename functionality
  - Test delete functionality
  - Test statistics display

- [ ] 6. Create ProjectBadge component
  - Build small badge component to display project name on reports
  - Implement click handler to navigate to project view
  - Style component to match existing PerfMon design
  - _Requirements: 8.3_

- [ ]* 6.1 Write unit tests for ProjectBadge
  - Test rendering with project name
  - Test click handler
  - Test styling

- [ ] 7. Integrate project features into App component
  - Add state variables for viewMode, selectedProjectId, projects, projectInput
  - Implement loadProjects function to fetch projects on mount
  - Add ProjectSelector to audit submission form
  - Add ViewToggle above history section
  - Conditionally render ProjectList or filtered report list based on viewMode
  - Add ProjectBadge to each report item showing its project
  - Implement view mode persistence using localStorage
  - _Requirements: 2.1, 6.1, 6.2, 6.5, 8.3_

- [ ] 7.1 Modify runAnalysis function to accept optional projectId
  - Update function signature to accept projectId parameter
  - Pass projectId when saving report to database
  - Handle auto-creation of project if name provided but doesn't exist
  - _Requirements: 1.2, 2.1, 2.2_

- [ ] 7.2 Modify loadHistory function to support project filtering
  - Add logic to filter by selectedProjectId when in project view
  - Maintain chronological sorting in flat view
  - _Requirements: 2.3, 2.4, 6.2_

- [ ] 7.3 Implement project management handlers
  - Create handleProjectSelect to switch to project view
  - Create handleViewModeChange to toggle between flat/project views
  - Create handleProjectRename to update project name
  - Create handleProjectDelete to remove project and unassign reports
  - Create handleReportMove to reassign report to different project
  - _Requirements: 3.1, 3.3, 3.4, 4.1, 5.1, 5.2, 6.2, 6.3_

- [ ]* 7.4 Write integration tests for project workflow
  - Test creating project through UI updates database
  - Test assigning report to project updates views
  - Test deleting project cascades to unassign reports
  - Test view mode toggle affects displayed reports
  - Test view mode persists across page reload

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add error handling and validation
  - Add try-catch blocks around all database operations
  - Implement validation for project names (empty, length)
  - Handle database connection failures gracefully
  - Display user-friendly error messages
  - Handle orphaned reports (references to deleted projects)
  - _Requirements: 1.5, 4.2, 5.3_

- [ ]* 9.1 Write unit tests for error handling
  - Test empty project name rejection
  - Test long project name handling
  - Test database error handling
  - Test orphaned report handling

- [ ] 10. Polish UI and accessibility
  - Ensure all interactive elements have proper ARIA labels
  - Test keyboard navigation for all project controls
  - Verify color contrast meets WCAG AA standards
  - Add loading states for async operations
  - Add empty states with helpful messages
  - Ensure focus management when switching views
  - _Requirements: All UI-related requirements_

- [ ]* 10.1 Write accessibility tests
  - Test keyboard navigation
  - Test screen reader compatibility
  - Test focus management

- [ ] 11. Final checkpoint - Complete testing and verification
  - Ensure all tests pass, ask the user if questions arise.
