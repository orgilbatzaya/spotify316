
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
  redirectUri: 'http://localhost:9000/popup.html'//'https://spotify316-40ea2.firebaseapp.com/popup.html' // 'Your redirect uri

});
// Scopes to request.
const OAUTH_SCOPES = ['user-read-private', 'user-read-email', 'user-top-read','user-read-recently-played',
          'user-library-read','user-follow-read','user-follow-modify'];



var global_access_tok = '';
var spotify_id = ''

function createFirebaseToken(spotifyID) {
  // The uid we'll assign to the user.
  const uid = `${spotifyID}`;
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



app.get('/matches', async function(req, res) {

	const users = [];
	
	const userData = await db.collection('users').get();
	const docs = userData.docs;
	for(let i = 0; i < docs.length; i++){
		var person = {
			user_info: {},
			recent_tracks: {},
			top_tracks: {}
		}
		person.user_info = docs[i].data();
		
		var recentTracksData = await db.collection('recenttracks').doc(docs[i].id).get();
		person.recent_tracks = recentTracksData.data();
		
		var topTracksData = await db.collection('toptracks').doc(docs[i].id).get();
		person.top_tracks = topTracksData.data();
		users.push(person);
	}
	
//	db.collection('recenttracks').get()
//		.then(snapshot => {
//			snapshot.forEach(doc => {
//				var rtrack = doc.data();
//				//console.log(rtrack);
//				recentTracks.push(rtrack);
//			});
//		})
//		.catch(err => {
//			console.error('Error getting documents',err);
//			process.exit();
//		})  
//	
//	db.collection('toptracks').get()
//		.then(snapshot => {
//			snapshot.forEach(doc => {
//				var ttrack = doc.data();
//				//console.log(ttrack);
//				topTracks.push(ttrack);
//			});
//		})
//		.catch(err => {
//			console.error('Error getting documents',err);
//			process.exit();
//		})
				
	res.render('matches', {
		users: users,
        access_token: global_access_tok,
        db:db
	});

	
});



app.get('/discover', function(req, res) {
	
});
app.get('/home', function(req,res) {
  console.log('TEST');
  res.send("TEST");
  pullData();
})



async function pullData(spotifyID,access_token){  
  //************USER INFO UPDATE************//
  // use the access token to access the Spotify Web API
  // put user profile info in database
  const uid = `${spotifyID}`;
  await admin.database().ref(`/spotifyAccessToken/${uid}`).set(access_token);

  Spotify.getMe(async (error,userResults) => {
      if(error){
        throw error;
      }
      console.log('user received: ',userResults);  
      console.log('user id: ',uid);      
    
      const followers = userResults.body['followers'];
      db.collection("users").doc(uid).update({
        followers: followers
      })
      .then(function() {
        console.log("user successfully updated!");
      })
      .catch(function(error) {
        // The document probably doesn't exist.
        console.error("Error updating document: ", error);
      });
    });
  //************PLAYLIST REQUEST************//

  const playData = await Spotify.getUserPlaylists({ limit : 3 });
  const playlists = playData.body.items;
  console.log('Retrieved playlists');
      
  for(var i = 0; i < playlists.length; i++){
    var agg_features = {
      acousticness:0,
      danceability:0,
      energy:0,
      instrumentalness:0,
      speechiness:0,
      valence:0 
    }
    var playlistName = playlists[i].name;
    var playlistID = playlists[i].id;
    console.log('retrieved playlist: ',playlistName);
    
    var tracksData = await Spotify.getPlaylistTracks(playlistID,{ limit : 20 });
    var tracks = tracksData.body.items;
    for(var j = 0; j < tracks.length; j++){
      var trackID = tracks[j].track.id;
      var features;
      var data = await Spotify.getAudioFeaturesForTrack(trackID);
      features = data.body;
      agg_features.acousticness += features.acousticness;
      agg_features.danceability += features.danceability;
      agg_features.energy += features.energy;
      agg_features.instrumentalness += features.instrumentalness;
      agg_features.speechiness += features.speechiness;
      agg_features.valence += features.valence;
    }
    for (let key in agg_features) {
      agg_features[key] = agg_features[key]/tracks.length;
      console.log(key, agg_features[key]);
    }

    await db.collection("playlists").doc(playlistID).set({
      name: playlistName,
      owner: spotifyID,
      agg_features: agg_features
    });
    console.log("playlist saved " + playlistName);

  }
  //************TOP TRACKS REQUEST************//
  const topTrackData = await Spotify.getMyTopTracks({ limit : 10 });
  const topTracks = topTrackData.body.items;
  // console.log("TOP TRACKS RETRIEVED ",topTrackData.body);
  // console.log(topTracks.length);
  var agg_features = {
      acousticness:0,
      danceability:0,
      energy:0,
      instrumentalness:0,
      speechiness:0,
      valence:0 
  }
  var trackList = [];
  for(var k = 0; k < topTracks.length; k++){
    var trackID = topTracks[k].id;
    var trackName = topTracks[k].name;
    var artist = topTracks[k].artists;
    var data = await Spotify.getAudioFeaturesForTrack(trackID);
    var features = data.body;
    agg_features.acousticness += features.acousticness;
    agg_features.danceability += features.danceability;
    agg_features.energy += features.energy;
    agg_features.instrumentalness += features.instrumentalness;
    agg_features.speechiness += features.speechiness;
    agg_features.valence += features.valence;
    trackList.push({id:trackID,name:trackName,artist:artist});
  }
  for (let key in agg_features) {
    agg_features[key] = agg_features[key]/topTracks.length;
    //console.log(key, agg_features[key]);
  }

  await db.collection("toptracks").doc(uid).set({
    tracks:trackList,
    agg_features: agg_features
  });
  console.log("TOP TRACKS SAVED ");

   //************TOP ARTISTS REQUEST************//

  const topArtistData = await Spotify.getMyTopArtists({ limit : 10 });
  const topArtists = topArtistData.body.items;
  // console.log("TOP ARTISTS RETRIEVED ",topArtistData.body);
  // console.log(topArtists.length);
 
  var artistList = [];
  for(var k = 0; k < topArtists.length; k++){
    var artistName = topArtists[k].name;
    artistList.push(artistName);
  }
 
  await db.collection("topartists").doc(uid).set({
    artists:artistList,
  });
  console.log("TOP ARTISTS SAVED ");

  //************RECENTLY PLAYED REQUEST************//

  const recentTrackData = await Spotify.getMyRecentlyPlayedTracks({ limit : 10 });
  const recentTracks = recentTrackData.body.items;
  // console.log("RECENT TRACKS RETRIEVED ",recentTrackData.body);
  // console.log(recentTracks.length);
  var agg_features = {
      acousticness:0,
      danceability:0,
      energy:0,
      instrumentalness:0,
      speechiness:0,
      valence:0 
  }
  var trackList = [];
  for(var k = 0; k < recentTracks.length; k++){
    var trackID = recentTracks[k].track.id;
    var trackName = recentTracks[k].track.name;
    var artist = recentTracks[k].track.artists;
    var data = await Spotify.getAudioFeaturesForTrack(trackID);
    var features = data.body;
    agg_features.acousticness += features.acousticness;
    agg_features.danceability += features.danceability;
    agg_features.energy += features.energy;
    agg_features.instrumentalness += features.instrumentalness;
    agg_features.speechiness += features.speechiness;
    agg_features.valence += features.valence;
    trackList.push({id:trackID,name:trackName,artist:artist});
  }
  for (let key in agg_features) {
    agg_features[key] = agg_features[key]/recentTracks.length;
    //console.log(key, agg_features[key]);
  }

  await db.collection("recenttracks").doc(uid).set({
    tracks:trackList,
    agg_features: agg_features
  });
  console.log("RECENT TRACKS SAVED ");
}
          
  
/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /spotifyAccessToken/$uid
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(spotifyID, displayName, profilePic, email, followers, accessToken) {
  // The UID we'll assign to the user.
  const uid = `${spotifyID}`;

  // Save the access token to the Firebase Realtime Database.
  const databaseTask = admin.database().ref(`/spotifyAccessToken/${uid}`).set(accessToken);

  // Create or update the user account.
  // const userCreationTask = admin.auth().updateUser(uid, {
  //   displayName: displayName,
  //   profilePic: profilePic.url,
  //   email: email,
  //   emailVerified: true,
  // }).catch((error) => {
  //   // If user does not exists we create it.
  //   if (error.code === 'auth/user-not-found') {
  //     return admin.auth().createUser({
  //       uid: uid,
  //       displayName: displayName,
  //       profilePic: profilePic.url,
  //       email: email,
  //       emailVerified: true,
  //     });
  //   }
  //   throw error;
  // });

  const firestoreUserTask = db.collection("users").doc(uid).set({
      name: displayName,
      image: profilePic.url,
      email: email,
      followers: followers,
    })
    .then(function() {
      console.log("User created " + uid);
    })
    .catch(function(error) {
     console.error("Error adding document: ", error);
   });

  // Wait for all async tasks to complete, then generate and return a custom auth token.
  await Promise.all([databaseTask, firestoreUserTask]);
  // Create a Firebase custom auth token.
  const token = await admin.auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return token;
}


app.get('/redirect', function(req, res) {
cookieParser()(req,res, () => {
    const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
    res.cookie(stateKey,state.toString());
    const authorizeURL = Spotify.createAuthorizeURL(OAUTH_SCOPES,state.toString());
    //console.log(Spotify.getRedirectURI());

    res.redirect(authorizeURL);
  });
  
});

app.get('/token', function(req, res) {
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
          const profilePic = userResults.body['images'][0] ? userResults.body['images'][0] : {url:"None"};
          const userName = userResults.body['display_name'];
          const email = userResults.body['email'];
          const followers = userResults.body['followers'];

          // Create a Firebase account and get the Custom Auth Token.
          const firebaseToken = await createFirebaseAccount(spotifyUserID, userName, profilePic, email, followers,accessToken);
          // Serve an HTML page that signs the user in and updates the user profile.
          //pullData(accessToken,spotifyUserID);
          await pullData(spotifyUserID,accessToken);
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

