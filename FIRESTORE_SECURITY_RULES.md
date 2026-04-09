# Firestore Security Rules Guide

## Overview
These are the security rules needed for the TALK2KAP application to function properly with Firestore.

## How to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **talk2kap-8c526**
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the rules below
5. Click **Publish**

---

## Recommended Security Rules

### Option 1: Admin-Only Write Access (Most Secure)
Use this if ONLY admins should be able to create/edit/delete officials:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Officials collection - READ for all authenticated users, WRITE for admins only
    match /officials/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Employee collection
    match /employee/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Users collection
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Complaints collection
    match /Complaint/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Emergency hotlines - READ for all, WRITE for admins
    match /emergencyHotlines/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Default - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Option 2: Authenticated User Write Access
Use this if any authenticated user should be able to manage officials:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Officials collection - READ/WRITE for all authenticated users
    match /officials/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Employee collection
    match /employee/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Users collection
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Complaints collection
    match /Complaint/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Emergency hotlines - READ for all, WRITE for authenticated
    match /emergencyHotlines/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Default - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## What These Rules Do

### Option 1 (Recommended for Admin Apps)
- ✅ Authenticated users can **READ** officials
- ✅ Only users with `admin` custom claim can **CREATE/UPDATE/DELETE** officials
- ✅ More secure - prevents unauthorized modifications

### Option 2 (More Permissive)
- ✅ Any authenticated user can **READ/WRITE** officials
- ✅ Simpler permissions
- ⚠️ Less secure if you want to restrict who can modify officials

---

## How to Set Admin Custom Claims

If using **Option 1**, you need to set the `admin` custom claim for users:

### Method 1: Firebase Console
1. Go to **Authentication** → **Users** tab
2. Click on a user
3. Click **Custom claims** (JSON editor)
4. Add: `{"admin": true}`
5. Click **Save**

### Method 2: Backend Script (Node.js)
```javascript
// backend/index.js
const admin = require('firebase-admin');

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => console.log('Custom claims set for user:', uid))
  .catch(error => console.log('Error setting custom claims:', error));
```

---

## Troubleshooting

### Still Getting "Permission Denied" Error?

1. **Verify user is logged in**: Check browser console to confirm `auth.currentUser` exists
2. **Check custom claims (Option 1)**: 
   - User may need to log out and back in for custom claims to take effect
   - Check Firebase console that the claim was actually set
3. **Verify rules are published**: Make sure you clicked **Publish** after updating rules
4. **Wait a few seconds**: Rules can take up to 60 seconds to propagate

### How to Debug

```javascript
// Add this to Officialtable.jsx temporarily to check auth state
import { getAuth } from 'firebase/auth';

const auth = getAuth();
console.log('Current user:', auth.currentUser);
console.log('Custom claims:', auth.currentUser?.idTokenResult?.claims);
```

---

## Collection Structure Reference

```
officials/
├── [officialId]/
│   ├── name: String
│   ├── position: String
│   └── feedback/ (subcollection)
│       └── [feedbackId]/
│           ├── rating: Number
│           ├── comment: String
│           └── timestamp: Timestamp

employee/
├── [employeeId]/
│   ├── name: String
│   ├── position: String
│   └── idstatus: String ("approved", "pending", null)

users/
├── [userId]/
│   ├── name: String
│   ├── email: String
│   └── ...

Complaint/
├── [complaintId]/
│   ├── title: String
│   ├── details: String
│   └── ...

emergencyHotlines/
├── [hotlineId]/
│   ├── name: String
│   ├── number: String
│   └── category: String
```
