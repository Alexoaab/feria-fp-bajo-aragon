const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "feria-fp-bajo-aragon.firebaseapp.com",
    databaseURL: "https://feria-fp-bajo-aragon-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "feria-fp-bajo-aragon",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.rankingDB = firebase.database();