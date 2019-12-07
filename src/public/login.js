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

//creates charts
Demo.prototype.createChart = function() {
  var dataArr = [];
  var previousVal = '';
  var compareVal ='';
  var chartCount;
  var currentFnD='';
  var ref = firebase.database().ref().orderByChild("foodAndDrinks");

  // Get data function reads the firebase database. Order the data by Child of key foodAndDrinks
  // It then traverses each value in the firebase and 
  // for each record compares if the current value and previous value are same cuisine increments by 1 
  // until all records of that type are counted. 

  // If the search did not include a search for Restaurant or Cuisine then it ignores that record and resets
  // counter to 1. If the values current and previous values do not match. 
  // We set add the 'label and 'value' into an array and set the previousVal to current value of cuisine.
//   function getData() {
      
//       ref.on("child_added", function (snapshot) {
//           var obj = snapshot.val();
//           currentFnd=obj.foodAndDrinks;
//           if (currentFnd === previousVal && typeof obj.foodAndDrinks !=='undefined') {
//               chartCount++;
//               //currentFnD=obj.foodAndDrinks;
//           }
//           else if(typeof obj.foodAndDrinks ==='undefined' || obj.foodAndDrinks === ''){
//               console.log(chartCount, obj.label);
//               chartCount=0;
//           }
//           else if (currentFnd !== previousVal && typeof obj.foodAndDrinks !=='undefined'  || obj.foodAndDrinks !== ' ' || obj.foodAndDrinks !== "null") {
//               chartCount++;
//               dataArr = ({
//                   label: previousVal,
//                   value: chartCount,
//               });
          
//               chartCount = 0;
//               previousVal = obj.foodAndDrinks;
//               //currentFnd=obj.foodAndDrinks;
//           }
      
//         // Verify that values are defined and push data into the chart    
//           if(typeof dataArr.label !== 'undefined' && typeof dataArr.value !=='undefined'){
//              if(dataArr.label !== compareVal){
//                   addData(myChart, dataArr.label, dataArr.value);
//                   compareVal = dataArr.label;
//              }     
             
              
//           }
          
//           // var unique = $.makeArray($(dataArr).filter(function(i,itm){
//           //     return i == $(dataArr).index(itm);
//           // })); 

//       });

//   }

//   window.chartColors = {
//       red: 'rgb(255, 99, 132)',
//       orange: 'rgb(255, 159, 64)',
//       yellow: 'rgb(255, 205, 86)',
//       green: 'rgb(75, 192, 192)',
//       blue: 'rgb(54, 162, 235)',
//       purple: 'rgb(153, 102, 255)',
//       grey: 'rgb(201, 203, 207)'
//   };
// // Initialize the Chart Element on HTML 
//   var ctx = document.getElementById("myChart").getContext("2d");
//   options = {
//       scales: {
//           xAxes: [{
//               barPercentage: 0.5,
//               barThickness: 6,
//               maxBarThickness: 8,
//               minBarLength: 2,
//               gridLines: {
//                   offsetGridLines: true
//               },
//               yAxes: [{
//                   ticks: {
//                       min: 0,
//                       max: 100,
//                       stepSize: 10
//                   }
//               }]
//           }],
//           layout: {
//               padding: {
//                   left: 50,
//                   right: 0,
//                   top: 0,
//                   bottom: 0
//               }
//           }
//       }
//   }
//   // Set the configuration of the Chart elements.
//   // This is where we pass the data we captured from firebase to the chart label and data
//   var config = {
//       type: 'line',
//       data: {
//           labels: dataArr.label,       // value of label retrieved from firebase
//           datasets: [{
//               label: "User Views by Cuisine",
//               backgroundColor: "rgb(255, 159, 64)",
//               borderColor: "rgba(54, 162, 235, 1)",
//               borderWidth: 1,
//               data: dataArr.value     // value of search for each of the array elements
//           }],
//           responsive: true,
//           options: options

//       }
//   };

//   // Create new chart element context with refrence to the HTML element
//   var myChart = new Chart(ctx, config);

 
//   // Put data into the dataset for the chart and update the chart
//   function addData(chart, label, data) {
//       chart.data.labels.push(label);
//       chart.data.datasets.forEach((dataset) => {
//           dataset.data.push(data);
//       });
//       chart.update();
//   }
//   // Call the function which initiates the chart setup
//   getData();
}

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