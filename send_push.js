// import * as fs from "fs";

var deviceToken = '00bc24aba2473fde5b79f66c6fd3e4fbddb228a509b3426d5fcdbadf206c31e5';
// var apn = require('apn');
//
// var options = {
//     token: {
//         key: "AuthKey_GGCVCFW5H9.p8",
//         keyId: "GGCVCFW5H9",
//         teamId: "594Q84397D"
//     },
//     production: false
// };
//
// var apnProvider = new apn.Provider(options);
//
// let notification = new apn.Notification();
// notification.topic = "com.YTeam.LifeWatch.voip-ptt";
// notification.pushType = "pushtotalk";
// notification.priority = 10;
// notification.expiry = 0;
// notification.payload = {
//     "activeSpeaker":"The name of the active speaker"
// }
//
// apnProvider.send(notification, [deviceToken]).then( (response) => {
//     // response.sent: Array of device tokens to which the notification was sent succesfully
//     // response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
//     console.log("successfull device tokens: " + JSON.stringify(response.sent));
//     console.log("failed device tokens: " + JSON.stringify(response.failed));
//     process.exit();
// });

const ApnsClient = require('apns2').ApnsClient;
const Notification = require('apns2').Notification;
const PushType = require('apns2').PushType;
const fs = require("fs");

async function start() {
    const client = new ApnsClient({
        host: 'api.sandbox.push.apple.com',
        team: `594Q84397D`,
        keyId: `GGCVCFW5H9`,
        signingKey: fs.readFileSync(`${__dirname}/AuthKey_GGCVCFW5H9.p8`),
        defaultTopic: `com.YTeam.Careific`,
        requestTimeout: 0, // optional, Default: 0 (without timeout)
        pingInterval: 5000, // optional, Default: 5000
    })

    const bn = new Notification(deviceToken, {
        data: {
            activeSpeaker: "The name of the active speaker"
        },
        topic: 'com.YTeam.Careific.voip-ptt',
        type: PushType.pushtotalk
    })

    try {
        await client.send(bn)
    } catch (err) {
        console.error(err)
    }
}

start().then(r => {
    process.exit()
})
