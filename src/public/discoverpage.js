

var discoverTemplate = Handlebars.getTemplate('discovertemplate');
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
    this.discoverPlaceholder = document.getElementById('discoverpages');

    

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
    var discoverPlaceholder = this.discoverPlaceholder;
    var userProfilePlaceholder = this.userProfilePlaceholder;
    var topArtistsPlaceholder = this.topArtistsPlaceholder;
    var topTracksPlaceholder = this.topTracksPlaceholder;
    
    $.ajax({ // fill in personal details 
        url: 'https://api.spotify.com/v1/recommendations',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          discoverPlaceholder.innerHTML = discoverTemplate(response);
            console.log("*************");
        }
    });
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

new Demo();