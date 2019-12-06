const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-function
//

const admin = require('firebase-admin');
const serviceAcc = require('./spotify316-40ea2-firebase-adminsdk-ltrw9-f1e70ad9bc.json');
admin.initializeApp({credential: admin.credential.cert(serviceAcc)}/*functions.config().firebase*/);
const db = admin.firestore();

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');


var client_id = '965431a4e2be43a7b8743881ac9a5d6f';//'efa17a8f851d4bea93553ea7e2610eb0'; // Your client id
var client_secret = '7516c67f0f03436d8285af8aaf7c7268';//'27a6fe62777a4de6855b83f62e1367a0'; // Your secret
var redirect_uri = 'http://localhost:5000/callback';//'https://spotify316-40ea2.firebaseapp.com/callback'; // 'Your redirect uri

var global_access_tok = '';

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = '__session';// used to be 'spotify_auth_state' but google only recognizes __session

var app = express();
app.use(cors())
   .use(cookieParser());
app.set('view engine', 'ejs');



app.get('/matches', function(req, res) {

	var users = [];

	db.collection('users').get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				var person = doc.data().user;
				users.push(person);
			});
			res.render('matches', {
        		users: users
    		});

			
		})
		.catch(err => {
			console.error('Error getting documents',err);
			process.exit();
		})      
});



app.get('/discover', function(req, res) {
	
});





app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = ['user-read-private', 'user-read-email', 'user-top-read','user-read-recently-played',
  				'user-library-read','user-follow-read','user-follow-modify'].join(' ');
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
        grant_type: 'authorization_code'
      }
      ,
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      json: true
    };

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
        global_access_tok = access_token;


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
          var user = body;
          uid = user.id;

          // reformat user JSON object when storing in firebase
          var user_info_text ='{"Name":"' + user.display_name +'",' +
                              '"User ID":"' + user.id +'",' +
                              '"Email":"' + user.email +'",' +
                              '"Country":"' + user.country +'"}';
          var user_info = JSON.parse(user_info_text);

          // create new doc in Firebase with Spotify uid as doc name 
          db.collection("users").doc(uid.toString()).set({
            user: user_info,
            audio_features: ""
          })
          .then(function() {
            console.log("User created " + uid);
          })
          .catch(function(error) {
               console.error("Error adding document: ", error);
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
        
        track_features = [];
        // put user playlist info in database
        // request all of user's playlists
        request.get(playlist, function(error, response, body) {
          console.log("here is the playlist");
          playlists = body.items;

          // Iterate through playlists
          for (i = 0; i < playlists.length; i++) {
            (function(){
            var track_names = [];
            var playlist_id = playlists[i].id; 
            var name = playlists[i].name;
            console.log(playlists[i].name)
            console.log("*******************")

            // playlist track request endpoint
            var req_url = "https://api.spotify.com/v1/playlists/"+ playlist_id +"/tracks"
            var playlist_track_request = {
            url: req_url,
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true };

            db.collection("users").doc(uid).collection("playlist").doc(name).set({
              tracks: ""
            }).then(function() {
              console.log(name + "This is Karen's work");
            });

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
                  db.collection("users").doc(uid).update({
                    audio_features: track_features
                  }).then(function() {
                    //console.log("User audio features updated " + uid);
                  });
                });

                db.collection("users").doc(uid).collection("playlist").doc(name).update({
                  tracks: track_names,
                  info: playlists
                }).then(function() {
                  console.log("User tracks updated " + uid);
                });
              }

              // add list of track names to firebase to field 'tracks'
              
             

            });

            //hre
          })();
          }

        });

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
      global_access_tok = access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


exports.app = functions.https.onRequest(app);
//  response.send("Hello from Firebase!");
// });
