# Changelog

All notable changes to the New EMR project will be documented in this file.

## [Unreleased]

## [Frontend Production Hardening] - 2025-11-30

### Added
- **Form Validations**:
  - Zod schema for login form (`/src/lib/validations/auth.ts`).
  - React Hook Form integration for Login page.
  - Refactored Consultation Wizard with step-by-step validation.
  - Field-level error messages and loading states.
- **API Error Handling**:
  - Enhanced global error interceptor with validation error support.
  - Improved Error Boundary component with better UI.
  - Application-wide error boundary integration.
- **WebSocket Real-time Features**:
  - Socket.io client configuration (`/src/lib/socket.ts`).
  - Socket hooks for connection and event management.
  - Real-time queue updates with connection status indicator.
  - Live/Offline badge on Queue Board.
- **Mobile Responsiveness**:
  - Optimized consultation wizard step indicators for mobile.
  - Responsive patient table with progressive column hiding.
  - Touch-friendly sizing and mobile-first design.
- **Performance Optimization**:
  - Server-side pagination for patient list (10 items/page).
  - Page navigation with Previous/Next controls.
  - Optimized React Query caching strategy.

### Changed
- Login page now uses React Hook Form with Zod validation.
- Consultation wizard refactored for better form state management.
- Patient table adapts layout based on screen size.
- Error messages now include validation errors from backend.

### Technical
- Centralized error handling patterns.
- Type-safe form validation with Zod + TypeScript.
- Modular Socket.io integration ready for backend.
- Scalable pagination pattern for all list views.


## [Phase 2] - 2025-11-29

### Added
- **Patient Management**:
  - Real data integration for patient list and search.
  - Patient registration form connected to backend.
  - Debounced search and gender filtering.
- **Patient Details**:
  - Real profile data fetching.
  - Vitals history display.
  - Consultation history listing.
- **Consultation Wizard**:
  - Real-time patient search.
  - Form submission connected to backend.
  - Data mapping for vitals, notes, and diagnosis.
- **Performance**:
  - `useDebounce` hook for optimized search.

## [Frontend Polish Phase 1] - 2025-11-29

### Added
- **Empty States**:
  - Reusable `EmptyState` component.
  - Applied to Consultations, Medications, Lab Results, and Documents tabs.
- **Form Validation**:
  - Zod schemas for Patient Registration and Consultations.
  - React Hook Form integration for Patient Registration.
- **Utilities**:
  - Date formatting utilities (`formatDate`, `calculateAge`, etc.).
  - Address formatting utilities (`formatAddress`, `parseAddress`).
- **Bug Fixes**:
  - Fixed address mapping issues.
  - Fixed date formatting inconsistencies.
  - Data transformation for backend compatibility (e.g., allergies string to array).

## [Phase 1 Integration] - 2025-11-28

### Added
- **Authentication**:
  - JWT Bearer token support.
  - Automatic token refresh.
  - Login page with validation and error handling.
- **API Hooks**:
  - Comprehensive React Query hooks for Auth, Patients, Consultations, Queue, and Dashboard.
- **Dashboard**:
  - Real-time stats integration.
  - Today's appointments and recent patients lists.
- **Queue Management**:
  - Real-time queue board with polling.
  - Call next patient and status update functionality.
- **Global Config**:
  - Toast notifications (`react-hot-toast`).
  - QueryProvider and ThemeProvider setup.
