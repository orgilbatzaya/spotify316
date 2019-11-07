
$(document).ready(function() {

        /**
         * Obtains parameters from the hash of the URL
         * @return Object
         */
        function getHashParams() {
          var hashParams = {};
          var e, r = /([^&;=]+)=?([^&;]*)/g,
              q = window.location.hash.substring(1);
          while ( e = r.exec(q)) {
             hashParams[e[1]] = decodeURIComponent(e[2]);
          }
          return hashParams;
        }
        var userProfileTemplate = Handlebars.getTemplate("user-profile-template"),
            userProfilePlaceholder = document.getElementById('user-profile');

        var topArtistsTemplate = Handlebars.getTemplate('top-artists-template'),
            topArtistsPlaceholder = document.getElementById('topartists');

        var oauthTemplate = Handlebars.getTemplate('oauth-template'),
            oauthPlaceholder = document.getElementById('oauth');

        var params = getHashParams();

        var access_token = params.access_token,
            refresh_token = params.refresh_token,
            error = params.error;

        if (error) {
          alert('There was an error during the authentication');
        } else {
          if (access_token) {
            // render oauth info
            oauthPlaceholder.innerHTML = oauthTemplate({
              access_token: access_token,
              refresh_token: refresh_token
            });
            console.log(access_token);
            $.ajax({
                url: 'https://api.spotify.com/v1/me/top/artists',
                headers: {
                  'Authorization': 'Bearer ' + access_token
                },
                success: function(response) {
                  topArtistsPlaceholder.innerHTML = topArtistsTemplate(response);

                  // $('#login').hide();
                  // $('#loggedin').show();
                  console.log(response);

                }
            });
            console.log(access_token);

            $.ajax({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                  'Authorization': 'Bearer ' + access_token
                },
                success: function(response) {
                  userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                    console.log("log in success");
                  $('#login').hide();
                  $.fn.fullpage.destroy('all');
                  $('#loggedin').show();

                }
            });

          } else {
              // render initial screen
              console.log("log in failed!");
              $('#login').show();
              $('#loggedin').hide();
          }

          document.getElementById('obtain-new-token').addEventListener('click', function() {
            $.ajax({
              url: '/refresh_token',
              data: {
                'refresh_token': refresh_token
              }
            }).done(function(data) {
              access_token = data.access_token;
              oauthPlaceholder.innerHTML = oauthTemplate({
                access_token: access_token,
                refresh_token: refresh_token
              });
            });
          }, false);
        }
      })();