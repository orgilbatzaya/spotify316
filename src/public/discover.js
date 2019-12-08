var newReleasesTemplate = Handlebars.getTemplate('new-releases-template');

document.addEventListener('DOMContentLoaded', async function() {
    
	var newReleasesPlaceholder = document.getElementById('newReleases');

//    var auth = await firebase.auth();
//	var user = auth.currentUser;
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


  
  });


