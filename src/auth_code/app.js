/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'efa17a8f851d4bea93553ea7e2610eb0'; // Your client id
var client_secret = '27a6fe62777a4de6855b83f62e1367a0'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/database");
require('firebase/auth');
require("firebase/firestore");

// TODO: Replace the following with your app's Firebase project configuration
var firebaseConfig = {

  apiKey: "AIzaSyA7n3Skbd9S7vs8Ze4-zUXTG0XdOUOfbeI",
  authDomain: "spotify316-40ea2.firebaseapp.com",
  databaseURL: "https://spotify316-40ea2.firebaseio.com",
  projectId: "spotify316-40ea2",
  storageBucket: "spotify316-40ea2.appspot.com",
  messagingSenderId: "1043630421868",
  appId: "1:1043630421868:web:aeff8a4bd8df01e14f6549",
  measurementId: "G-8CBFXCHDNE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
var database = firebase.firestore();

// console.log("database");
// console.log(database);


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
console.log(__dirname);
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());



function getUserData(accessToken) {
  return fetch(
    'https://api.spotify.com/v1/me',
    { 'headers': {'Authorization': 'Bearer ' + accessToken } }
  );
}



function showLoginUI() {
// Show sign in button
document.getElementById('signout-button').style.display = "none";
document.getElementById('loading').style.display = "none";
document.getElementById('signin-button').style.display = "block";
}



function signIn() {
  // Show loading text
  document.getElementById('loading').style.display = "block";
  // Hide buttons
  document.getElementById('signout-button').style.display = "none";
  document.getElementById('signin-button').style.display = "none";
  login()
    .then(accessToken => getUserData(accessToken))
    .then(response => response.json())
    .then(data => {
      // Call the signup function with the spotify id
      const signUp = firebase.functions().httpsCallable('signUp');
      return signUp({user_id: `spotify:${data.id}`})
    })
    .then(result => {
      // Sign in with the token from the function
      const token = result.data.token;
      return app.auth().signInWithCustomToken(token)
    }).then(user => {
      console.log("Logged in:", user);
    }).catch(error => {
      console.error(error);
    });
}



firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log("Authenticated:", user);
    // Show sign out button
    document.getElementById('signout-button').style.display = "block";
    document.getElementById('signin-button').style.display = "none";
    document.getElementById('loading').style.display = "none";
  } else {
    showLoginUI();
  }
});



function signOut() {
  firebase.auth().signOut().then(() => {
    showLoginUI();
  }).catch((error) => {
    console.error("Something bad happened");
  });
}



app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

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

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
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

console.log('Listening on 8888');
app.listen(8888);


