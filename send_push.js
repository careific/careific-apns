var deviceToken = '740552dc73b346a8174911da41ac02779d2160472b36a08390911f84f945b5ee';
var apn = require('apn');

var options = {
    token: {
        key: "AuthKey_GGCVCFW5H9.p8",
        keyId: "GGCVCFW5H9",
        teamId: "594Q84397D"
    },
    production: false
};

var apnProvider = new apn.Provider(options);

let notification = new apn.Notification();
notification.topic = "com.YTeam.LifeWatch.voip-ptt";
notification.pushType = "pushtotalk";
notification.priority = 10;
notification.expiry = 0;
notification.payload = {
    "activeSpeaker":"The name of the active speaker"
}

apnProvider.send(notification, [deviceToken]).then( (response) => {
    // response.sent: Array of device tokens to which the notification was sent succesfully
    // response.failed: Array of objects containing the device token (`device`) and either an `error`, or a `status` and `response` from the API
    console.log("successfull device tokens: " + JSON.stringify(response.sent));
    console.log("failed device tokens: " + JSON.stringify(response.failed));
    process.exit();
});