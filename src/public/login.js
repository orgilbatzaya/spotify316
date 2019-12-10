var oauthTemplate = Handlebars.getTemplate('oauth-template');
var userProfileTemplate = Handlebars.getTemplate("user-profile-template");
var topArtistsTemplate = Handlebars.getTemplate('top-artists-template');
var topTracksTemplate = Handlebars.getTemplate('top-tracks-template');

function Demo(){
  firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  document.addEventListener('DOMContentLoaded', function() {
    this.signInButton = document.getElementById('sign-in-button');
    this.signInButtonTop = document.getElementById('sign-in-button-top');
    this.signOutButton = document.getElementById('sign-out-button');
    this.recentButton = document.getElementById('tab-button-one');
    this.artistButton = document.getElementById('tab-button-two');
    this.topArtistButton = document.getElementById('tab-button-four');
    this.matchesButton = document.getElementById('matches');

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
    this.matchesButton.addEventListener('click',this.goToMatches.bind(this));
    
    //chart event listeners
    
    this.recentButton.addEventListener('click', this.recentChart.bind(this));
    this.artistButton.addEventListener('click', this.artistChart.bind(this));
    this.topArtistButton.addEventListener('click', this.topArtist.bind(this));
    document.addEventListener('load', this.recentChart.bind(this));
  }.bind(this))
}


// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = async function(user) {
  if (user) {
    console.log("log in success");
    window.location.href = '/' + '#' + user.uid;

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
	  localStorage.setItem('uid', user.uid);

	  
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
    
    // window.addEventListener('load', this.recentChart.bind(this));
    this.recentChart();

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

Demo.prototype.goToMatches = function(){
  console.log("current user: ",firebase.auth().currentUser);
  window.location.href = './matches' + '#' + window.location.hash.substring(1);

}

// Initiates the sign-in flow using Spotify sign in in a popup.
Demo.prototype.signIn = function() {
  // Open the popup that will start the auth flow.
  window.open('popup.html', 'name', 'height=585,width=400');
};

// Signs-out of Firebase.
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
};

Demo.prototype.topArtist = function() {

  var user = firebase.auth().currentUser;
  var uid = user.uid;
  var db = firebase.firestore();
  
  db.collection('topartists').doc(uid).get().then(function(doc) {
    for(var i = 1; i <= 10; i++) {
      var name = "li-art-" + i;
      console.log(name);
      document.getElementById(name).innerHTML = doc.data().artists[i-1];
      console.log(doc.data().artists[i-1]);
    }
  });
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
    var userPlaylist1 = {
    acousticness:0,
    danceability:0,
    energy:0,
    instrumentalness:0,
    speechiness:0,
    valence:0 
  };
    var userPlaylist2 = {
    acousticness:0,
    danceability:0,
    energy:0,
    instrumentalness:0,
    speechiness:0,
    valence:0 
  };
    var userPlaylist3 = {
    acousticness:0,
    danceability:0,
    energy:0,
    instrumentalness:0,
    speechiness:0,
    valence:0 
  };
  var chartData = [];
  var docRef = db.collection('playlists').get().then(function(querySnapshot){
    querySnapshot.forEach(function(doc){
      //console.log(doc.id, '=>', doc.data());
      if (doc.data().owner == uid){
        if (userPlaylistCount == 0){
          userPlaylist1.acousticness = doc.data().agg_features.acousticness;
          userPlaylist1.danceability = doc.data().agg_features.danceability;
          userPlaylist1.energy = doc.data().agg_features.energy;
          userPlaylist1.instrumentalness = doc.data().agg_features.instrumentalness;
          userPlaylist1.speechiness = doc.data().agg_features.speechiness;
          userPlaylist1.valence = doc.data().agg_features.valence;
          chartData[0] = {label:doc.data().name, data:[userPlaylist1.acousticness, userPlaylist1.danceability, userPlaylist1.energy, userPlaylist1.instrumentalness, userPlaylist1.speechiness, userPlaylist1.valence], backgroundColor: 'rgba(255, 99, 132, 0.2)'};
        }
        if (userPlaylistCount == 1){
          userPlaylist2.acousticness = doc.data().agg_features.acousticness;
          userPlaylist2.danceability = doc.data().agg_features.danceability;
          userPlaylist2.energy = doc.data().agg_features.energy;
          userPlaylist2.instrumentalness = doc.data().agg_features.instrumentalness;
          userPlaylist2.speechiness = doc.data().agg_features.speechiness;
          userPlaylist2.valence = doc.data().agg_features.valence;
          chartData[1] = {label:doc.data().name, data:[userPlaylist2.acousticness, userPlaylist2.danceability, userPlaylist2.energy, userPlaylist2.instrumentalness, userPlaylist2.speechiness, userPlaylist2.valence], backgroundColor: 'rgba(54, 162, 235, 0.2)'};
        }
        if (userPlaylistCount == 2){
          userPlaylist3.acousticness = doc.data().agg_features.acousticness;
          userPlaylist3.danceability = doc.data().agg_features.danceability;
          userPlaylist3.energy = doc.data().agg_features.energy;
          userPlaylist3.instrumentalness = doc.data().agg_features.instrumentalness;
          userPlaylist3.speechiness = doc.data().agg_features.speechiness;
          userPlaylist3.valence = doc.data().agg_features.valence;
          chartData[2] = {label:doc.data().name, data:[userPlaylist3.acousticness, userPlaylist3.danceability, userPlaylist3.energy, userPlaylist3.instrumentalness, userPlaylist3.speechiness, userPlaylist3.valence], backgroundColor: 'rgba(255, 206, 86, 0.2)'};
        }
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
  chartData[userPlaylistCount] = {label:'Average', data:[userPlaylistsAggFeatures.acousticness, userPlaylistsAggFeatures.danceability, userPlaylistsAggFeatures.energy, userPlaylistsAggFeatures.instrumentalness, userPlaylistsAggFeatures.speechiness, userPlaylistsAggFeatures.valence], backgroundColor: 'rgba(153, 102, 255, 0.2)'};
  
  // Create chart
    var ctx = document.getElementById('myChart').getContext('2d');
      var myChart = new Chart(ctx, {
          type: 'radar',
          data: {
              labels: ['acousticness', 'danceability', 'energy', 'instrumentalness', 'speechiness', 'valence'],
              datasets: chartData
          }
      });

  });

};

//recent tracks data visualization

function recentChart(){
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
 
  if(userTracks.acousticness < 0.5) {
    document.getElementById("p-1").innerHTML = "Your acousticness is " + doc.data().agg_features.acousticness.toFixed(3) + ". " + "Your acousticness is fairly low!"
  }
  else {
    document.getElementById("p-1").innerHTML = "Your acousticness is " + doc.data().agg_features.acousticness.toFixed(3) + ". " + "Your acousticness is really high! Have you been listening to country music lately?"
  }

  if(userTracks.danceability < 0.5) {
    document.getElementById("p-2").innerHTML = "Your danceability is " + doc.data().agg_features.danceability.toFixed(3) + ". " + "The songs you've been listening to have been pretty mellow! They're slow in tempo and have weak beat strength and low rhythm stability."
  }
  else {
    document.getElementById("p-2").innerHTML = "Your danceability is " + doc.data().agg_features.danceability.toFixed(3)  + ". " + "Wow! You must really like dancing! The songs you've been listening to are fast in tempo, high in rhythm stability, and high in beat strength."
  }

  if(userTracks.energy < 0.5) {
    document.getElementById("p-3").innerHTML = "Your energy is " + doc.data().agg_features.energy.toFixed(3) + ". " + "Not a lot of energy lately? Your songs have low intensity and activity - maybe you're listening to a lot of classical music lately?" 
  }
  else {
    document.getElementById("p-3").innerHTML = "Your energy is " + doc.data().agg_features.energy.toFixed(3)  + ". " + "Feeling fast, loud, and noisy? Have you been listening to lots of death metal? Your songs are very high in energy!"
  }

  if(userTracks.instrumentalness < 0.5) {
    document.getElementById("p-4").innerHTML = "Your instrumentalness is " + doc.data().agg_features.instrumentalness.toFixed(3) +". " +  "A lot of your songs don't contain any vocals."
  }
  else {
    document.getElementById("p-4").innerHTML = "Your instrumentalness is " + doc.data().agg_features.instrumentalness.toFixed(3)  + ". " + "You must really like rap or spoken word! Your songs have lots of vocals."
  }

  if(userTracks.speechiness < 0.5) {
    document.getElementById("p-5").innerHTML = "Your speechiness is " + doc.data().agg_features.speechiness.toFixed(3) +". " +  "Your songs most likely represent music and non-speech like tracks."
  }
  else {
    document.getElementById("p-5").innerHTML = "Your speechiness is " + doc.data().agg_features.speechiness.toFixed(3)  +". " +  "Your songs most likely represent tracks made entirely of spoken word. These include talk shows, audio books, or poetry!"
  }

  if(userTracks.valence < 0.5) {
    document.getElementById("p-6").innerHTML = "Your valence is " + doc.data().agg_features.valence.toFixed(3) + ". " + ":( Sorry to hear that you've been listening to a lot of sad music lately. Your songs are correlated with negative feelings like sadness and anger."
    }
  else {
    document.getElementById("p-6").innerHTML = "Your valence is " + doc.data().agg_features.valence.toFixed(3)  +". " +  ":) Happy to hear that you're ina positive mood! Your songs are correlated with happiness and cheerfulness!"
  }

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
  
  db.collection('recenttracks').doc(uid).get().then(function(doc) {
      
    for(var i = 1; i <= 10; i++) {
      var name = "li-" + i;
      console.log(name);
      document.getElementById(name).innerHTML = doc.data().tracks[i-1].name;
      console.log(doc.data().tracks[i-1].name);
    }
  });
}

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

    if(userTracks.acousticness < 0.5) {
      document.getElementById("p-1").innerHTML = "Your acousticness is " + doc.data().agg_features.acousticness.toFixed(3) + ". " + "Your acousticness is fairly low!"
    }
    else {
      document.getElementById("p-1").innerHTML = "Your acousticness is " + doc.data().agg_features.acousticness.toFixed(3) + ". " + "Your acousticness is really high! Have you been listening to country music lately?"
    }
  
    if(userTracks.danceability < 0.5) {
      document.getElementById("p-2").innerHTML = "Your danceability is " + doc.data().agg_features.danceability.toFixed(3) + ". " + "The songs you've been listening to have been pretty mellow! They're slow in tempo and have weak beat strength and low rhythm stability."
    }
    else {
      document.getElementById("p-2").innerHTML = "Your danceability is " + doc.data().agg_features.danceability.toFixed(3)  + ". " + "Wow! You must really like dancing! The songs you've been listening to are fast in tempo, high in rhythm stability, and high in beat strength."
    }
  
    if(userTracks.energy < 0.5) {
      document.getElementById("p-3").innerHTML = "Your energy is " + doc.data().agg_features.energy.toFixed(3) + ". " + "Not a lot of energy lately? Your songs have low intensity and activity - maybe you're listening to a lot of classical music lately?" 
    }
    else {
      document.getElementById("p-3").innerHTML = "Your energy is " + doc.data().agg_features.energy.toFixed(3)  + ". " + "Feeling fast, loud, and noisy? Have you been listening to lots of death metal? Your songs are very high in energy!"
    }
  
    if(userTracks.instrumentalness < 0.5) {
      document.getElementById("p-4").innerHTML = "Your instrumentalness is " + doc.data().agg_features.instrumentalness.toFixed(3) +". " +  "A lot of your songs don't contain any vocals."
    }
    else {
      document.getElementById("p-4").innerHTML = "Your instrumentalness is " + doc.data().agg_features.instrumentalness.toFixed(3)  + ". " + "You must really like rap or spoken word! Your songs have lots of vocals."
    }
  
    if(userTracks.speechiness < 0.5) {
      document.getElementById("p-5").innerHTML = "Your speechiness is " + doc.data().agg_features.speechiness.toFixed(3) +". " +  "Your songs most likely represent music and non-speech like tracks."
    }
    else {
      document.getElementById("p-5").innerHTML = "Your speechiness is " + doc.data().agg_features.speechiness.toFixed(3)  +". " +  "Your songs most likely represent tracks made entirely of spoken word. These include talk shows, audio books, or poetry!"
    }
  
    if(userTracks.valence < 0.5) {
      document.getElementById("p-6").innerHTML = "Your valence is " + doc.data().agg_features.valence.toFixed(3) + ". " + ":( Sorry to hear that you've been listening to a lot of sad music lately. Your songs are correlated with negative feelings like sadness and anger."
      }
    else {
      document.getElementById("p-6").innerHTML = "Your valence is " + doc.data().agg_features.valence.toFixed(3)  +". " +  ":) Happy to hear that you're ina positive mood! Your songs are correlated with happiness and cheerfulness!"
    }

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
    db.collection('recenttracks').doc(uid).get().then(function(doc) {
      
      for(var i = 1; i <= 10; i++) {
        var name = "li-" + i;
        console.log(name);
        document.getElementById(name).innerHTML = doc.data().tracks[i-1].name;
        console.log(doc.data().tracks[i].name);
      }
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
        if(userTracks.acousticness < 0.5) {
          document.getElementById("p-7").innerHTML = "Your acousticness is " + doc.data().agg_features.acousticness.toFixed(3) + ". " + "Your acousticness is fairly low!"
        }
        else {
          document.getElementById("p-7").innerHTML = "Your acousticness is " + doc.data().agg_features.acousticness.toFixed(3) + ". " + "Your acousticness is really high! Have you been listening to country music lately?"
        }

        if(userTracks.danceability < 0.5) {
          document.getElementById("p-8").innerHTML = "Your danceability is " + doc.data().agg_features.danceability.toFixed(3) + ". " + "The songs you've been listening to have been pretty mellow! They're slow in tempo and have weak beat strength and low rhythm stability."
        }
        else {
          document.getElementById("p-8").innerHTML = "Your danceability is " + doc.data().agg_features.danceability.toFixed(3)  + ". " + "Wow! You must really like dancing! The songs you've been listening to are fast in tempo, high in rhythm stability, and high in beat strength."
        }

        if(userTracks.energy < 0.5) {
          document.getElementById("p-9").innerHTML = "Your energy is " + doc.data().agg_features.energy.toFixed(3) + ". " + "Not a lot of energy lately? Your songs have low intensity and activity - maybe you're listening to a lot of classical music lately?" 
        }
        else {
          document.getElementById("p-9").innerHTML = "Your energy is " + doc.data().agg_features.energy.toFixed(3)  + ". " + "Feeling fast, loud, and noisy? Have you been listening to lots of death metal? Your songs are very high in energy!"
        }

        if(userTracks.instrumentalness < 0.5) {
          document.getElementById("p-10").innerHTML = "Your instrumentalness is " + doc.data().agg_features.instrumentalness.toFixed(3) +". " +  "A lot of your songs don't contain any vocals."
        }
        else {
          document.getElementById("p-10").innerHTML = "Your instrumentalness is " + doc.data().agg_features.instrumentalness.toFixed(3)  + ". " + "You must really like rap or spoken word! Your songs have lots of vocals."
        }

        if(userTracks.speechiness < 0.5) {
          document.getElementById("p-11").innerHTML = "Your speechiness is " + doc.data().agg_features.speechiness.toFixed(3) +". " +  "Your songs most likely represent music and non-speech like tracks."
        }
        else {
          document.getElementById("p-11").innerHTML = "Your speechiness is " + doc.data().agg_features.speechiness.toFixed(3)  +". " +  "Your songs most likely represent tracks made entirely of spoken word. These include talk shows, audio books, or poetry!"
        }

        if(userTracks.valence < 0.5) {
          document.getElementById("p-12").innerHTML = "Your valence is " + doc.data().agg_features.valence.toFixed(3) + ". " + ":( Sorry to hear that you've been listening to a lot of sad music lately. Your songs are correlated with negative feelings like sadness and anger."
          }
        else {
          document.getElementById("p-12").innerHTML = "Your valence is " + doc.data().agg_features.valence.toFixed(3)  +". " +  ":) Happy to hear that you're ina positive mood! Your songs are correlated with happiness and cheerfulness!"
        }
  var ctx = document.getElementById("two-chart").getContext('2d');

  for(var i = 1; i <= 10; i++) {
    var name = "li-tracks-" + i;
    console.log(name);
    document.getElementById(name).innerHTML = doc.data().tracks[i-1].name;
    console.log(doc.data().tracks[i-1]);
  }

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