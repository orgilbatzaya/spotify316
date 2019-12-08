var newReleasesTemplate = Handlebars.getTemplate('new-releases-template');
var discoverTemplate = Handlebars.getTemplate('discover-template')
document.addEventListener('DOMContentLoaded', async function() {
    
	var newReleasesPlaceholder = document.getElementById('newReleases');
  var discoverPlaceholder = document.getElementById('discovercontent')
	//var newReleasesPlaceholder = this.newReleasesPlaceholder;

//    var auth = await firebase.auth();
//	var user = auth.currentUser;
	console.log("HIII");
//	console.log(user);
//	var ref = firebase.database().ref(`/spotifyAccessToken/${user.uid}`)
//    const snapshot = await ref.once('value');
    var access_token = localStorage.getItem('access_token');

	$.ajax({ // fill in users top tracks
        url: 'https://api.spotify.com/v1/browse/new-releases',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
			console.log(response.albums);
          newReleasesPlaceholder.innerHTML = newReleasesTemplate(response);
        }
    });

  $.ajax({ // fill in users recommendations
        url: 'https://api.spotify.com/v1/browse/featured-playlists',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
      console.log(response.playlists.items);
          discoverPlaceholder.innerHTML = discoverTemplate(response);
        }
    });


  
  });


