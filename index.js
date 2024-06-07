// Environment variables
require('dotenv').config();

const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const mongoose = require('mongoose');

// DB Schema
const Email = require('./src/public/model/email.js');

const app = express();

// Set up Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
);

// Connect to MongoDB
const dbURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@calcluster.luczgwc.mongodb.net/?retryWrites=true&w=majority&appName=calCluster`;

mongoose.connect(dbURI).then(() => {
    console.log("Connected to DB");

    // Start the Express server
    app.listen(3000, () => console.log('Server running at 3000'));
}).catch(() => {
    console.log("Can't connect to DB");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/public/views'));
app.use(express.static(path.join(__dirname, 'src/public')));

// Landing page
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// Route to initiate Google OAuth2 flow
app.get('/login', (req, res) => {
  // Google authentication URL
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email'] 
  });
  // Redirect the user to Google's OAuth 2.0 server
  res.redirect(url);
});

// Route to handle the OAuth2 callback
app.get('/redirect', async (req, res) => {
  // Extract the code from the query parameter
  const code = req.query.code;
  // Exchange the code for tokens
  oauth2Client.getToken(code, async (err, tokens) => {
    if (err) {
      console.error('Couldn\'t get token', err);
      res.send('Error');
      return;
    }
    
    oauth2Client.setCredentials(tokens);

    // Get the user's email
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    oauth2.userinfo.get(async (err, response) => {
      if (err) {
        console.error('Error fetching user info', err);
        res.send('Error');
        return;
      }

      const email = response.data.email;
      if (!email) {
        res.status(500).send('Email not found');
        return;
      }

      // Check if the email already exists in the database
      const existingEmail = await Email.findOne({ email });
      if (!existingEmail) {
        // Save the email to the database
        const newEmail = new Email({ email });
        await newEmail.save();
      }
      
      res.send('Successfully logged in');
    });
  });
});

// Route to list all calendars
app.get('/calendars', (req, res) => {
  // Create a Google Calendar API client
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  // List all calendars
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars', err);
      res.end('Error!');
      return;
    }
    // Send the list of calendars as JSON
    const calendars = response.data.items;
    console.log(calendars);
    res.json(calendars);
  });
});

// Route to list events from a specified calendar
app.get('/events', (req, res) => {
  // Get the calendar ID from the query string, default to 'primary'
  const calendarId = req.query.calendar ?? 'primary';
  // Create a Google Calendar API client
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  // List events from the specified calendar
  calendar.events.list({
    calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 15,
    singleEvents: true,
    orderBy: 'startTime'
  }, (err, response) => {
    if (err) {
      console.error('Can\'t fetch events');
      res.send('Error');
      return;
    }
    // Send the list of events as JSON
    const events = response.data.items;
    console.log(events);
    res.json(events);
  });
});
