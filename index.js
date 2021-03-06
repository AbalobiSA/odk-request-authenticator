/*==============================================================================
    Carl's ODK Authenticator App
    Version: 1.0.0
==============================================================================*/

var http = require('http');
var https = require('https');
var md5 = require('md5');
var beautify = require('js-beautify').html;

/*==============================================================================
    Customizable settings
==============================================================================*/

var CURRENT_VERSION = "1.0.0";
var SERVER_RUNNING = false;
var MODE_SIMPLE = false; //If you want to run a basic request (not working) then set as true
var MODE_DIGEST = true; //This will attempt Digest Authentication

var username = "test";
var password = "t3stt3st";

/*==============================================================================
    Hard-coded variables
==============================================================================*/

console.log("=========================================================");
console.log("Carl's node.js testbed");
console.log("Version: " + CURRENT_VERSION);
console.log("=========================================================");

/*==============================================================================
    HTTP Requests - The real point of this whole script.
==============================================================================*/

var options = {
    host: 'abalobi-fisher.appspot.com',
    path: '/formList'
};

/*==============================================================================
    HANDLE REQUESTS HERE
==============================================================================*/
//This is used to store the values in www-authenticate, which gets
//received from the header of the first response.
var jsonHEADERS;

if (MODE_DIGEST) {
    console.log("Creating initial Digest Request...");
    var req = https.get(options, function(res) {
        console.log("");
        console.log('STATUS CODE:\n ' + res.statusCode);
        console.log('HEADERS:\n ' + JSON.stringify(res.headers, null, 4));
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            console.log('BODY: \n' + beautify(body.toString(), {
                indent_size: 4
            }));
            // ...and/or process the entire body here.

            //Now that the request has definitely ended, 
            //Start a second request!

            console.log("=========================================================");
            console.log("First request completed!\nCreating second request...\n");
            var stringFromHeaders;

            var realm;
            var nonce;
            var qop;

            try {
                stringFromHeaders = res.headers['www-authenticate'];

                //Store the WWW-Authenticate into a JSON
                jsonHEADERS = splitIntoJSON(stringFromHeaders);

                // console.log(JSON.stringify(jsonHEADERS, null, 4));

                // console.log("PRINTING www-authenticate");
                // console.log(JSON.stringify(jsonHEADERS, null, 4));

                realm = jsonHEADERS.realm;
                nonce = jsonHEADERS.nonce + "==";
                qop = jsonHEADERS.qop;
                var cnonce = randomString(48);
                var nc = "";

                console.log("Some information on the Hashing Process:\n");
                console.log("Realm: " + realm 
                    + "\nNonce: " + nonce 
                    + "\nUsername: " + username 
                    + "\nPassword: " + password 
                    + "\nCNonce: " + cnonce 
                    + "\nQop: " + qop + "\n");
                /*
                  HA1 = MD5(A1) = MD5(username:realm:password)
                  HA2 = MD5(A2) = MD5(method:digestURI)
                  response = MD5(HA1:nonce:HA2)
                */



                //TODO: Generate MD5 hashes here.
                var beforeHA1 = username + ":" + realm + ":" + password;
                var beforeHA2 = "GET:" + "/formList";

                var ha1 = md5(beforeHA1);
                var ha2 = md5(beforeHA2);
                var actualResponse = md5(ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2);

                console.log("Before 1st Hash: " + beforeHA1 + "\n" +
                    "Before 2nd Hash: " + beforeHA2 + "\n" +
                    "HA1: " + ha1 + "\n" +
                    "HA2: " + ha2 + "\n" +
                    "Fake Response: " + "026bf6a54e4fc47e99e64df8f96fd2a3" + "\n" +
                    "Response: " + actualResponse + "\n");

                //THIS is more than likely incorrect.
                digestString = "Digest username=\"" + username + "\", " +
                    "realm=\"abalobi-fisher ODK Aggregate\", " +
                    "nonce=\"" + nonce + "\", " +
                    "uri=\"" + "/formList" + "\", " +
                    "qop=" + qop + ", " + 
                    "nc=" + ", " + 
                    "cnonce=\"" + cnonce + "\", " +
                    "response=\"" + actualResponse + "\", " +
                    "opaque=, ";

                    // console.log("TEST STRING \n" + digestString);
                    
                /*
                Digest username="test",
                realm="abalobi-fisher ODK Aggregate",
                nonce="MTQ3ODg1NDU0NzA0MToxMzcwOTMyOTU5MTIyNGUwMDU1MzVmMzY4NDA1ODZlYg==",
                uri="/formList",
                qop=auth,
                nc=,
                cnonce="KQWRmKFaoP6xKaR5J0DQXh9Gs5dJ1dsC58h93BpymyxiukcQ",
                response="2ba0dcb883bd393ad8533e5006ae3f82",
                opaque=""
                */

                // console.log(digestString);

                //We have to set up our options now.
                var options2 = {
                        host: 'abalobi-fisher.appspot.com',
                        path: '/formList',
                        headers: {
                            Authorization: digestString
                        }
                    }

                console.log("Your options for this request: \n" + JSON.stringify(options2, null, 4));
                console.log("\n\nA nicer view of your digest string: \n");
                console.log(nicerDigest(digestString));
                // console.log(JSON.stringify(splitIntoJSON(digestString), null, 4));
                    // console.log(qop);
                    //NOW WE MAKE A SECOND REQUEST
                createRequest(options2);

            } catch (ex) {
                console.log("ERROR: \n" + ex);
                console.log("BLEH");
            }

        })




    });

    req.on('error', function(e) {
        console.log('ERROR: \n' + e.message);
    });


} //End of MODE_DIGEST if statement




/*==============================================================================
    Utility Methods
==============================================================================*/


function splitIntoJSON(stringToSplit) {
    var finalObject = {};

    //Separate all values into an array
    var commaSplit = stringToSplit.split(",");

    for (var i = 0; i < commaSplit.length; i++) {

        //For each pair of values, split by equals
        var equalsSplit = commaSplit[i].split("=");

        //If this is running the first time, remove the 'Digest' text
        if (i == 0) {
            equalsSplit[0] = equalsSplit[0].replace(/Digest/g, '');
        }


        //Remove spaces from variable names
        var spacesRemoved = removeSpaces(equalsSplit[0].toString());
        finalObject[spacesRemoved.toString()] = removeEscapes(equalsSplit[1]);
    }

    return finalObject;

    // console.log("PRINTING JSON TO CONSOLE");
    // console.log(JSON.stringify(finalObject, null, 4));

}

function removeSpaces(processMe) {
    return processMe.replace(/\s+/g, '');
    // return processMe.replace( /\s/g, "");
}

function removeEscapes(processMe) {
    return processMe.replace(/\"/g, '');
    // return processMe.replace( /\s/g, "");
}

function createRequest(reqOptions) {
    var req = https.get(reqOptions, function(res) {
        console.log("=========================================================");
        console.log('STATUS:\n ' + res.statusCode);
        console.log('HEADERS:\n ' + JSON.stringify(res.headers, null, 4));
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            console.log('BODY: \n' + beautify(body.toString(), {
                indent_size: 4
            }));
            // ...and/or process the entire body here.
        })
    });

    req.on('error', function(e) {
        console.log("INTERNAL FUNCTION ERROR");
        console.log(e);
        console.log('ERROR: \n' + e.message);
    });


}

var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var nicerDigest = function(sentDigestString){
    var digestArray = sentDigestString.split(",");
    var escapedString = "";
    for (var i = 0; i < digestArray.length; i++){
        escapedString += digestArray[i] + "\n";
    }
    return escapedString;
}