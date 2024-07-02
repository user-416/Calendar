require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

// DB Schema
const Meeting = require('./src/model/meeting.js').Meeting;
const Event = require('./src/model/event.js').Event

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 * 24 // 24hr
  }
}));

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
  app.listen(10000, () => console.log('Server running at 10000'));
}).catch(() => {
  console.log("Can't connect to DB");
});

function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Serve static files from the client/build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

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

      req.session.user = {
        email: email,
        authenticated: true
      };

      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
        }
        // Redirect after successful save
        res.redirect(`https://calendar-bslk.onrender.com/${id}`);
      });
    });
  });
});

// API route to authenticate
app.get('/api/auth-status', (req, res) => {
  if (req.session.user && req.session.user.email && req.session.user.authenticated) {
    res.json({ 
      authenticated: true, 
      user: { 
        email: req.session.user.email 
      } 
    });
  } else {
    res.json({ authenticated: false });
  }
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
    const meeting = new Meeting({ id: uid, name: name, dates: dates, startTime: startTime, endTime: endTime, people: [] , events: []});
    await meeting.save();
    res.status(201).send(`/${uid}`);
  } catch (err) {
    res.status(500).send('Error creating event');
  }
});

// API route for checking if an event exists
app.get('/api/meeting/:id', async (req, res) => {
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

// API route for adding user events to the meeting
app.post('/api/toggleCalendar', isAuthenticated, async (req, res) => {
  const { calendarId, meetingId } = req.body;
  const email = req.session.user.email;

  try {
    const meeting = await Meeting.findOne({ id: meetingId });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if the calendar already exists for this user
    const personIndex = meeting.calendars.findIndex(cal => cal.personName === email);
    const calendarExists = personIndex !== -1 && 
      meeting.calendars[personIndex].personCalendar.some(cal => cal.calendarId === calendarId);

    if (calendarExists) {
      // Remove calendar + events
      await Meeting.updateOne(
        { _id: meeting._id, "calendars.personName": email },
        { $pull: { "calendars.$.personCalendar": { calendarId: calendarId } } }
      );

      await Event.deleteMany({ calendarId: calendarId });

      return res.json({ message: 'Calendar removed successfully', action: 'removed' });
    } else {
      // Add calendar + events
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarResponse = await calendar.events.list({ calendarId: calendarId });
      const calData = calendarResponse.data.items;

      // Don't add empty calendars
      if (calData.length === 0) {
        return res.status(200).json({ message: 'No events found in this calendar', action: 'no_action' });
      }

      const allEvents = await Event.insertMany(calData.map(eventData => ({
        eventName: eventData.summary || 'Untitled Event',
        start: eventData.start || {},
        end: eventData.end || {},
        calendarId: calendarId
      })));

      if (personIndex !== -1) {
        await Meeting.updateOne(
          { _id: meeting._id, "calendars.personName": email },
          { $push: { "calendars.$.personCalendar": { calendarId, events: allEvents } } }
        );
      } else {
        await Meeting.updateOne(
          { _id: meeting._id },
          { $push: { calendars: { personName: email, personCalendar: [{ calendarId, events: allEvents }] } } }
        );
      }

      return res.json({ message: 'Calendar added successfully' });
    }
  } catch (error) {
    console.error('Error in toggleCalendar:', error);
    res.status(500).json({ message: 'Internal server error', error: error });
  }
});

// API route to list all calendars
app.get('/api/getAllCalendars', isAuthenticated, (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      res.status(500).send('Error');
      return;
    }
    res.json(response.data.items);
  });
});

// API Route to get selected calendars for a user
app.get('/api/getCalendars', isAuthenticated, async (req, res) => {
  const { meetingId } = req.query;

  try {
    const meeting = await Meeting.findOne({ id: meetingId });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const userCalendars = meeting.calendars.find(cal => cal.personName === req.session.user.email);

    if (!userCalendars) {
      return res.json({ calendars: [] });
    }

    const selectedCalendars = userCalendars.personCalendar.map(cal => cal.calendarId);

    res.json({ calendars: selectedCalendars });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error });
  }
});

// API Route to get all calenars + events in DB
app.get('/api/getAvail', isAuthenticated, async (req, res) => {
  const { meetingId } = req.query;

  try {
    const meeting = await Meeting.findOne({id: meetingId});

    if (!meeting) {
      return res.status(404).json({message: 'Meeting noit found'});
    }

    const calendars = meeting.calendars;

    res.json({calendars: calendars});
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error})
  }
});

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
