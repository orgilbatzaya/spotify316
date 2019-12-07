
const functions = require('firebase-functions');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');


// Firebase Setup
const admin = require('firebase-admin');
const serviceAcc = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAcc),
  databaseURL: 'https://spotify316-40ea2.firebaseio.com'
});
const db = admin.firestore();

// Spotify OAuth 2 setup
// TODO: Configure the `spotify.client_id` and `spotify.client_secret` Google Cloud environment variables
const SpotifyWebApi = require('spotify-web-api-node');
const Spotify = new SpotifyWebApi({
  clientId: 'c78526ebdf26433cbb293f2dc1fa32e6',
  clientSecret: '7a6b0c4952c74b4293813ceb82046092',
  redirectUri: 'http://localhost:5000/popup.html'//'https://spotify316-40ea2.firebaseapp.com/popup.html' // 'Your redirect uri

});
// Scopes to request.
const OAUTH_SCOPES = ['user-read-private', 'user-read-email', 'user-top-read','user-read-recently-played',
          'user-library-read','user-follow-read','user-follow-modify'];

// var client_id = 'c78526ebdf26433cbb293f2dc1fa32e6';//'efa17a8f851d4bea93553ea7e2610eb0'; // Your client id
// var client_secret = '7a6b0c4952c74b4293813ceb82046092';//'27a6fe62777a4de6855b83f62e1367a0'; // Your secret
// var redirect_uri = 'http://localhost:5000/callback';//'https://spotify316-40ea2.firebaseapp.com/callback'; // 'Your redirect uri


var global_access_tok = '';
var spotify_id = ''


function createFirebaseToken(spotifyID) {
  // The uid we'll assign to the user.
  const uid = `spotify:${spotifyID}`;
  // Create the custom token.
  return admin.auth().createCustomToken(uid);
}

var stateKey = '__session';// used to be 'spotify_auth_state' but google only recognizes __session

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');

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
        		users: users,
            access_token: global_access_tok,
            db:db
    		});

			
		})
		.catch(err => {
			console.error('Error getting documents',err);
			process.exit();
		})      
});



app.get('/discover', function(req, res) {
	
});
app.get('/home', function(req,res) {
  console.log('TEST');
  res.send("TEST");
  pullData();
})

function pullData(){
  //var access_token = global_access_tok;
  console.log(admin.auth().getCurrentUser().uid);
  console.log("PLEASE");
  console.log(access_token);
  //************USER INFO REQUEST************//
  // use the access token to access the Spotify Web API
  // put user profile info in database
  var profile = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  request.get(profile, function(error, response, body) {
    var user = body;
    var uid = user.id;
    // reformat user JSON object when storing in firebase
    var user_info_text ='{"Name":"' + user.display_name +'",' +
    '"User ID":"' + user.id +'",' +
    '"Email":"' + user.email +'",' +
    '"Country":"' + user.country +'"}';
    var user_info = JSON.parse(user_info_text);
    // create new doc in Firebase with Spotify uid as doc name 
    db.collection("users").doc(uid.toString()).set({
      user: user_info,
      playlists: "",
      tracks: "",
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
    });
    }
  });

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /spotifyAccessToken/$uid
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(spotifyID, displayName, photoURL, email, accessToken) {
  // The UID we'll assign to the user.
  const uid = `spotify:${spotifyID}`;

  // Save the access token to the Firebase Realtime Database.
  const databaseTask = admin.database().ref(`/spotifyAccessToken/${uid}`).set(accessToken);

  // Create or update the user account.
  const userCreationTask = admin.auth().updateUser(uid, {
    displayName: displayName,
    photoURL: photoURL,
    email: email,
    emailVerified: true,
  }).catch((error) => {
    // If user does not exists we create it.
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: uid,
        displayName: displayName,
        photoURL: photoURL,
        email: email,
        emailVerified: true,
      });
    }
    throw error;
  });

  // Wait for all async tasks to complete, then generate and return a custom auth token.
  await Promise.all([userCreationTask, databaseTask]);
  // Create a Firebase custom auth token.
  const token = await admin.auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return token;
}

/**
 * Redirects the User to the Spotify authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.https.onRequest((req,res) => {
  cookieParser()(req,res, () => {
    const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
    res.cookie(stateKey,state.toString());
    const authorizeURL = Spotify.createAuthorizeURL(OAUTH_SCOPES,state.toString());
    console.log(Spotify.getRedirectURI());

    res.redirect(authorizeURL);
  });
});




exports.token = functions.https.onRequest((req,res) => {
  try{
    cookieParser()(req,res,() => {
      console.log('Received verification state: ', req.cookies[stateKey]);
      console.log('Received state: ',req.query.state);
      if (!req.cookies[stateKey]) {
        throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
      } else if (req.cookies[stateKey] !== req.query.state) {
        throw new Error('State validation failed');
      }
      console.log('Received auth code: ',req.query.code);
      Spotify.authorizationCodeGrant(req.query.code,(error,data) => {
        if(error){
          throw error;
        }
        console.log('Received Access Token: ',data.body['access_token']);
        Spotify.setAccessToken(data.body['access_token']);
        global_access_tok = data.body['access_token'];

        Spotify.getMe(async (error,userResults) => {
          if(error){
            throw error;
          }
          console.log('Auth code exchange result received: ',userResults);
          // We have a Spotify access token and user identity now
          const accessToken = data.body['access_token'];
          const refreshToken = data.body['refresh_token'];
          const spotifyUserID = userResults.body['id'];
          const profilePic = userResults.body['images'][0]['url'];
          const userName = userResults.body['display_name'];
          const email = userResults.body['email'];

          // Create a Firebase account and get the Custom Auth Token.
          const firebaseToken = await createFirebaseAccount(spotifyUserID, userName, profilePic, email, accessToken);
          // Serve an HTML page that signs the user in and updates the user profile.
          spotify_id = spotifyUserID;
          res.jsonp({token: firebaseToken});

          

        });
      });
    });
  } catch(error){
    console.log("EORRRR");
    return res.jsonp({error:error.toString});
  }
  return null;
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

