const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-function
//

const admin = require('firebase-admin');
const serviceAcc = require('./spotify316-40ea2-firebase-adminsdk-ltrw9-f1e70ad9bc.json');
admin.initializeApp(functions.config().firebase);

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var session = require('express-session')


var client_id = 'c78526ebdf26433cbb293f2dc1fa32e6';//'efa17a8f851d4bea93553ea7e2610eb0'; // Your client id
var client_secret = '7a6b0c4952c74b4293813ceb82046092';//'27a6fe62777a4de6855b83f62e1367a0'; // Your secret
var redirect_uri = 'https://spotify316-40ea2.firebaseapp.com/callback'; // 'http://localhost:5000/callback'Your redirect uri


var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = '__session';//'spotify_auth_state';

var app = express();
app.use(cors())
	// .use(session({
	// 	secret: 'keyboard cat',
	// 	resave: true,
	//   cookie: { secure: false }
	// }))
   .use(cookieParser());

app.get('/login', function(req, res) {
	console.log("LOGGIN INNNNNN");
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  //res.setHeader('Cache-Control', 'private');

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// GET request made to /callback endpoint
app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  console.log("CODE: "+code);
  console.log("STATE: "+state);
  console.log("STORED STATE: "+storedState);
  console.log("	COOKIES: "+req.cookies[stateKey]);


  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    console.log("CODE OF CALLBACK: "+code);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'//,
        //client_secret: client_secret,
        //client_id: client_id
      }
      ,
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      json: true
    };

    console.log("CODE OF CALLBACK: "+code);



    //************BEGIN INFO REQUEST/STORES HERE************//
        // general layout of the nested loop mess below:
        // request user profile info
        // request all playlists
          // for each playlist
            // request all tracks
              // for each track
                // get track name
                // request track features

    // put user profile in database
    var uid;
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;



        //************USER INFO REQUEST************//

        // user info request endpoint
        var profile = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        // put user profile info in database
        request.get(profile, function(error, response, body) {
          console.log("here is the body");
          console.log(body);
          var user = body;
          uid = user.id;

          // store in Firebase as new document - random doc name assigned
          // this was part of first attempt - don't use this 
          // database.collection("users").add({
          //     body
          // })
          //   .then(function(docRef) {
          //     console.log("Document written with ID: ", docRef.id);
          // })
          // .catch(function(error) {
          //     console.error("Error adding document: ", error);
          // });
          //

          // reformat user JSON object when storing in firebase
          var user_info_text ='{"Name":"' + user.display_name +'",' +
                              '"User ID":"' + user.id +'",' +
                              '"Email":"' + user.email +'",' +
                              '"Country":"' + user.country +'"}';
          var user_info = JSON.parse(user_info_text);

          // create new doc in Firebase with Spotify uid as doc name 
          database.collection("users").doc(uid.toString()).set({
            user: user_info,
            playlists: "",
            tracks: "",
            audio_features: ""
          }).then(function() {
            console.log("User created " + uid);
          });
        });


        //************PLAYLIST REQUEST************//

        // playlist request endpoint
        var playlist = {
          url: 'https://api.spotify.com/v1/me/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        var playlists;
        track_names = [];
        track_features = [];
        // put user playlist info in database
        // request all of user's playlists
        request.get(playlist, function(error, response, body) {
          console.log("here is the playlist");
          playlists = body.items;

          // Iterate through playlists
          for (i = 0; i < playlists.length; i++){
            playlist_id = playlists[i].id; 
            console.log(playlists[i].name)
            console.log("*******************")

            // playlist track request endpoint
            var req_url = "https://api.spotify.com/v1/playlists/"+ playlist_id +"/tracks"
            var playlist_track_request = {
            url: req_url,
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true };

            // request tracks from a playlist
            request.get(playlist_track_request, function(error, response, body) {
              var playlist_tracks = body.items;
              // Iterate through tracks to get track names and track features
              for(j = 0; j < playlist_tracks.length; j++){
                // store track names in array
                var track_id = playlist_tracks[j].track.id;
                track_names.push(playlist_tracks[j].track.name);


                //************AUDIO FEATURES REQUEST************//

                var features_req = {
                  url: 'https://api.spotify.com/v1/audio-features/' + track_id,
                  headers: { 'Authorization': 'Bearer ' + access_token },
                  json: true
                };

                // note that when storing the features of each track in an array, then storing the array
                // in a firebase field, that database.collection command must be INSIDE the requests.get
                // function, even if it's nested within the for loop that goes through each track.
                // same case for storing track names.

                // request track features
                request.get(features_req, function(error, response, body) {
                  var features = body;
                  track_features.push(features);
                  // add audio features for each of user's tracks to field 'audio_features'
                  database.collection("users").doc(uid).update({
                    audio_features: track_features
                  }).then(function() {
                    //console.log("User audio features updated " + uid);
                  });
                });
              }

              // add list of track names to firebase to field 'tracks'
              database.collection("users").doc(uid).update({
                tracks: track_names
              }).then(function() {
                console.log("User tracks updated " + uid);
              });
            });
        }

          // update playlist attribute for doc with same name (spotify uid)
          database.collection("users").doc(uid).update({
            playlists: playlists
          }).then(function() {
            console.log("User playlists updated " + uid);
          });

        });


        // request.get(playlist, function(error, response, body) {
        //   console.log("here is the playlist");
        //   //console.log(body);

        //   // store in Firebase as new document - random document name assigned
        //   // database.collection("users").add({
        //   //     body
        //   // })
        //   //   .then(function(docRef) {
        //   //     console.log("Document written with ID: ", docRef.id);
        //   // })
        //   // .catch(function(error) {
        //   //     console.error("Error adding document: ", error);
        //   // });
        //   //

        //   // update playlist attribute for doc with same name (spotify uid)
        //   // update in Firebase
        //   database.collection("users").doc(uid).update({
        //     playlists: body
        //   }).then(function() {
        //     console.log("User updated " + uid);
        //   });
        // });


        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});


app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


exports.app = functions.https.onRequest(app);
//  response.send("Hello from Firebase!");
// });
