const fs = require('firebase-admin');

const serviceAccount = require('./yteam-2e5ed-firebase-adminsdk-h2d9j-90ad73c9af.json');

fs.initializeApp({
    credential: fs.credential.cert(serviceAccount)
});

const db = fs.firestore();

let initState1 = true;
let initState2 = true;

const observer1 = db.collection('ptt').onSnapshot(querySnapshot  => {
    if (initState1) {
        initState1 = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    console.log('New city: ', change.doc.data());
                }
                if (change.type === 'modified') {
                    console.log('Modified city: ', change.doc.data());
                }
                if (change.type === 'removed') {
                    console.log('Removed city: ', change.doc.data());
                }
            });
        }
    }
});

const observer2 = db.collection('sos').onSnapshot(querySnapshot  => {
    if (initState2) {
        initState2 = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    console.log('New city: ', change.doc.data());
                }
                if (change.type === 'modified') {
                    console.log('Modified city: ', change.doc.data());
                }
                if (change.type === 'removed') {
                    console.log('Removed city: ', change.doc.data());
                }
            });
        }
    }
});