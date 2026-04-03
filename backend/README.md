# Backend — Talk2Kap

Express server that uses the **Firebase Admin SDK** to create authenticated employee accounts from the admin dashboard.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Firebase service account key (`serviceAccountKey.json`) in this folder

> Get the key from: **Firebase Console → Project Settings → Service Accounts → Generate New Private Key**

---

## Setup

```bash
cd backend
npm install
```

---

## Run

```bash
npm start
```

Server starts on **http://localhost:5000**.

---

## API

### `POST /api/create-employee`

Creates a Firebase Auth account and a Firestore `employee/{uid}` document.

**Request body** (JSON):

| Field        | Type   | Required | Notes                    |
|-------------|--------|----------|--------------------------|
| email       | string | Yes      | Must be a valid email    |
| password    | string | Yes      | Min 6 characters         |
| firstName   | string | Yes      |                          |
| lastName    | string | Yes      |                          |
| middleName  | string | No       |                          |
| position    | string | No       | Defaults to "BARANGAY UTILITY" |

**Success** (`201`):
```json
{ "uid": "abc123...", "message": "Employee created successfully." }
```

**Errors**:
- `400` — Missing fields or invalid email
- `409` — Email already exists
- `500` — Server error

---

## Notes

- `serviceAccountKey.json` is in `.gitignore` — never commit it.
- The admin dashboard calls this API automatically when adding employees.
- Created employees can immediately log in to the mobile app.
