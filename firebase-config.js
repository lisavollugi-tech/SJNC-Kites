// Replace the placeholder values below with the configuration
// shown in Firebase Console → Project settings → Your apps → Web app.

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyD48UYccpepGcEYd6DA4KCAdNnPqXHoySI",
    authDomain: "sjnc-kites.firebaseapp.com",
    projectId: "sjnc-kites",
    storageBucket: "sjnc-kites.firebasestorage.app",
    messagingSenderId: "159366886364",
    appId: "1:159366886364:web:e6f52faac65c5bc135d519",
    measurementId: "G-G7W2QGQRQC"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
