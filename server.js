const admin= require('firebase-admin');
const ApnsClient = require('apns2').ApnsClient;
const Notification = require('apns2').Notification;
const PushType = require('apns2').PushType;
const fs = require("fs");

const serviceAccount = require('./yteam-2e5ed-firebase-adminsdk-h2d9j-90ad73c9af.json');

const client = new ApnsClient({
    host: 'api.sandbox.push.apple.com',
    team: `594Q84397D`,
    keyId: `GGCVCFW5H9`,
    signingKey: fs.readFileSync(`${__dirname}/AuthKey_GGCVCFW5H9.p8`),
    defaultTopic: `com.YTeam.Careific`,
    requestTimeout: 0, // optional, Default: 0 (without timeout)
    pingInterval: 5000, // optional, Default: 5000
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let initState1 = true;
let initState2 = true;

const observer1 = admin.firestore().collection('ptt').onSnapshot(querySnapshot  => {
    if (initState1) {
        initState1 = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const ptt = change.doc.data();
                    const speakerId = ptt.speakerId;

                    admin
                        .firestore()
                        .collection('invites')
                        .where(
                            admin.firestore.Filter.or(
                                admin.firestore.Filter.where('seniorId', '==', speakerId),
                                admin.firestore.Filter.where('caregiverId', '==', speakerId)
                            )
                        )
                        .get()
                        .then((snapshot) => {
                            if (!snapshot.empty) {
                                let notifications = []
                                let index = 0

                                snapshot.forEach(doc => {
                                    const invite = doc.data()

                                    if (invite.accepted) {
                                        admin
                                            .firestore()
                                            .collection('users')
                                            .doc(invite.caregiverId == speakerId ? invite.seniorId : invite.caregiverId)
                                            .get()
                                            .then(async (doc) => {
                                                if (doc.exists) {// @ts-ignore
                                                    if (doc.data().pttToken != null) {
                                                        console.log("Document data:", doc.data());
                                                        // @ts-ignore
                                                        const token = String(doc.data().pttToken);
                                                        const notification = new Notification(token, {
                                                            data: {
                                                                activeSpeaker: speakerId
                                                            },
                                                            topic: 'com.YTeam.Careific.voip-ptt',
                                                            type: PushType.pushtotalk
                                                        })

                                                        notifications.push(notification)

                                                        if (index == snapshot.size - 1) {
                                                            try {
                                                                await client.sendMany(notifications)
                                                            } catch (err) {
                                                                console.error(err)
                                                            }
                                                        }

                                                        index += 1
                                                    }
                                                } else {
                                                    // doc.data() will be undefined in this case
                                                    console.log("No such document!");
                                                }
                                            }).catch((error) => {
                                            console.log("Error getting document:", error);
                                        });
                                    }

                                    console.log(doc.id, '=>', doc.data());
                                });
                            } else {
                                console.log("No such document!");
                            }
                        }).catch((error) => {
                            console.log("Error getting document:", error);
                        });
                }
            });
        }
    }
});

const observer2 = admin.firestore().collection('sos').onSnapshot(querySnapshot  => {
    if (initState2) {
        initState2 = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const sos = change.doc.data();
                    const seniorId = sos.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    let messages = []

                    return admin
                        .firestore()
                        .collection('invites')
                        .where('seniorId', '==', seniorId)
                        .get()
                        .then((snapshot) => {
                            if (!snapshot.empty) {
                                let index = 0
                                snapshot.forEach(doc => {
                                    const invite = doc.data()

                                    if (invite.accepted) {
                                        admin
                                            .firestore()
                                            .collection('users')
                                            .doc(invite.caregiverId)
                                            .get()
                                            .then((doc) => {
                                                if (doc.exists) {// @ts-ignore
                                                    if (doc.data().fcmToken != null) {
                                                        console.log("Document data:", doc.data());
                                                        // @ts-ignore
                                                        const token = String(doc.data().fcmToken);
                                                        const message = {
                                                            notification: {
                                                                title: 'SOS!!!',
                                                                body: 'Your senior pressed the SOS button!',
                                                            },
                                                            token: token,
                                                            apns: {
                                                                headers: {
                                                                    "apns-priority": "10"
                                                                },
                                                                payload: {
                                                                    "aps" : {
                                                                        "interruption-level": "critical",
                                                                    },
                                                                },
                                                            }
                                                        };

                                                        messages.push(message)

                                                        if (index == snapshot.size - 1) {
                                                            admin.messaging().sendEach(messages)
                                                                .then((response) => {
                                                                    // Response is a message ID string.
                                                                    console.log('Successfully sent message:', response.responses);
                                                                    console.log('Sent to: ', messages.length, ' devices');
                                                                })
                                                                .catch((error) => {
                                                                    console.log('Error sending message:', error);
                                                                });
                                                        }

                                                        index += 1
                                                    }
                                                } else {
                                                    // doc.data() will be undefined in this case
                                                    console.log("No such document!");
                                                }
                                            }).catch((error) => {
                                            console.log("Error getting document:", error);
                                        });
                                    }

                                    console.log(doc.id, '=>', doc.data());
                                });
                            } else {
                                console.log("No such document!");
                            }
                        }).catch((error) => {
                            console.log("Error getting document:", error);
                        });
                }
            });
        }
    }
});