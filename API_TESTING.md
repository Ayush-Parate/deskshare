
# API Testing Sheet

| Test ID | API | Expected Result |
|---|---|---|
| T01 | POST /api/auth/register | 201 and JWT |
| T02 | POST /api/auth/login | 200 and JWT |
| T03 | GET /api/spaces | 200 and list |
| T04 | GET /api/spaces/search?keyword=meeting-room | 200 and matching spaces |
| T05 | POST /api/spaces | 201 for owner |
| T06 | POST /api/bookings | 201 for available time |
| T07 | POST /api/bookings with overlapping time | 409 conflict |
| T08 | GET /api/bookings/:id | 200 for owner/user |
| T09 | DELETE /api/bookings/:id | 200 and status cancelled |
| T10 | POST /api/memberships | 201 |
| T11 | GET /api/memberships/user/:id | 200 |
| T12 | Unauthorized protected endpoint | 401 |
| T13 | Owner-only endpoint as normal user | 403 |
| T14 | Invalid request body | 400 |
