// backend/index.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// ── Firebase Admin init ────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// ── POST /api/create-employee ──────────────────────────────────────────────
// Creates a Firebase Auth account + Firestore employee document.
// Body: { email, password, firstName, lastName, middleName, position }
app.post("/api/create-employee", async (req, res) => {
  const { email, password, firstName, lastName, middleName, position, number, purok, address, suffix } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "email, password, firstName, and lastName are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    // 1. Create Firebase Auth account
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    const uid = userRecord.uid;
    const phoneNum = (number || "").trim();
    const uniqueKey = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${phoneNum}`;

    // 2. Create Firestore employee doc with ALL fields matching existing structure
    await db.collection("employee").doc(uid).set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: (middleName || "").trim(),
      suffix: suffix ? suffix.trim() : null,
      email,
      number: phoneNum,
      address: (address || "").trim() || null,
      purok: (purok || "").trim() || null,
      age: 0,
      birthday: null,
      idImage: null,
      position: position || "BARANGAY UTILITY",
      isEmployee: true,
      residencyStatus: "resident",
      deploymentStatus: "available",
      deployedTo: null,
      uniqueKey,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ uid, message: "Employee created successfully." });
  } catch (err) {
    console.error("Error creating employee:", err);

    if (err.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    if (err.code === "auth/invalid-email") {
      return res.status(400).json({ error: "Invalid email address." });
    }

    return res.status(500).json({ error: err.message || "Internal server error." });
  }
});

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
