# Firebase Environment Variables Reference

Quick reference for configuring Firebase credentials after following the setup guide.

## Backend Environment Variables

Edit `/home/user/EchoPlay/backend/.env`:

### Firebase Admin SDK (from Service Account JSON)

When you download the service account JSON file from Firebase Console, extract these values:

```bash
# From serviceAccount.json → project_id
FIREBASE_PROJECT_ID="echoplay-dev"

# From serviceAccount.json → client_email
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@echoplay-dev.iam.gserviceaccount.com"

# From serviceAccount.json → private_key
# IMPORTANT: Keep the quotes and escape newlines as literal \n
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

### How to Extract from Service Account JSON

If your service account file looks like:
```json
{
  "type": "service_account",
  "project_id": "echoplay-dev",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@echoplay-dev.iam.gserviceaccount.com",
  ...
}
```

Then:
- `FIREBASE_PROJECT_ID` = value of `project_id`
- `FIREBASE_CLIENT_EMAIL` = value of `client_email`
- `FIREBASE_PRIVATE_KEY` = value of `private_key` (keep the `\n` characters as-is)

---

## Mobile Environment Variables

Edit `/home/user/EchoPlay/apps/mobile/.env`:

### Firebase Web SDK Config

From the Firebase Console web app config, you'll see:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "echoplay-dev.firebaseapp.com",
  projectId: "echoplay-dev",
  storageBucket: "echoplay-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

Map these to .env variables:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="echoplay-dev.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="echoplay-dev"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="echoplay-dev.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abc123def456"
```

---

## Current Status

### Backend `.env`
```bash
# ✅ Configured
DATABASE_URL="postgresql://echoplay_user:echoplay_dev_password@localhost:5432/echoplay?schema=public"
JWT_SECRET="dev_jwt_secret_change_in_production_to_secure_random_string"
PORT=3000

# ❌ Needs Firebase credentials
FIREBASE_PROJECT_ID="echoplay-dev"
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""
```

### Mobile `.env`
```bash
# ✅ Configured
EXPO_PUBLIC_API_BASE=http://localhost:3000

# ❌ Needs Firebase credentials
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

---

## After Configuration

Once you've filled in the Firebase credentials:

### 1. Verify Backend
```bash
cd /home/user/EchoPlay/backend
npm run start:dev
```

Should see: `[NestApplication] Nest application successfully started`

### 2. Verify Mobile
```bash
cd /home/user/EchoPlay/apps/mobile
npm start
```

Should start Expo dev server without Firebase errors.

### 3. Test Auth Flow
1. Run both backend and mobile
2. In mobile app, tap "Sign Up"
3. Enter email/password
4. Should create user in Firebase
5. Backend receives token and issues JWT
6. User is logged in

---

## Verification Commands

Check if credentials are configured:

```bash
# Backend
grep "FIREBASE_CLIENT_EMAIL" /home/user/EchoPlay/backend/.env

# Mobile
grep "EXPO_PUBLIC_FIREBASE_API_KEY" /home/user/EchoPlay/apps/mobile/.env
```

If these return empty values, follow the [Firebase Setup Guide](./FIREBASE_SETUP.md).
