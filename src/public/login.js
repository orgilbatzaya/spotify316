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


    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signInButtonTop.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.playlists.addEventListener('click', this.analyzePlaylists.bind(this));
    
    //chart event listeners
    this.recentButton.addEventListener('click', this.recentChart.bind(this));
    //this.artistButton.addEventListener('click', this.artistChart.bind(this));
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
  var uid = user.uid.split(':')[1];
  var db = firebase.firestore();
  var docRef = db.collection("users").doc(`${uid}`);
  var playlistsBottom = this.playlistsBottom;

  docRef.get().then(function(doc) {
      if (doc.exists) {
          var stuff = doc.data().playlists;
          var myPlaylists = '';
          var myPlaylists = []
          for(var i = 0; i < stuff.length; i++){
            console.log(stuff[i].name);
            myPlaylists += stuff[i].name + ' ';
          }
          playlistsBottom.innerText = myPlaylists;

      } else {
      console.log("No such document!");
      }
  }).catch(function(error) {
      console.log("Error getting document:", error);
  });

  //TODO: fully parse playlists and generate visuals using chartjs
};

//recent tracks data visualization
Demo.prototype.recentChart = function() {


  console.log("you've clicked #1");
  var user = firebase.auth().currentUser;
  var uid = user.uid;
  var db = firebase.firestore();

  
  console.log(uid);

	db.collection('recenttracks').doc(uid).get().then((docRef) => {
    
    
    console.log(docRef.data().agg_features);
    users.push(docRef.data().agg_features['acousticness']);
    users.push(docRef.data().agg_features['danceability']);
    users.push(docRef.data().agg_features['energy']);
    users.push(docRef.data().agg_features['instrumentalness']);
    users.push(docRef.data().agg_features['speechiness']);
    users.push(docRef.data().agg_features['valence']);

    console.log(users);
    })
    .catch(function(error) {
      console.log("Error getting documents: ", error);
  });

  var ctx = document.getElementById("chart-area").getContext('2d');

  var myChart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: ["acousticness", "danceability", "energy", "instrumentalness", " spechiness", "valence"],
      datasets: [
        {
          label: "Population (millions)",
          backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
          data: users
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Predicted world population (millions) in 2050'
      }
    }
  });
};


Demo.prototype.artistChart = function() {
  console.log("You've clicked button #2");
};


new Demo();