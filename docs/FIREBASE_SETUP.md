# Firebase Setup Guide for EchoPlay

This guide walks through setting up Firebase Authentication for the EchoPlay project.

## Prerequisites

- Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: `echoplay-dev` (or your preferred name)
4. Disable Google Analytics (optional for dev)
5. Click "Create project"

## Step 2: Enable Authentication Methods

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click, toggle "Enable", save
   - **Google**: Click, toggle "Enable", add support email, save
   - **Apple**: Click, toggle "Enable", configure Apple Developer settings

## Step 3: Register Mobile App (iOS)

1. In Project Overview, click iOS icon
2. iOS bundle ID: `com.echoplay.app`
3. App nickname: `EchoPlay iOS`
4. Download `GoogleService-Info.plist`
5. **Save to**: `/home/user/EchoPlay/apps/mobile/GoogleService-Info.plist`

## Step 4: Register Mobile App (Android)

1. In Project Overview, click Android icon
2. Android package name: `com.echoplay.app`
3. App nickname: `EchoPlay Android`
4. Download `google-services.json`
5. **Save to**: `/home/user/EchoPlay/apps/mobile/google-services.json`

## Step 5: Get Web SDK Configuration

1. In Project Overview, click Web icon (</> icon)
2. App nickname: `EchoPlay Web`
3. Copy the config object - you'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "echoplay-dev.firebaseapp.com",
  projectId: "echoplay-dev",
  storageBucket: "echoplay-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

4. **Update mobile .env** with these values (see Step 8)

## Step 6: Create Service Account for Backend

1. In Firebase Console, click gear icon → Project settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. The file contains:
   - `project_id`: Firebase project ID
   - `client_email`: Service account email
   - `private_key`: Long private key string

6. **Update backend .env** with these values (see Step 8)

## Step 7: Configure Authorized Domains

1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (when deployed)

## Step 8: Update Environment Variables

### Backend (.env)

Edit `/home/user/EchoPlay/backend/.env`:

```bash
# From service account JSON
FIREBASE_PROJECT_ID="echoplay-dev"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@echoplay-dev.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

### Mobile (.env)

Edit `/home/user/EchoPlay/apps/mobile/.env`:

```bash
# From Web SDK config
EXPO_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="echoplay-dev.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="echoplay-dev"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="echoplay-dev.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abc123..."
```

## Step 9: Verify Setup

### Test Backend

```bash
cd /home/user/EchoPlay/backend
npm run start:dev
```

The backend should start without Firebase errors.

### Test Mobile

```bash
cd /home/user/EchoPlay/apps/mobile
npm start
```

Try creating a test account in the app.

## Security Notes

- **NEVER commit** the actual credentials to git
- The `.env` files are already in `.gitignore`
- Use environment-specific projects (echoplay-dev, echoplay-prod)
- Rotate service account keys periodically
- Enable App Check for production to prevent abuse

## Troubleshooting

### "Invalid API key" error
- Double-check the API key in mobile .env
- Verify the bundle ID matches Firebase console

### "Firebase Admin initialization failed"
- Verify private key has literal `\n` for newlines
- Check client_email format
- Ensure project_id matches

### "Auth domain not authorized"
- Add your domain to Authorized domains in Firebase Console

## Testing Auth Flow

1. Start backend server
2. Start mobile app
3. Try sign up with email/password
4. Mobile app should:
   - Create Firebase user
   - Send ID token to backend `/v1/auth/verify`
   - Receive JWT token
   - Store in auth store
5. Verify user appears in Firebase Console → Authentication → Users

## Next Steps

After Firebase is configured:
- Implement phone authentication (optional)
- Set up Firebase Cloud Messaging for push notifications
- Configure Firebase Storage rules
- Add email verification flow
- Implement password reset
