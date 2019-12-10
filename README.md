# spotify316

## Overview 
  * Inside the `/src` directory, our projected is segmented into two main subdirectories, `functions` (which holds server side code and configurations) and `public` (which contains static files). This structure is enforced by Firebase Hosting/Functions as it allows for a clean separation of client-side and server-side code. 
  * The main files to look for in functions are `index.js`, which contains the authorization flow and data acquisition from Spotify, and `/views/matches.ejs` which is a server side template EJS (Embedded Javascript) file that contains the UI and logic behind the "matches" feature
  * `/public` contains a variety of HTML/CSS/JS files essential to our UI and also Handlebars templates in `/templates` which offered us a dynamic way to serve static content. 
  * Ignore app.js as we now use /functions/index.js as our main app 
  
## Usage
A hosted version of our app can be found at: 

In order to make full usage and continue development one can:
 1. clone the project 
 2. download the firebase-tools cli
 3. Create a developer account on Spotify - obtain a client id and client secret, click edit on the dashboard and set redirect uri to `http:localhost:5000/popup.html` for local testing
 4. Near lines 20-21 of functions/index.js replace the clientId and clientSecret properties with your obtained id and secret
 5. ``npm install`` in the root directory
 5. cd to `/functions` and `npm install` here as well
 6. 


## Limitations


o Anylimitationsinyourcurrentimplementation.
