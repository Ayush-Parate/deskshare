
# DeskShare Backend

DeskShare is a B.Tech CSE backend case-study project for a coworking-space booking platform.

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose ODM
- JWT authentication
- Firebase Admin SDK / Firebase Authentication
- Firebase Cloud Storage
- Multer
- Swagger / OpenAPI
- Postman

## Features

- User and owner registration/login
- JWT authentication
- Firebase ID-token verification support
- Owner-managed coworking spaces
- Search spaces by keyword
- Firebase image uploads
- Date/time booking
- Automatic booking conflict detection
- Booking cancellation
- Monthly memberships
- Swagger API documentation
- Postman collection
- MongoDB seed data

## Requirements

- Node.js 18+
- MongoDB local installation or MongoDB Atlas
- Firebase project (required for Firebase Auth/Storage features)
- Git installed for repository setup

## GitHub Repository Setup

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```

## Installation

```bash
git clone <your-github-repository-url>
cd deskshare-backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with MongoDB, JWT and Firebase credentials.

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/deskshare
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-your-id@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-firebase-project-id.appspot.com
```

## MongoDB

Local MongoDB:

```text
MONGO_URI=mongodb://127.0.0.1:27017/deskshare
```

MongoDB Atlas:

```text
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
```

## Firebase Setup

1. Create a project in Firebase Console.
2. Enable Firebase Authentication.
3. Enable Storage.
4. Create a Firebase Admin service account.
5. Put its project ID, client email and private key in `.env`.
6. Set `FIREBASE_STORAGE_BUCKET`.

Never commit the service-account JSON or private key.

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Seed demo data:

```bash
npm run seed
```

API:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api-docs
```

## Demo Credentials

After `npm run seed`:

```text
Owner:
Email: owner@deskshare.com
Password: Owner@123

User:
Email: user@deskshare.com
Password: User@123
```

## Example Flow

### 1. Search spaces

```http
GET /api/spaces/search?keyword=meeting-room
```

### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@deskshare.com",
  "password": "User@123"
}
```

Copy the returned JWT and use:

```http
Authorization: Bearer <token>
```

### 3. Book a space

```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "spaceId": "<SPACE_ID>",
  "startTime": "2026-10-05T10:00:00.000Z",
  "endTime": "2026-10-05T12:00:00.000Z",
  "notes": "Project meeting"
}
```

The API rejects overlapping confirmed bookings.

### 4. Purchase membership

```http
POST /api/memberships
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium"
}
```

## CRUD API Overview

This backend exposes REST endpoints for the main entities:

- Auth: register, login
- Spaces: create, list, fetch by id, update, delete, search
- Bookings: create, fetch by id, cancel
- Memberships: create, fetch user memberships

## API Documentation

Open:

`http://localhost:5000/api-docs`

Import:

`postman/DeskShare.postman_collection.json`

into Postman.

The project also includes Swagger annotations in the route files for OpenAPI documentation.

## API Response Format

Successful response:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Project Structure

```text
config/
controllers/
middleware/
models/
routes/
seed/
utils/
postman/
server.js
package.json
.env.example
README.md
```

## Deployment

The project is ready to deploy to Render or Heroku. A Render config file is included as `render.yaml`.

### Render

1. Push the project to GitHub.
2. In Render, click New > Web Service.
3. Connect your GitHub repository.
4. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Add environment variables:
   - PORT
   - MONGO_URI
   - JWT_SECRET
   - JWT_EXPIRES_IN
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
   - FIREBASE_STORAGE_BUCKET

The repository already includes a Render config file: `render.yaml`.

### Heroku

```bash
heroku create deskshare-backend
heroku config:set \
  PORT=5000 \
  MONGO_URI="mongodb+srv://..." \
  JWT_SECRET="your-secret" \
  JWT_EXPIRES_IN=7d \
  FIREBASE_PROJECT_ID="your-project-id" \
  FIREBASE_CLIENT_EMAIL="your-service-account-email" \
  FIREBASE_PRIVATE_KEY="your-private-key" \
  FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"

git push heroku main
```

## Academic Note

This project is designed as a backend-development case study. Payment processing, production-grade rate limiting, email notifications, audit logging and distributed locking are outside the basic scope and can be added as future enhancements.
