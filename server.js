const admin= require('firebase-admin');
const ApnsClient = require('apns2').ApnsClient;
const Notification = require('apns2').Notification;
const PushType = require('apns2').PushType;
const Errors = require('apns2').Errors;
const fs = require("fs");

const serviceAccount = require('./yteam-2e5ed-firebase-adminsdk-h2d9j-90ad73c9af.json');

const client = new ApnsClient({
    host: 'api.push.apple.com',
    team: `594Q84397D`,
    keyId: `GGCVCFW5H9`,
    signingKey: fs.readFileSync(`${__dirname}/AuthKey_GGCVCFW5H9.p8`),
    defaultTopic: `com.YTeam.Careific`,
    requestTimeout: 0, // optional, Default: 0 (without timeout)
    pingInterval: 5000, // optional, Default: 5000
})

// Listen for any error
client.on(Errors.error, (err) => {
    console.error(err.reason, err.statusCode, err.notification.deviceToken)
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let initPtt = true;
let initRoutines = true;
let initHeartAnomaly = true;
let initSos = true;
let initIdles = true;
let initCharges = true;
let initFalls = true;
let initInvites = true;

admin.firestore().collection('ptt').onSnapshot(querySnapshot  => {
    if (initPtt) {
        initPtt = false;
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
                                admin
                                    .firestore()
                                    .collection('users')
                                    .doc(speakerId)
                                    .get()
                                    .then((doc) => {
                                        if (doc.exists) {
                                            console.log("speaker data:", doc.data());
                                            const name = String(doc.data().name);

                                            let notifications = []
                                            let index = 0

                                            if (!snapshot.empty) {
                                                snapshot.forEach(doc => {
                                                    const invite = doc.data()

                                                    if (invite.accepted) {
                                                        admin
                                                            .firestore()
                                                            .collection('users')
                                                            .doc(invite.caregiverId == speakerId ? invite.seniorId : invite.caregiverId)
                                                            .get()
                                                            .then(async (doc) => {
                                                                if (doc.exists) {
                                                                    console.log("receiver data:", doc.data());

                                                                    if (doc.data().pttToken != null) {
                                                                        const token = String(doc.data().pttToken);
                                                                        const notification = new Notification(token, {
                                                                            data: {
                                                                                activeSpeaker: `${name} is talking`,
                                                                                uid: speakerId
                                                                            },
                                                                            topic: 'com.YTeam.Careific.voip-ptt',
                                                                            type: PushType.pushtotalk
                                                                        })

                                                                        notifications.push(notification)
                                                                    }

                                                                    if (index == snapshot.size - 1) {
                                                                        try {
                                                                            console.log('notif:', notifications)
                                                                            await client.sendMany(notifications)
                                                                        } catch (err) {
                                                                            console.error(err)
                                                                        }
                                                                    }

                                                                    index += 1
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
                                        } else {
                                            // doc.data() will be undefined in this case
                                            console.log("No such document!");
                                        }
                                    }).catch((error) => {
                                    console.log("Error getting document:", error);
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

admin.firestore().collection('routines').onSnapshot(querySnapshot  => {
    if (initRoutines) {
        initRoutines = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                console.log(change.type)
                if (change.type == 'added' || change.type == 'modified') {
                    const routine = change.doc.data();
                    const seniorId = routine.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const token = String(doc.data().fcmToken);
                                const message = {
                                    token: token,
                                    apns: {
                                        payload: {
                                            "aps" : {
                                                "content-available" : 1
                                            },
                                            "routine": routine,
                                            "isDelete": false
                                        },
                                    }
                                };

                                admin.messaging().send(message)
                                    .then((response) => {
                                        // Response is a message ID string.
                                        console.log('Successfully sent message:', response);
                                    })
                                    .catch((error) => {
                                        console.log('Error sending message:', error);
                                    });
                            } else {
                                // doc.data() will be undefined in this case
                                console.log("No such document!");
                            }
                        }).catch((error) => {
                        console.log("Error getting document:", error);
                    });
                } else {
                    const routine = change.doc.data();
                    const seniorId = routine.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const token = String(doc.data().fcmToken);
                                const message = {
                                    token: token,
                                    apns: {
                                        payload: {
                                            "aps" : {
                                                "content-available" : 1
                                            },
                                            "routine": routine,
                                            "isDelete": true
                                        },
                                    }
                                };

                                admin.messaging().send(message)
                                    .then((response) => {
                                        // Response is a message ID string.
                                        console.log('Successfully sent delete routine:', response);
                                    })
                                    .catch((error) => {
                                        console.log('Error sending message:', error);
                                    });
                            } else {
                                // doc.data() will be undefined in this case
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

admin.firestore().collection('heartAnomaly').onSnapshot(querySnapshot  => {
    if (initHeartAnomaly) {
        initHeartAnomaly = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const heartAnomaly = change.doc.data();
                    const seniorId = heartAnomaly.seniorId;
                    const anomaly = heartAnomaly.anomaly;
                    console.log("SENIOR ID: " + seniorId);

                    let messages = []

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const name = String(doc.data().name);

                                let title = "";
                                let body = "";
                                if (anomaly == "lowHeart") {
                                    title = `Low heart rate detected for ${name}`
                                } else if (anomaly == "highHeart") {
                                    title = `High heart rate detected for ${name}`
                                } else {
                                    title = `Irregular heart rate detected for ${name}`
                                }
                                if (anomaly == "lowHeart") {
                                    body = `Please check on ${name}, their heart rate was detected to be lower than usual.`
                                } else if (anomaly == "highHeart") {
                                    body = `Please check on ${name}, their heart rate was detected to be higher than usual.`
                                } else {
                                    body = `Please check on ${name}, their heart rate was detected to be beating irregularly.`
                                }

                                console.log(title)
                                console.log(body)

                                admin
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
                                                            if (doc.exists) {
                                                                if (doc.data().fcmToken != null) {
                                                                    console.log("Document data:", doc.data());

                                                                    const token = String(doc.data().fcmToken);
                                                                    const message = {
                                                                        notification: {
                                                                            title: title,
                                                                            body: body,
                                                                        },
                                                                        token: token,
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
                            } else {
                                // doc.data() will be undefined in this case
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

admin.firestore().collection('sos').onSnapshot(querySnapshot  => {
    if (initSos) {
        initSos = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const sos = change.doc.data();
                    const seniorId = sos.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    let messages = []

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const name = String(doc.data().name);

                                admin
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
                                                            if (doc.exists) {
                                                                if (doc.data().fcmToken != null) {
                                                                    console.log("Document data:", doc.data());
                                                                    
                                                                    const token = String(doc.data().fcmToken);
                                                                    const message = {
                                                                        notification: {
                                                                            title: `SOS! ${name} pressed the SOS button!`,
                                                                            body: `Please contact ${name} or find help immediately!`,
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
                            } else {
                                // doc.data() will be undefined in this case
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

admin.firestore().collection('idles').onSnapshot(querySnapshot  => {
    if (initIdles) {
        initIdles = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const idle = change.doc.data();
                    const seniorId = idle.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    let messages = []

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const name = String(doc.data().name);

                                admin
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
                                                            if (doc.exists) {
                                                                if (doc.data().fcmToken != null) {
                                                                    console.log("Document data:", doc.data());
                                                                    
                                                                    const token = String(doc.data().fcmToken);
                                                                    const message = {
                                                                        notification: {
                                                                            title: `${name} has been inactive for 6 hours`,
                                                                            body: `${name}'s Apple Watch has not detected any motion for 6 hours.`,
                                                                        },
                                                                        token: token,
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
                            } else {
                                // doc.data() will be undefined in this case
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

admin.firestore().collection('charges').onSnapshot(querySnapshot  => {
    if (initCharges) {
        initCharges = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const charge = change.doc.data();
                    const seniorId = charge.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    let messages = []

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const name = String(doc.data().name);

                                admin
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
                                                            if (doc.exists) {
                                                                if (doc.data().fcmToken != null) {
                                                                    console.log("Document data:", doc.data());
                                                                    
                                                                    const token = String(doc.data().fcmToken);
                                                                    const message = {
                                                                        notification: {
                                                                            title: `${name}'s watch is charging`,
                                                                            body: 'Safety detection features are not available during charging.',
                                                                        },
                                                                        token: token,
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
                            } else {
                                // doc.data() will be undefined in this case
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

admin.firestore().collection('falls').onSnapshot(querySnapshot  => {
    if (initFalls) {
        initFalls = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const fall = change.doc.data();
                    const seniorId = fall.seniorId;
                    console.log("SENIOR ID: " + seniorId);

                    let messages = []

                    admin
                        .firestore()
                        .collection('users')
                        .doc(seniorId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Senior data:", doc.data());
                                const name = String(doc.data().name);

                                admin
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
                                                            if (doc.exists) {
                                                                
                                                                if (doc.data().fcmToken != null) {
                                                                    console.log("Document data:", doc.data());
                                                                    
                                                                    const token = String(doc.data().fcmToken);
                                                                    const message = {
                                                                        notification: {
                                                                            title: `${name}'s fall detection was triggered!`,
                                                                            body: `Please contact ${name} or find help immediately!`,
                                                                        },
                                                                        token: token,
                                                                        apns: {
                                                                            headers: {
                                                                                "apns-priority": "10"
                                                                            },
                                                                            payload: {
                                                                                "aps" : {
                                                                                    "alert" : {
                                                                                        "title": `${name}'s fall detection was triggered!`,
                                                                                        "body": `Please contact ${name} or find help immediately!`,
                                                                                    },
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
                            } else {
                                // doc.data() will be undefined in this case
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

admin.firestore().collection('invites').onSnapshot(querySnapshot  => {
    if (initInvites) {
        initInvites = false;
    } else {
        if (!querySnapshot.docChanges().empty) {
            querySnapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const invite = change.doc.data();
                    const senderId = invite.caregiverId;
                    const recipientId = invite.seniorId;
                    console.log("RECIPIENT ID: " + recipientId);

                    admin
                        .firestore()
                        .collection('users')
                        .doc(senderId)
                        .get()
                        .then((doc) => {
                            if (doc.exists) {
                                console.log("Sender data:", doc.data());
                                const name = String(doc.data().name);

                                admin
                                    .firestore()
                                    .collection('users')
                                    .doc(recipientId)
                                    .get()
                                    .then((doc) => {
                                        if (doc.exists) {
                                            
                                            if (doc.data().fcmToken != null) {
                                                console.log("Recipient data:", doc.data());
                                                const token = String(doc.data().fcmToken);
                                                const message = {
                                                    notification: {
                                                        title: `New request received from ${name}`,
                                                        body: `${name} has requested to become your caregiver.`,
                                                    },
                                                    token: token
                                                };

                                                // Send a message to the device corresponding to the provided
                                                // registration token.
                                                admin.messaging().send(message)
                                                    .then((response) => {
                                                        // Response is a message ID string.
                                                        console.log('Successfully sent message:', response);
                                                        console.log('Sent to: ', token);
                                                    })
                                                    .catch((error) => {
                                                        console.log('Error sending message:', error);
                                                    });
                                            }
                                        } else {
                                            // doc.data() will be undefined in this case
                                            console.log("No such document!");
                                        }
                                    }).catch((error) => {
                                    console.log("Error getting document:", error);
                                });
                            } else {
                                // doc.data() will be undefined in this case
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