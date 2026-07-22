# SJNC Kites Mobile Absence App

This version is designed for phones. Each round is a full-width card, so there is no sideways scrolling.

Parents can:
- See every name already entered for each round
- Tap **Add your child**
- Select a team member or type a name
- Remove a name if it was entered by mistake

## Before Firebase is connected

The app opens in **Demo mode** and stores entries only in the current browser. This lets you test the layout before publishing it.

## Connect it to Firebase

### 1. Create a Firebase project

Open Firebase Console and create a project.

### 2. Create a Firestore database

Go to:

Build → Firestore Database → Create database

Choose a region close to Australia if offered.

### 3. Add a Web App

Go to:

Project settings → General → Your apps → Add app → Web

Copy the Firebase configuration values.

### 4. Edit `firebase-config.js`

Replace all placeholder values in that file with the values Firebase gives you.

Example:

```js
export const firebaseConfig = {
  apiKey: "your-real-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5. Add the Firestore security rules

Open:

Firestore Database → Rules

Copy the contents of `firestore.rules` into the rules editor and publish them.

These starter rules allow anyone with the app link to see, add and remove absences. For a private team system later, Firebase Authentication can be added.

### 6. Upload the files

Upload these files to GitHub Pages or Firebase Hosting:

- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`
- `manifest.webmanifest`
- the `assets` folder

The `index.html` file must be at the top level.

## Firebase Hosting option

After installing the Firebase command-line tools:

```bash
firebase login
firebase init hosting
firebase deploy
```

Choose the project you created and use the current folder as the public folder.

## Important privacy note

The starter version allows anyone who has the link to change the absence list. Do not include private medical or family reasons. Only enter children's first names.
