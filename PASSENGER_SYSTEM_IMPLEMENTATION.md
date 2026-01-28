# Passenger Management System Implementation

## Summary

Successfully implemented a comprehensive passenger management system for the Heliport booking application. The system replaces the simple passenger count field with detailed passenger information including name, identification type, identification number, and optional ID photo (stored as base64).

## Key Features

### 1. Database Schema Changes
- **New `passengers` table** with the following fields:
  - `id` (UUID primary key)
  - `bookingId` (foreign key to bookings table with cascade delete)
  - `name` (required, max 255 chars)
  - `identificationType` (enum: "cedula", "passport", "other")
  - `identificationNumber` (required, max 255 chars)
  - `idPhotoBase64` (optional, max 10MB per file)
  - `createdAt` and `updatedAt` timestamps

- **Removed** the old `passengers` count field from the bookings table

### 2. Backend Implementation
- **New tRPC router** (`src/server/api/routers/passengers.ts`) with full CRUD operations:
  - `create`: Create a single passenger
  - `update`: Update passenger information
  - `delete`: Delete a passenger
  - `getByBookingId`: Fetch all passengers for a booking
  - `batchCreate`: Create multiple passengers at once
  - `deleteByBookingId`: Delete all passengers for a booking

- **Updated bookings router** (`src/server/api/routers/bookings.ts`):
  - `create` mutation now accepts and stores an array of passengers
  - `update` mutation now handles passenger CRUD operations (create new, update existing, delete removed)
  - Photo size validation (10MB limit) implemented on the backend

### 3. Frontend Components

#### Passenger Management Component (`src/components/bookings/passenger-management.tsx`)
- Inline expandable UI for managing passengers within the booking form
- Add/remove passengers dynamically (minimum 1 passenger required)
- Fields for each passenger:
  - Full name
  - Identification type (dropdown)
  - Identification number
  - Optional ID photo upload with preview and remove functionality
- Real-time client-side validation
- File size validation (10MB limit) with user-friendly error messages
- Supports both image files and PDFs
- Photo preview with remove button

#### Passenger List Component (`src/components/bookings/passenger-list.tsx`)
- Display component for viewing passenger details in booking views
- Shows detailed information for each passenger
- Photo display with Next.js Image optimization
- Only visible to booking owner and administrators
- Graceful handling when no passengers are added

### 4. Updated Booking Form (`src/components/bookings/booking-form.tsx`)
- Integrated PassengerManagement component inline
- Removed old passenger count input field
- Validates at least one passenger before submission
- Passes passenger data array to booking mutations
- Supports pre-filling passenger data when editing bookings

### 5. Updated Booking Details (`src/components/bookings/booking-details.tsx`)
- Replaced passenger count display with PassengerList component
- Shows detailed passenger information to authorized users only
- Removed old passenger count field display

### 6. Admin Views (`src/app/(dashboard)/admin/bookings/page.tsx`)
- Updated booking details modal to display PassengerList component
- Removed passenger count column from the bookings table
- Updated CSV export to remove passenger count field (passenger details are too complex for flat CSV format)
- Admin can view all passenger details including photos

### 7. Page Updates
- **Calendar page** (`src/app/(dashboard)/bookings/calendar/page.tsx`):
  - Updated to pass passengers array to create/update mutations
  - Supports fetching and editing passenger data

- **My Bookings page** (`src/app/(dashboard)/bookings/my-bookings/page.tsx`):
  - Updated to pass passengers array to create/update mutations
  - Users can view their booking's passenger details

### 8. Internationalization
Updated both English and Spanish translations with new passenger-related keys:
- `passengers.title`, `passengers.description`
- `passengers.name`, `passengers.namePlaceholder`
- `passengers.identificationType`, `passengers.cedula`, `passengers.passport`, `passengers.other`
- `passengers.identificationNumber`, `passengers.identificationPlaceholder`
- `passengers.idPhoto`, `passengers.uploadPhoto`, `passengers.photoFormat`
- `passengers.addPassenger`, `passengers.added`
- `passengers.photoSizeError`, `passengers.photoTypeError`
- `passengers.noPassengers`
- Validation messages for passenger requirements

## Technical Details

### Data Flow
1. **Creating a booking:**
   - User fills out booking form including passenger management section
   - Form validates at least one passenger is present
   - On submit, booking data and passengers array are sent to `bookings.create` mutation
   - Backend creates the booking record
   - Backend inserts passenger records linked to the booking
   - Success confirmation displayed

2. **Updating a booking:**
   - Existing passengers are fetched via `passengers.getByBookingId` query
   - PassengerManagement component is pre-filled with existing data
   - User can add, edit, or remove passengers
   - On submit, updated passengers array is sent to `bookings.update` mutation
   - Backend determines which passengers to create, update, or delete
   - Changes are applied atomically

3. **Viewing passenger details:**
   - PassengerList component fetches passengers via `passengers.getByBookingId` query
   - Only executes if user is booking owner or administrator
   - Displays detailed information including photos

### Security & Authorization
- Passenger details are only accessible to:
  - The booking owner (user who created the booking)
  - Administrators
- Backend authorization checks in all passenger mutations
- tRPC procedures verify ownership or admin status before allowing operations

### File Storage
- ID photos stored as base64 strings directly in the database
- Maximum file size: 10MB per photo
- Supported formats: Images (JPG, PNG, etc.) and PDFs
- Size validation on both frontend and backend
- Base64 encoding allows easy transfer via tRPC without separate file upload infrastructure

## Database Migration

Applied via `npm run db:push` which synced the schema changes:
- Created `passengers` table
- Removed `passengers` column from `bookings` table

## Build Status
✅ **All TypeScript compilation successful**
✅ **All components rendering correctly**
✅ **Zero linter errors**

## Testing Recommendations
1. Create a new booking with one passenger
2. Create a new booking with multiple passengers
3. Upload ID photos for some passengers
4. Edit an existing booking and modify passenger list
5. View booking details as the booking owner
6. View booking details as an administrator
7. Attempt to view booking details as a different non-admin user (should not see passenger details)
8. Test file size validation (try uploading files > 10MB)
9. Test CSV export from admin panel

## Files Modified
- `src/server/db/schema.ts` - Updated schema
- `src/server/api/root.ts` - Added passengers router
- `src/server/api/routers/bookings.ts` - Updated for passengers array
- `src/server/api/routers/passengers.ts` - New router (created)
- `src/components/bookings/booking-form.tsx` - Integrated passenger management
- `src/components/bookings/booking-details.tsx` - Display passenger list
- `src/components/bookings/passenger-management.tsx` - New component (created)
- `src/components/bookings/passenger-list.tsx` - New component (created)
- `src/app/(dashboard)/bookings/calendar/page.tsx` - Updated mutation calls
- `src/app/(dashboard)/bookings/my-bookings/page.tsx` - Updated mutation calls
- `src/app/(dashboard)/admin/bookings/page.tsx` - Updated admin views and CSV export
- `src/lib/translations/en.json` - Added passenger translations
- `src/lib/translations/es.json` - Added passenger translations

## Notes
- The old `passengers` count field has been completely removed from the database and all UI components
- Passenger information is stored in a normalized relational structure for better data integrity
- Base64 photo storage is acceptable for the current scale; if storage becomes an issue in the future, consider moving to object storage (S3, etc.)
- The passenger management UI is inline within the booking form for a seamless UX
- All existing bookings without passenger records will still function correctly (queries handle empty passenger lists gracefully)

## Future Enhancements (Optional)
1. Add passenger templates for frequent flyers
2. Implement passenger import/export functionality
3. Add OCR to auto-fill passenger info from ID photos
4. Add validation for identification number formats based on type
5. Consider object storage for photos if database size becomes a concern
6. Add passenger search functionality in admin panel
