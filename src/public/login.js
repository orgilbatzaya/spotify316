var oauthTemplate = Handlebars.getTemplate('oauth-template');
var userProfileTemplate = Handlebars.getTemplate("user-profile-template");
var topArtistsTemplate = Handlebars.getTemplate('top-artists-template');
var topTracksTemplate = Handlebars.getTemplate('top-tracks-template');

function Demo(){
  document.addEventListener('DOMContentLoaded', function() {
    this.signInButton = document.getElementById('sign-in-button');
    this.signInButtonTop = document.getElementById('sign-in-button-top');
    this.signOutButton = document.getElementById('sign-out-button');
    this.recentButton = document.getElementById('tab-button-one');
    this.artistButton = document.getElementById('tab-button-two');
    // this.playlistButton = document.getElementById('tab-button-three');

    // this.signedOutCard = document.getElementById('demo-signed-out-card');
    // this.signedInCard = document.getElementById('demo-signed-in-card');
    this.userProfilePlaceholder = document.getElementById('user-profile');
    this.topArtistsPlaceholder = document.getElementById('topartists');
    this.topTracksPlaceholder = document.getElementById('toptracks');
    this.oauthPlaceholder = document.getElementById('oauth');

    this.playlists = document.getElementById('playlists');
    this.playlistsBottom = document.getElementById('playlists-bottom');
    this.recentText = document.getElementById('p-1');

    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signInButtonTop.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.playlists.addEventListener('click', this.analyzePlaylists.bind(this));
    
    //chart event listeners
    this.recentButton.addEventListener('DOMContentLoaded', this.recentChart.bind(this));
    this.artistButton.addEventListener('click', this.artistChart.bind(this));
    // this.playlistButton.addEventListener('click', this.playlistButton.bind(this));

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
	  
    localStorage.setItem('access_token', access_token);
	  
     //fill in users profile
    const user_profile = await firebase.firestore().collection('users').doc(user.uid).get();
    console.log(user_profile.data());
    userProfilePlaceholder.innerHTML = userProfileTemplate(user_profile.data());

   //fill in users top artists
    const top_artists = await firebase.firestore().collection('topartists').doc(user.uid).get();
    topArtistsPlaceholder.innerHTML = topArtistsTemplate(top_artists.data());
   
   //fill in users top trackcs
    const top_tracks = await firebase.firestore().collection('toptracks').doc(user.uid).get();
    topTracksPlaceholder.innerHTML = topTracksTemplate(top_tracks.data());


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

//recent tracks data visualization

Demo.prototype.recentChart = function() {
    var userTracks = {
      acousticness:0,
      danceability:0,
      energy:0,
      instrumentalness:0,
      speechiness:0,
      valence:0 
    }; 

    console.log("you've clicked #1");
    var user = firebase.auth().currentUser;
    var uid = user.uid;
    var db = firebase.firestore();

    console.log(uid);

	db.collection('recenttracks').doc(uid).get().then(function(doc) {
    userTracks.acousticness += doc.data().agg_features.acousticness;
    userTracks.danceability += doc.data().agg_features.danceability;
    userTracks.energy += doc.data().agg_features.energy;
    userTracks.instrumentalness += doc.data().agg_features.instrumentalness;
    userTracks.speechiness += doc.data().agg_features.speechiness;
    userTracks.valence += doc.data().agg_features.valence;
    console.log([userTracks.acousticness, userTracks.danceability, userTracks.energy, userTracks.instrumentalness, userTracks.speechiness, userTracks.valence]);
   
    var ctx = document.getElementById("chart-area").getContext('2d');

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['acousticness', 'danceability', 'energy', 'instrumentalness', 'speechiness', 'valence'],
            datasets: [{
                data: [userTracks.acousticness, userTracks.danceability, userTracks.energy, userTracks.instrumentalness, userTracks.speechiness, userTracks.valence],
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
          legend: { display: false },
          title: {
            display: true,
            text: 'Recent Track Qualities'
          },
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


    };

Demo.prototype.artistChart = function() {
  var userTracks = {
    acousticness:0,
    danceability:0,
    energy:0,
    instrumentalness:0,
    speechiness:0,
    valence:0 
  }; 

  console.log("you've clicked #2");
  var user = firebase.auth().currentUser;
  var uid = user.uid;
  var db = firebase.firestore();

  console.log(uid);

db.collection('toptracks').doc(uid).get().then(function(doc) {
  userTracks.acousticness += doc.data().agg_features.acousticness;
  userTracks.danceability += doc.data().agg_features.danceability;
  userTracks.energy += doc.data().agg_features.energy;
  userTracks.instrumentalness += doc.data().agg_features.instrumentalness;
  userTracks.speechiness += doc.data().agg_features.speechiness;
  userTracks.valence += doc.data().agg_features.valence;
  console.log([userTracks.acousticness, userTracks.danceability, userTracks.energy, userTracks.instrumentalness, userTracks.speechiness, userTracks.valence]);
 
  var ctx = document.getElementById("two-chart").getContext('2d');

  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['acousticness', 'danceability', 'energy', 'instrumentalness', 'speechiness', 'valence'],
          datasets: [{
              data: [userTracks.acousticness, userTracks.danceability, userTracks.energy, userTracks.instrumentalness, userTracks.speechiness, userTracks.valence],
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
        legend: { display: false },
        title: {
          display: true,
          text: 'Top Track Qualities'
        },
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

};


new Demo();