

var oauthTemplate = Handlebars.getTemplate('oauth-template');
var userProfileTemplate = Handlebars.getTemplate("user-profile-template");
var topArtistsTemplate = Handlebars.getTemplate('top-artists-template');
var topTracksTemplate = Handlebars.getTemplate('top-tracks-template');

function Demo(){
  document.addEventListener('DOMContentLoaded', function() {
    this.signInButton = document.getElementById('sign-in-button');
    this.signInButtonTop = document.getElementById('sign-in-button-top');
    this.signOutButton = document.getElementById('sign-out-button');

    // this.signedOutCard = document.getElementById('demo-signed-out-card');
    // this.signedInCard = document.getElementById('demo-signed-in-card');
    this.userProfilePlaceholder = document.getElementById('user-profile');
    this.topArtistsPlaceholder = document.getElementById('topartists');
    this.topTracksPlaceholder = document.getElementById('toptracks');
    this.oauthPlaceholder = document.getElementById('oauth');

    this.playlists = document.getElementById('playlists');
    this.playlistsBottom = document.getElementById('playlists-bottom');


    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signInButtonTop.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.playlists.addEventListener('click', this.analyzePlaylists.bind(this));


    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));

  }.bind(this))
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = async function(user) {
  if (user) {
    console.log("log in success");
	$('#login').hide();
    $.fn.fullpage.destroy('all');
    $('#loggedin').show();
    var ref = firebase.database().ref(`/spotifyAccessToken/${user.uid}`)
    const snapshot = await ref.once('value');
    var access_token = snapshot.val();
    var userProfilePlaceholder = this.userProfilePlaceholder;
    var topArtistsPlaceholder = this.topArtistsPlaceholder;
    var topTracksPlaceholder = this.topTracksPlaceholder;
    $.ajax({ // fill in personal details 
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);
            console.log("log in success");
        }
    });
    $.ajax({ // fill in users top artists
        url: 'https://api.spotify.com/v1/me/top/artists',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          topArtistsPlaceholder.innerHTML = topArtistsTemplate(response);
        }
    });
    $.ajax({ // fill in users top tracks
        url: 'https://api.spotify.com/v1/me/top/tracks',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          topTracksPlaceholder.innerHTML = topTracksTemplate(response);
        }
    });
    //this.signedOutCard.style.display = 'none';
    //this.signedInCard.style.display = 'block';
  } else {
    // render initial screen
      console.log("log in failed!");
	 // $('.fullPageIntroInit').fullpage();
	  $('#fullpage').fullpage({
				 //options here
				 autoScrolling:true,
				 scrollHorizontally: true,
				 anchors: ['firstPage', 'secondPage', 'thirdPage'],
				 menu: '#menu'
			 });
      $('#login').show();
      $('#loggedin').hide();
      //this.signedOutCard.style.display = 'block';
      //this.signedInCard.style.display = 'none';
  }
};

// Initiates the sign-in flow using Spotify sign in in a popup.
Demo.prototype.signIn = function() {
  // Open the popup that will start the auth flow.
  window.open('popup.html', 'name', 'height=585,width=400');
};

// Signs-out of Firebase.
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
};


Demo.prototype.analyzePlaylists = function() {
  var user = firebase.auth().currentUser;
  var uid = user.uid;
  var db = firebase.firestore();
  var userPlaylistCount = 0;
  // This variable includes the average of all playlists' features
  var userPlaylistsAggFeatures = {
    acousticness:0,
    danceability:0,
    energy:0,
    instrumentalness:0,
    speechiness:0,
    valence:0 
  };
  var docRef = db.collection('playlists').get().then(function(querySnapshot){
    querySnapshot.forEach(function(doc){
      //console.log(doc.id, '=>', doc.data());
      if (doc.data().owner == uid){
        // Add together aggregate data features, and keep a counter to divide by total number
        userPlaylistsAggFeatures.acousticness += doc.data().agg_features.acousticness;
        userPlaylistsAggFeatures.danceability += doc.data().agg_features.danceability;
        userPlaylistsAggFeatures.energy += doc.data().agg_features.energy;
        userPlaylistsAggFeatures.instrumentalness += doc.data().agg_features.instrumentalness;
        userPlaylistsAggFeatures.speechiness += doc.data().agg_features.speechiness;
        userPlaylistsAggFeatures.valence += doc.data().agg_features.valence;
        userPlaylistCount += 1;
      }
    })
    // Divide by number of user playlists
    userPlaylistsAggFeatures.acousticness /= userPlaylistCount;
    userPlaylistsAggFeatures.danceability /= userPlaylistCount;
    userPlaylistsAggFeatures.energy /= userPlaylistCount;
    userPlaylistsAggFeatures.instrumentalness /= userPlaylistCount;
    userPlaylistsAggFeatures.speechiness /= userPlaylistCount;
    userPlaylistsAggFeatures.valence /= userPlaylistCount;
    console.log(userPlaylistsAggFeatures);
  //return userPlaylistsAggFeatures;
  
  //var myChart = new Chart(ctx, {...});
    var ctx = document.getElementById('myChart').getContext('2d');
      var myChart = new Chart(ctx, {
          type: 'polarArea',
          data: {
              labels: ['acousticness', 'danceability', 'energy', 'instrumentalness', 'speechiness', 'valence'],
              datasets: [{
                  label: 'Average Playlist Qualities',
                  data: [userPlaylistsAggFeatures.acousticness, userPlaylistsAggFeatures.danceability, userPlaylistsAggFeatures.energy, userPlaylistsAggFeatures.instrumentalness, userPlaylistsAggFeatures.speechiness, userPlaylistsAggFeatures.valence],
                  backgroundColor: [
                      'rgba(255, 99, 132, 0.2)',
                      'rgba(54, 162, 235, 0.2)',
                      'rgba(255, 206, 86, 0.2)',
                      'rgba(75, 192, 192, 0.2)',
                      'rgba(153, 102, 255, 0.2)',
                      'rgba(255, 159, 64, 0.2)'
                  ],
                  borderColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)',
                      'rgba(153, 102, 255, 1)',
                      'rgba(255, 159, 64, 1)'
                  ],
                  borderWidth: 1
              }]
          },
          options: {
              scales: {
                  yAxes: [{
                        ticks: {
                          beginAtZero: true
                      }
                  }]
              }
          }
      });

  });


  //TODO: fully parse playlists and generate visuals using chartjs
};

new Demo();

// $(document).ready(function() {

//         /**
//          * Obtains parameters from the hash of the URL
//          * @return Object
//          */
//         function getHashParams() {
//           var hashParams = {};
//           var e, r = /([^&;=]+)=?([^&;]*)/g,
//               q = window.location.hash.substring(1);
//           while ( e = r.exec(q)) {
//              hashParams[e[1]] = decodeURIComponent(e[2]);
//           }
//           return hashParams;
//         }
//         var userProfileTemplate = Handlebars.getTemplate("user-profile-template"),
//             userProfilePlaceholder = document.getElementById('user-profile');

//         var topArtistsTemplate = Handlebars.getTemplate('top-artists-template'),
//             topArtistsPlaceholder = document.getElementById('topartists');
	
// 		var topTracksTemplate = Handlebars.getTemplate('top-tracks-template'),
//             topTracksPlaceholder = document.getElementById('toptracks');

//         var oauthTemplate = Handlebars.getTemplate('oauth-template'),
//             oauthPlaceholder = document.getElementById('oauth');

//         var params = getHashParams();

//         var access_token = params.access_token,
//             refresh_token = params.refresh_token,
//             error = params.error;

//         if (error) {
//           alert('There was an error during the authentication');
//         } else {
//           if (access_token) {
//             // render oauth info
//             oauthPlaceholder.innerHTML = oauthTemplate({
//               access_token: access_token,
//               refresh_token: refresh_token
//             });
//             console.log(access_token);
//             $.ajax({
//                 url: 'https://api.spotify.com/v1/me/top/artists',
//                 headers: {
//                   'Authorization': 'Bearer ' + access_token
//                 },
//                 success: function(response) {
//                   topArtistsPlaceholder.innerHTML = topArtistsTemplate(response);

//                   // $('#login').hide();
//                   // $('#loggedin').show();
//                   console.log(response);

//                 }
//             });
//             console.log(access_token);
			
// 			$.ajax({
//                 url: 'https://api.spotify.com/v1/me/top/tracks',
//                 headers: {
//                   'Authorization': 'Bearer ' + access_token
//                 },
//                 success: function(response) {
//                   topTracksPlaceholder.innerHTML = topTracksTemplate(response);

//                   // $('#login').hide();
//                   // $('#loggedin').show();
//                   console.log(response);

//                 }
//             });
//             console.log(access_token);

//             $.ajax({
//                 url: 'https://api.spotify.com/v1/me',
//                 headers: {
//                   'Authorization': 'Bearer ' + access_token
//                 },
//                 success: function(response) {
//                   userProfilePlaceholder.innerHTML = userProfileTemplate(response);
//                     console.log("log in success");
//                   $('#login').hide();
//                   $.fn.fullpage.destroy('all');
//                   $('#loggedin').show();

//                 }
//             });

//           } else {
//               // render initial screen
//               console.log("log in failed!");
//               $('#login').show();
//               $('#loggedin').hide();
//           }

//           document.getElementById('obtain-new-token').addEventListener('click', function() {
//             $.ajax({
//               url: '/refresh_token',
//               data: {
//                 'refresh_token': refresh_token
//               }
//             }).done(function(data) {
//               access_token = data.access_token;
//               oauthPlaceholder.innerHTML = oauthTemplate({
//                 access_token: access_token,
//                 refresh_token: refresh_token
//               });
//             });
//           }, false);
//         }
//       });