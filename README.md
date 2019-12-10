# spotify316

## Overview 

  * Inside the `/src` directory, our project is segmented into two main subdirectories, `functions` (which holds server side code and configurations) and `public` (which contains static files). This structure is enforced by Firebase Hosting/Functions as it allows for a clean separation of client-side and server-side code. 
  * The main files to look for in functions are `index.js`, which contains the authorization flow and data acquisition from Spotify, and `/views/matches.ejs` which is a server side template EJS (Embedded Javascript) file that contains the UI and logic behind the "matches" feature
  * `/public` contains a variety of HTML/CSS/JS files essential to our UI such as `login.js` or `index.html` and also Handlebars templates in `/templates` which offered us a dynamic way to serve static content. 
  * Ignore app.js as we now use `/functions/index.js` as our main application entry point
  
## Usage

Our production web application can be found at: https://spotify316-40ea2.firebaseapp.com

In order to make full usage and continue development one can:
 1. Clone this project 
 2. Download the Firebase Command Line Tools with npm
 ```bash
npm install -g firebase-tools
```
 3. Create a developer account on Spotify -> create a new project -> obtain a client id and client secret, click edit on the project dashboard and set the redirect uri to `http:localhost:5000/popup.html` for local testing
 4. Near lines 20-21 of `functions/index.js` replace the clientId and clientSecret fields with your obtained id and secret 
 5. On line 22 of the same file, make sure the redirectUri field in the SpotifyWebApi Constructor ***matches exactly*** the redirect uri you gave when configuring your spotify developer project 
 5. Go to line 131 of `/public/popup.html` and change the value of `window.location.href` to `'http://localhost:9000/redirect'`
 5. ``npm install`` in the root directory
 5. cd to `/functions` and `npm install` here as well
 6.  cd to `/src` directory and run `firebase serve --only hosting,functions` - this gives you a localhost:5000 to run locally
 
 
## Limitations

* Our current implementation does not scale well to a growing database of users. The "matches" feature will continue to slow down as more users login since the user's data is saved permanently and the app currently scans the entire database each time the "matches" tab is clicked on - Some fixes could include deleting old documents up to some threshold and writing more optimized code
* The "Discover" feature does not analyze and compare any new data with the user's. This would be straightforward if we had more time.
* The "Matches" feature currently does not support the capability to "follow" someone on Spotify. It is also limited in the fact that the matching algorithm is very basic - simply the cosine similarity between the user's average audio features of their recently listened to tracks/top tracks and those of a selected user. With more time, a more robust algorithm could be developed
