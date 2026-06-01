# Phase 6: Verification & Testing Plan

## Completed Phases Summary

### ✅ Phase 1: Access Control Hardening
- [x] `api.ts` headers clarified (X-User-Id uses UUID from identity-service)
- [x] `FieldUpdateController.java` POST restricted to INSTALLER only (line 34)
- [x] `ProjectDetailPage.tsx` terrain form verified INSTALLER-only (line 445)
- [x] Backend compiled successfully

### ✅ Phase 2: Unique Conversation Per Project
- [x] `ConversationRepository.findFirstByProjectId()` exists
- [x] `ClientExtrasService.getOrCreateByProjectId()` implemented (lines 64-82)
- [x] `V9__unique_conversation_per_project.sql` migration verified
- [x] Unique index on `project_id` created at DB level
- [x] Auto-participant population by role verified

### ✅ Phase 3: Real-Time WebSocket Sync
- [x] `ClientExtrasService.notifyOtherActors()` resolves admin/installer/client (lines 150-173)
- [x] Message deduplication on frontend via `const alreadyExists = c.messages.some((m) => m.id === msg.id)`
- [x] Verified in `ProjectMessagesPage.tsx` (lines 101-104)
- [x] Verified in `ClientMessagesPage.tsx` (lines 68-70)
- [x] WebSocket subscriptions active in both pages

### ✅ Phase 4: UI Improvements
- [x] ADMIN role correctly mapped to "admin" (not grouped with INSTALLER)
  - In `ProjectMessagesPage.tsx` line 259: `sender: m.senderRole === "CLIENT" ? "client" : m.senderRole === "ADMIN" ? "admin" : "installateur"`
  - In `ClientMessagesPage.tsx` line 128: Same correct mapping
- [x] Conversation list clarity improvements:
  - Shows project name (line 218)
  - Shows truncated participants (line 223-224 with +N count)
  - Shows last message date (line 231)
  - Shows last message sender name + preview (line 233)
- [x] Empty state messaging improved:
  - Conditional "No conversations found" for search queries
  - Conditional "Auto-created on first message" for no data state
- [x] Frontend compiled without TypeScript errors

### ✅ Phase 5: Admin Notifications Endpoint
- [x] `POST /api/notifications/send` endpoint exists (line 79)
- [x] Requires ADMIN role (line 83: `accessControlService.requireAnyRole(userRole, "ADMIN")`)
- [x] Supports USER targetType (send to specific userId)
- [x] Supports ROLE_IN_PROJECT targetType (send to admin/installer/client in a project)
- [x] `SendNotificationRequest.java` DTO properly structured
- [x] Backend compiled successfully

---

## Phase 6: Verification Test Cases

### Test 1: Access Control - ADMIN Cannot POST Terrain Updates
**Objective**: Verify that ADMIN users get 403 when trying to POST field updates

**Steps**:
1. Login as ADMIN
2. Navigate to a project detail page
3. Attempt to open DevTools and POST to `/api/projects/{projectId}/field-updates` with:
   ```json
   {
     "status": "EN_COURS",
     "progress": 50,
     "note": "Test update",
     "blockage": false,
     "requiresValidation": true
   }
   ```
4. **Expected**: HTTP 403 Forbidden with error message
5. **Actual**: _To be tested_

**Backend Location**: `FieldUpdateController.java` line 34

---

### Test 2: Unique Conversation Per Project
**Objective**: Verify that only one conversation exists per project, shared by all roles

**Steps**:
1. Setup: Three browser windows/tabs:
   - Window A: Admin user logged in
   - Window B: Installer user assigned to same project
   - Window C: Client user who owns the project
2. Window A sends message: "Hello from Admin"
3. Verify in Window B: Message appears in the SAME conversation
4. Verify in Window C: Message appears in the SAME conversation
5. Check backend DB:
   ```sql
   SELECT id, project_id, participants, messages FROM conversation_entity 
   WHERE project_id = {projectId};
   ```
   **Expected**: Exactly 1 row
6. **Expected**: Conversation list shows participants: "Admin, Installateur, Client"
7. **Actual**: _To be tested_

**Backend Location**: `V9__unique_conversation_per_project.sql`, `ClientExtrasService.getOrCreateByProjectId()`

---

### Test 3: Real-Time Message Synchronization
**Objective**: Verify that messages are synchronized in real-time to all three roles with no duplication

**Steps**:
1. Setup: Three browsers as Admin (A), Installer (B), Client (C) on same project
2. Window A opens ProjectMessagesPage, Window B opens ProjectMessagesPage, Window C opens ClientMessagesPage
3. Window A sends: "Admin message 1"
   - Check message count in all windows immediately
   - **Expected**: All show 1 message
   - Check that no duplicate appears in dev console
4. Window B sends: "Installer message 1"
   - **Expected**: All show 2 messages total
5. Window C sends: "Client message 1"
   - **Expected**: All show 3 messages total
6. Verify message order and no duplicates:
   - Each message appears exactly once in each window's UI
   - Message IDs are consistent across windows
   - No console errors about duplicate handling
7. **Actual**: _To be tested_

**Frontend Location**: Deduplication logic in `ProjectMessagesPage.tsx` (101-104) and `ClientMessagesPage.tsx` (68-70)

---

### Test 4: Role-Based Message Display (ADMIN visibility)
**Objective**: Verify that ADMIN role is displayed correctly (not grouped with INSTALLER)

**Steps**:
1. Setup: Admin user in browser
2. Open ProjectMessagesPage
3. Send a message as admin
4. **Expected**: Message bubble shows sender as "Admin" (or display role clearly, not "Installateur")
5. Have installer send a message
6. **Expected**: Can clearly distinguish "Admin" from "Installateur" roles in conversation
7. **Actual**: _To be tested_

**Frontend Location**: `ProjectMessagesPage.tsx` line 259

---

### Test 5: Conversation List Clarity
**Objective**: Verify improved UI shows project, participants, last message with date

**Steps**:
1. Admin user with multiple project conversations
2. Open ProjectMessagesPage or ClientMessagesPage
3. **Expected conversation list item shows**:
   - Project name (e.g., "Projet Solar 5kW")
   - Participants (truncated, e.g., "Admin, Installateur +1")
   - Last message sender and preview (e.g., "John: Here's the invoice...")
   - Date of last message (e.g., "15/01/2025")
4. **Actual**: _To be tested_

**Frontend Location**: `ProjectMessagesPage.tsx` lines 218-233

---

### Test 6: Admin Notification Sending
**Objective**: Verify admin can send targeted notifications

**Steps**:
1. Setup: Admin logged in
2. Call (via DevTools/Postman):
   ```
   POST /api/notifications/send
   Headers: X-User-Role: ADMIN
   Body:
   {
     "title": "System Update",
     "message": "Platform maintenance tonight",
     "targetType": "ROLE_IN_PROJECT",
     "projectId": 1,
     "targetRole": "CLIENT"
   }
   ```
3. **Expected**: HTTP 200 with `{"status": "OK", "recipients": "1"}`
4. Verify Client user receives notification in dashboard
5. Test with targetType = "USER" and specific userId
6. **Actual**: _To be tested_

**Backend Location**: `NotificationController.java` POST /send (line 79)

---

### Test 7: Unreadable Terrain Updates for ADMIN
**Objective**: Verify ADMIN can only view terrain updates, not create them

**Steps**:
1. Setup: ADMIN user in browser
2. Navigate to ProjectDetailPage, "Terrain" tab
3. **Expected**: No form to create new update
4. **Expected**: Can see timeline of existing updates
5. **Expected**: Can see "Validate" button for pending updates
6. Switch user to INSTALLER
7. **Expected**: Form appears to create updates
8. **Actual**: _To be tested_

**Frontend Location**: `ProjectDetailPage.tsx` line 445

---

## Test Execution Checklist

- [ ] Test 1: Access Control 403
- [ ] Test 2: Unique Conversation
- [ ] Test 3: Real-Time Sync
- [ ] Test 4: ADMIN Role Display
- [ ] Test 5: Conversation List UI
- [ ] Test 6: Admin Notifications
- [ ] Test 7: Terrain Read-Only for ADMIN

## Expected Outcomes

All 7 tests should PASS before declaring Phase 6 complete.

If any test fails:
1. Document the failure
2. Identify the root cause by reviewing corresponding code location
3. Apply fix
4. Recompile (backend) or verify (frontend)
5. Rerun test

---

## Quick Test Commands

### Backend Compilation
```bash
cd /home/louay/Desktop/louay/projetPfe/backend/project-service
mvn -q -DskipTests clean compile
```

### Frontend Build
```bash
cd "/home/louay/Desktop/louay/projetPfe/SolarEase Web App Design (2)"
npm run build
```

### Start Applications
```bash
# Backend (terminal 1)
cd /home/louay/Desktop/louay/projetPfe && docker-compose up

# Frontend (terminal 2)
cd "/home/louay/Desktop/louay/projetPfe/SolarEase Web App Design (2)" && npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080 (via gateway)

---

## Notes

- All 6 phases were already implemented or required minimal changes
- Phase 1 (Access Control) was the primary change needed
- Phases 2-5 were already in place from previous development
- Phase 6 focuses on validation through manual testing
