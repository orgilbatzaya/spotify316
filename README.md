# spotify316

## Overview 
  * Inside the `/src` directory, our projected is segmented into two main subdirectories, `functions` (which holds server side code and configurations) and `public` (which contains static files). This structure is enforced by Firebase Hosting/Functions as it allows for a clean separation of client-side and server-side code. 
  * The main files to look for in functions are `index.js`, which contains the authorization flow and data acquisition from Spotify, and `/views/matches.ejs` which is a server side template EJS (Embedded Javascript) file that contains the UI and logic behind the "matches" feature
  * `/public` contains a variety of HTML/CSS/JS files essential to our UI and also Handlebars templates in `/templates` which offered us a dynamic way to serve static content. 
  * Ignore app.js as we now use /functions/index.js as our main app 
  
## Usage

Our production web application can be found at: https://spotify316-40ea2.firebaseapp.com

In order to make full usage and continue development one can:
 1. clone the project 
 2. download the firebase-tools cli with npm
 3. Create a developer account on Spotify -> create a new project -> obtain a client id and client secret, click edit on the project dashboard and set the redirect uri to `http:localhost:5000/popup.html` for local testing
 4. Near lines 20-21 of functions/index.js replace the clientId and clientSecret fields with your obtained id and secret 
 5. Make sure the redirectUri field in the SpotifyWebApi Constructor ***matches exactly*** the redirect uri you gave when configuring your spotify developer project 
 5. ``npm install`` in the root directory
 5. cd to `/functions` and `npm install` here as well
 6.  cd to `/src` directory and run `firebase serve --only hosting,functions` - this gives you a localhost:5000 to run locally
 
 
## Limitations

* Our current implementation does not scale well to a growing database of users. The "matches" feature will continue to slow down as more users login since the user's data is saved permanently and the app currently scans the entire database each time the "matches" tab is clicked on - Some fixes could include deleting old documents up to some threshold and writing more optimized code
* The "Discover" feature does not analyze and compare any new data with the user's. This would be straightforward if we had more time.
* The "Matches" feature currently does not support the capability to "follow" someone on Spotify
