# Updated Firestore Security Rules

Copy and paste the following rules into your Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 1. User Profiles + Subcollections
    match /users/{userId} {
      allow read, write: if true;

      match /userComplaints/{complaintId} {
        allow read, write: if true;

        match /chat/{messageId} {
          allow read, write: if true;
        }
      }
    }

    // 2. Employee Collection
    match /employee/{employeeId} {
      allow read, write: if true;

      // Deployment History
      match /deploymentHistory/{docId} {
        allow read, write: if true;
      }
    }

    // 3. Barangay Officials Collection (ADDED - was missing!)
    match /officials/{officialId} {
      allow read, write: if true;

      // Feedback subcollection
      match /feedback/{feedbackId} {
        allow read, write: if true;
      }
    }

    // 4. Feedback Collection
    match /complaintFeedback/{feedbackId} {
      allow read, write: if true;
    }

    // 5. Emergency Hotlines
    match /emergencyHotlines/{hotlineId} {
      allow read, write: if true;
    }
  }
}
```

## Steps to Apply:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `talk2kap-8c526`
3. Click **Firestore Database** → **Rules** tab
4. Replace ALL content with the rules above
5. Click **Publish**

## Key Change:
- Added `officials` collection with `allow read, write: if true;` 
- This fixes the "Missing or insufficient permissions" error
