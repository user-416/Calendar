require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

// DB Schema
const Meeting = require('./src/model/meeting.js')

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Route to initiate Google OAuth2 flow
app.get('/login', (req, res) => {
  const {id} = req.query;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
    state: id 
  });
  res.json({ url });
});

// Route to handle the OAuth2 callback
app.get('/redirect', async (req, res) => {
  const code = req.query.code;
  const id = req.query.state;
  oauth2Client.getToken(code, async (err, tokens) => {
    if (err) {
      console.error('Couldn\'t get token', err);
      res.status(500).send('Error');
      return;
    }
    
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    oauth2.userinfo.get(async (err, response) => {
      if (err) {
        console.error('Error fetching user info', err);
        res.status(500).send('Error');
        return;
      }

      const email = response.data.email;
      if (!email) {
        res.status(500).send('Email not found');
        return;
      }

      // Add user to the database
      // Future - add calendar too
      try {
        const meeting = await Meeting.findOne({ id: id });
        if (meeting) {
          if (!meeting.people.includes(email)) {
            meeting.people.push(email);
            await meeting.save();
          }
          console.log(`Added ${email} to meeting ${id}`);
        } else {
          console.error('Meeting not found');
        }
      } catch (err) {
        console.error('Error updating meeting', err);
      }

      console.log("Successfully logged in with " + email);
      res.redirect(`http://localhost:3001/${id}`);
    });
  });
});

// API route for creating an event
app.post('/api/create', async (req, res) => {
  const {name, dates, startTime, endTime} = req.body;
  if (!name || !dates || !startTime || !endTime) {
    return res.status(400).send('Missing required fields');
  }
  try {
    // Generate random id
    const uid = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
    const meeting = new Meeting({ id: uid, name: name, dates: dates, startTime: startTime, endTime: endTime, people: [] });
    await meeting.save();
    res.status(201).send(`/${uid}`);
  } catch (err) {
    res.status(500).send('Error creating event');
  }
});

// API route for checking if an event exists
app.get('/api/events/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    if (meeting) {
      res.status(200).json(meeting);
    } else {
      res.status(404).json({ message: 'Meeting not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route to list all calendars
app.get('/calendars', (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars', err);
      res.status(500).send('Error');
      return;
    }
    res.json(response.data.items);
  });
});

// Route to list events from a specified calendar
app.get('/events', (req, res) => {
  const calendarId = req.query.calendar ?? 'primary';
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.events.list({
    calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 15,
    singleEvents: true,
    orderBy: 'startTime'
  }, (err, response) => {
    if (err) {
      console.error('Can\'t fetch events');
      res.status(500).send('Error');
      return;
    }
    res.json(response.data.items);
  });
});
