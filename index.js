var express = require('express');
// var requester = require('request');
var http = require('http');
var https = require('https');
var rest = require('rest');
var md5 = require('md5');
var beautify = require('js-beautify').html;
var app = express();

var CURRENT_VERSION = "1.0.0";
var SERVER_RUNNING = false;
var __dirname = "C:/cygwin64/home/Carl/Git/node-testbed"
var requestNumber = 0;

var username = "test";
var password = "t3stt3st";

console.log("=========================================================");
console.log("Carl's node.js testbed");
console.log("Version: " + CURRENT_VERSION);
console.log("=========================================================");


app.get('/', function(req, res) {
    console.log("Request received for HTML page: " + (requestNumber + 1));
    res.sendFile('index.html', {
        root: __dirname
    });
    requestNumber++;
})

if (SERVER_RUNNING) {
    app.listen(3000, function() {
        console.log('Server is now listening on port 3000!');
        console.log("=========================================================");
    })
}

//Make first request, store request in objects

//Make second request


// var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

/*==============================================================================
    CREATE REQUESTS HERE
==============================================================================*/
// var username = new Buffer("test").toString('base64');
// var password = new Buffer("t3stt3st").toString('base64');
//Create authorization for use in headers
var authString = "";
authString += 'Digest ' + new Buffer('test' + ':' + 't3stt3st').toString('base64');
// console.log("AUTH: " + authString);

var options = {
    host: 'abalobi-fisher.appspot.com',
    path: '/formList'
};

// var simpleOptions = {
//   host: 'abalobi-fisher.appspot.com',
//   path: '/formList',
//   headers: {
//       Authorization: authString
//   }
// }
// createSimpleRequest(simpleOptions);

console.log(JSON.stringify(options, null, 4));

/*==============================================================================
    HANDLE REQUESTS HERE
==============================================================================*/
//This is used to store the values in www-authenticate, which gets
//received from the header of the first response.
var jsonHEADERS;


var req = https.get(options, function(res) {
    console.log("=========================================================");
    console.log('STATUS CODE:\n ' + res.statusCode);
    console.log('HEADERS:\n ' + JSON.stringify(res.headers, null, 4));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
        // You can process streamed parts here...
        bodyChunks.push(chunk);
    }).on('end', function() {
        var body = Buffer.concat(bodyChunks);
        console.log('BODY: \n' + beautify(body.toString(), { indent_size: 4 }));
        // ...and/or process the entire body here.
    })

    if (res.headers.connection == "close") {
        //If the request is closed,
        //Get the headers and make the request again
        var stringFromHeaders;

        var realm;
        var nonce;
        var qop;




        try{
          stringFromHeaders = res.headers['www-authenticate'];

          //Store the WWW-Authenticate into a JSON
          jsonHEADERS = splitIntoJSON(stringFromHeaders);

          // console.log("PRINTING www-authenticate");
          // console.log(JSON.stringify(jsonHEADERS, null, 4));

          realm = jsonHEADERS.Digestrealm;
          nonce = jsonHEADERS.nonce;
          qop = jsonHEADERS.qop;
          var cnonce = randomString(48);



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
          var actualResponse = md5(ha1 + ":" + nonce + ":" + ha2);

          //THIS is more than likely incorrect.
          digestString = "Digest username=\"" + username +"\","
          + "realm=\"abalobi-fisher ODK Aggregate\","
          + "nonce=\"" + nonce + "\","
          + "uri=\"" + "/formList" + "\","
          + "response=\"" + actualResponse + "\","
          + "cnonce=\"" + cnonce + "\"",
          + "qop=" + qop + "";
          //nc=00000001

          //
          //
          // + "domain =\"" + "abalobi-fisher.appspot.com" + "\"",




          //We have to set up our options now.
          var options2 = {
            host: 'abalobi-fisher.appspot.com',
            path: '/formList',
            headers:{
              Authorization: "Digest " + digestString
            }
          }
          // console.log(qop);
          //NOW WE MAKE A SECOND REQUEST
          createRequest(options2);

        }
        catch (ex){
          console.log("ERROR: \n" + ex);
          console.log("BLEH");
        }
    }




});

req.on('error', function(e) {
    console.log('ERROR: \n' + e.message);
});

















function splitIntoJSON(stringToSplit){
  var finalObject = {};
  //Separate all values into an array
  var commaSplit = stringToSplit.split(",");
  for (var i = 0; i < commaSplit.length; i++){
    //For each pair of values, split by equals
    var equalsSplit = commaSplit[i].split("=");
    //Remove spaces from variable names
    var spacesRemoved = removeSpaces(equalsSplit[0].toString());
    finalObject[
      spacesRemoved.toString()
    ] = removeEscapes(equalsSplit[1]);
  }

  return finalObject;

  // console.log("PRINTING JSON TO CONSOLE");
  // console.log(JSON.stringify(finalObject, null, 4));

}

function removeSpaces(processMe){
  return processMe.replace(/\s+/g, '');
  // return processMe.replace( /\s/g, "");
}
function removeEscapes(processMe){
  return processMe.replace(/\"/g, '');
  // return processMe.replace( /\s/g, "");
}

function createRequest(reqOptions){
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
          console.log('BODY: \n' + beautify(body.toString(), { indent_size: 4 }));
          // ...and/or process the entire body here.
      })
  });

  req.on('error', function(e) {
      console.log("INTERNAL FUNCTION ERROR");
      console.log(e);
      console.log('ERROR: \n' + e.message);
  });


}

function createSimpleRequest(requestOptions){
  var req = https.get(requestOptions, function(res) {
      console.log("=========================================================");
      console.log("BASIC REQUEST INITIATED");
      console.log('STATUS:\n ' + res.statusCode);
      console.log('HEADERS:\n ' + JSON.stringify(res.headers, null, 4));
      // Buffer the body entirely for processing as a whole.
      var bodyChunks = [];
      res.on('data', function(chunk) {
          // You can process streamed parts here...
          bodyChunks.push(chunk);
      }).on('end', function() {
          var body = Buffer.concat(bodyChunks);
          console.log('BODY: \n' + beautify(body.toString(), { indent_size: 4 }));
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
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
