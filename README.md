# DeskShare API – Coworking Space Booking Backend

REST API built with **Node.js, Express, MongoDB (Mongoose)**, **JWT + Firebase Auth**, and **Firebase Storage** for space images.

## Features
- Register/login with email + password (JWT) or a Firebase ID token
- Roles: `user`, `owner`, `admin`. Owners list and edit spaces
- Spaces with weekly availability, capacity (seats) and hourly price
- Keyword search (`meeting-room`, city, amenities) plus optional date/time availability filter
- Bookings with opening-hours check, overlap/capacity check and automatic membership discount
- Membership plans (basic 10%, pro 20%, premium 30% off, 30 days)
- Image upload (max 5 images, 5 MB each) to Firebase Storage
- Validation (express-validator), central error handler, helmet, CORS

## Project structure
```
server.js
src/
  app.js            Express app + route mounting
  config/           db.js, firebase.js
  models/           User, Space, Booking, Membership
  controllers/      auth, space, booking, membership
  routes/           auth, spaces, bookings, memberships
  middleware/       auth (JWT), upload (multer + Firebase), validate, error
  utils/            asyncHandler, time
postman_collection.json
```

## Setup
1. Prerequisites: Node 18+, MongoDB (local or Atlas), a Firebase project.
2. `npm install`
3. `cp .env.example .env` and fill in values.
4. Firebase: Console → Project settings → Service accounts → *Generate new private key*. Save as `serviceAccountKey.json` in the project root (it is git-ignored). Enable **Storage** and set `FIREBASE_STORAGE_BUCKET`. Enable **Authentication** if you want Firebase login.
5. `npm run dev` (or `npm start`). API runs at `http://localhost:5001`.

Firebase is optional for trying the API: everything works except image upload and Firebase-token login, which return `503` until configured.

## API reference
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | – | `name, email, password, role(user\|owner)` |
| POST | /api/auth/login | – | `email, password` or `firebaseToken` |
| GET | /api/spaces | – | List (`city, type, minPrice, maxPrice, page, limit`) |
| GET | /api/spaces/search | – | `keyword`, `city`, optional `date, startTime, endTime` |
| GET | /api/spaces/:id | – | Space details |
| POST | /api/spaces | owner/admin | multipart form; images in field `images` |
| PUT | /api/spaces/:id | space owner/admin | Partial update, can append images |
| POST | /api/bookings | user | `space, date(YYYY-MM-DD), startTime(HH:mm), endTime, seats` |
| GET | /api/bookings/:id | booking owner / space owner / admin | |
| DELETE | /api/bookings/:id | booking owner / admin | Cancels (status → cancelled) |
| GET | /api/memberships/plans | – | Plan catalogue |
| POST | /api/memberships | user | `plan: basic\|pro\|premium` |
| GET | /api/memberships/user/:id | self / admin | Membership history |

`availability` format (send as JSON string in multipart): `[{"day":1,"open":"09:00","close":"20:00"}]` where `day` 0 = Sunday. Date/time input is interpreted in `TZ_OFFSET` (default `+05:30`).

## Example flow
1. `GET /api/spaces/search?keyword=meeting-room`
2. `POST /api/bookings` with a Bearer token
3. `POST /api/memberships` with `{ "plan": "pro" }` (later bookings get the 20% discount)

Import `postman_collection.json` into Postman. Register/Login scripts store the token automatically, and Create space / Create booking store `spaceId` / `bookingId`. Register the owner first to create a space, then register or log in as a user to book.

## Verify the API with Postman

1. Start the API and MongoDB. If the API is not using port 5001, update the `baseUrl` collection variable in Postman to match your configured port.
2. In Postman, select **Import** and import `postman_collection.json`. The collection contains requests for auth, spaces, bookings, and memberships. It stores the base URL, JWT token, and IDs as collection variables.
3. Send requests individually in the order below. Do not run the whole collection at once: owner-only and user-only requests need different JWTs, and the collection's saved `token` is replaced by each successful register/login request.
4. For each request, confirm the expected HTTP status and inspect the response body. For a repeat run, use **Login** for the existing owner/user accounts; registering the same email again returns `409`.

| Order | Request | Token / setup | Expected status |
|---|---|---|---|
| 1 | `POST /api/auth/register` (owner) | Use a new email; saves the owner token | `201 Created` |
| 2 | `POST /api/auth/login` | Use the owner email/password; saves the owner token | `200 OK` |
| 3 | `POST /api/spaces` | Owner token; saves `spaceId` | `201 Created` |
| 4 | `GET /api/spaces` | No token required | `200 OK` |
| 5 | `GET /api/spaces/search?keyword=meeting-room` | No token required | `200 OK` |
| 6 | `GET /api/spaces/{{spaceId}}` | No token required | `200 OK` |
| 7 | `PUT /api/spaces/{{spaceId}}` | Owner token | `200 OK` |
| 8 | `POST /api/auth/register` (user) | Use a different new email; saves user token and `userId` | `201 Created` |
| 9 | `POST /api/auth/login` | Use the user email/password; saves the user token | `200 OK` |
| 10 | `POST /api/bookings` | User token, existing `spaceId`, future date/time during the space's opening hours; saves `bookingId` | `201 Created` |
| 11 | `GET /api/bookings/{{bookingId}}` | User token | `200 OK` |
| 12 | `GET /api/memberships/plans` | No token required | `200 OK` |
| 13 | `POST /api/memberships` | User token; body example: `{"plan":"pro"}` | `201 Created` |
| 14 | `GET /api/memberships/user/{{userId}}` | Same user token | `200 OK` |
| 15 | `DELETE /api/bookings/{{bookingId}}` | Same user token; run after checking the booking | `200 OK` |

The sample booking date in the collection is only an example. Change it to a future date that matches the space's configured availability; the sample space is open Monday through Friday from 09:00 to 20:00. Keep the booking's start and end times within those hours. To test owner-only requests after registering/logging in as a user, send the owner **Login** request again first. To test user-only requests after that, log in as the user again.

To make each request self-checking, open its **Scripts → Post-response** tab and add an assertion for its expected status, for example:

```javascript
pm.test("Returns 201 Created", () => {
  pm.response.to.have.status(201);
});
```

Use the status shown in the table for each request (for example, assert `200` for list/get/update requests). Add separate negative tests when checking validation or permissions; those should expect the documented `4xx` response rather than success. Postman displays each assertion in the **Test Results** tab. Save the collection after adding scripts, then record the date, request, status, and pass/fail result in your API test report. Do not include real passwords, JWTs, or other secrets in a shared report.

## Deploy to Heroku (bonus)
```bash
heroku create deskshare-api
heroku config:set MONGO_URI="<atlas-uri>" JWT_SECRET="<secret>" FIREBASE_STORAGE_BUCKET="<bucket>"
heroku config:set FIREBASE_SERVICE_ACCOUNT_JSON="$(cat serviceAccountKey.json)"
git push heroku main
```
A `Procfile` is included. Use MongoDB Atlas (allow Heroku IPs) for the database.

## Known limitations / ideas
- Seat availability check is not transactional, so two simultaneous requests could oversell the last seat. Use a MongoDB transaction for production.
- Payments are not integrated; membership purchase is recorded directly.
- Add rate limiting and tests (Jest + Supertest) as next steps.
