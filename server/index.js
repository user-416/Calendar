require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const mongoose = require('mongoose');

const path = require('path');
const MemoryStore = require('memorystore')(session)

// DB Schema
const Meeting = require('./src/model/meeting.js').Meeting;
const Event = require('./src/model/event.js').Event

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET, 
  store: new MemoryStore({
    checkPeriod: 1000 * 60 * 60 * 24
  }),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 * 24 // 24hr
  }
}));

const cors = require('cors');
app.use(cors({
  origin: "https://www.schedit.us/",
  credentials: true
}));

// Serve static files from the client/build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// Connect to MongoDB
const dbURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@calcluster.luczgwc.mongodb.net/?retryWrites=true&w=majority&appName=calCluster`;

mongoose.connect(dbURI).then(() => {
  console.log("Connected to DB");
  app.listen(10000, () => console.log('Server running at 10000'));
}).catch(() => {
  console.log("Can't connect to DB");
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Middleware to set up OAuth2 client for authenticated users
function setupOAuth2Client(req, res, next) {
  if (req.session.user) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.SECRET_ID,
      process.env.REDIRECT
    );
    oauth2Client.setCredentials(req.session.user.tokens);
    req.oauth2Client = oauth2Client;
  }
  next();
}

// Route to initiate Google OAuth2 flow
app.get('/login', (req, res) => {
  const {id} = req.query;
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
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
  // Create local client to get tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
  );
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
        authenticated: true,
        tokens: tokens
      };

      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
        }
        res.redirect(`https://www.schedit.us/${id}`);
      });
    });
  });
});

// API route to check authentication status
app.get('/api/auth-status', (req, res) => {
  if (req.session.user) {
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

// API route for creating a meeting
app.post('/api/create', async (req, res) => {
  const {name, dates, startTime, endTime} = req.body;
  if (!name || !dates || !startTime || !endTime) {
    return res.status(400).send('Missing required fields');
  }
  try {
    // Generate meeting id
    const uid = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
    const meeting = new Meeting({ id: uid, name: name, dates: dates, startTime: startTime, endTime: endTime, people: [], events: []});
    await meeting.save();
    res.status(201).send(`/${uid}`);
  } catch (err) {
    res.status(500).send('Error creating event');
  }
});

// API route for checking if a meeting exists
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

// API route for adding/removing user calendars
app.post('/api/toggleCalendar', isAuthenticated, setupOAuth2Client, async (req, res) => {
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
      // Create start and end bounds for Calendar API request
      const start = meeting.dates[0];
      start.setUTCHours(meeting.startTime.substring(0,2));
      start.setUTCMinutes(meeting.startTime.substring(3));
      const end = new Date(meeting.dates[meeting.dates.length-1]);
      end.setUTCHours(meeting.endTime.substring(0,2));
      end.setUTCMinutes(meeting.endTime.substring(3));

      //check if start and end span two days
      const endComparison = new Date(start);
      endComparison.setUTCHours(meeting.endTime.substring(0,2));
      endComparison.setUTCMinutes(meeting.endTime.substring(3));
      console.log(endComparison);
      if(start > endComparison){
        console.log('end on next day');
        end.setDate(end.getDate()+1);
      }
      console.log(start);
      console.log(end);

      // Add calendar + events
      const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
      const calendarResponse = await calendar.events.list({ calendarId: calendarId, 
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        timeZone: 'UTC' });
      const calData = calendarResponse.data.items;
      console.log('calData', calData);

      const allEvents = await Event.insertMany(calData.map(eventData => ({
        eventName: eventData.summary || 'Untitled Event',
        start: eventData.start || {},
        end: eventData.end || {},
        calendarId: calendarId
      })));
      console.log(allEvents);

      if (personIndex !== -1) {
        await Meeting.updateOne(
          { _id: meeting._id, "calendars.personName": email },
          { $push: { "calendars.$.personCalendar": { calendarId, events: allEvents } } }
        );
      } else {
        await Meeting.updateOne(
          { _id: meeting._id },
          { $push: { calendars: { personName: email, personCalendar: [{ calendarId, events: allEvents || [] }] } } }
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
app.get('/api/getAllCalendars', isAuthenticated, setupOAuth2Client, (req, res) => {
  if (!req.oauth2Client) {
    return res.status(401).json({ error: 'OAuth2 client not set up' });
  }
  const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars:', err);
      res.status(500).json({ error: 'Error fetching calendars', details: err.message });
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

// API Route to get all calendars + events in DB
app.get('/api/getAvail', isAuthenticated, async (req, res) => {
  const { meetingId } = req.query;

  try {
    const meeting = await Meeting.findOne({id: meetingId});

    if (!meeting) {
      return res.status(404).json({message: 'Meeting not found'});
    }

    const calendars = meeting.calendars;

    res.json({calendars: calendars});
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error})
  }
});

// API Route to log out of session
app.get('/api/logout', isAuthenticated, async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ message: 'Unable to log out' });
    } else {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    }
  });
});

app.get('/api/people', isAuthenticated, async (req, res) => {
  const {meetingId} = req.query;

  try {
    const meeting = await Meeting.findOne({id: meetingId});

    if(!meeting){
      return res.status(404).json({message: 'Meeting not found'});
    }
    const people = meeting.people;
    res.json({people});
  } catch (error) {
    res.status(500).json({message: 'Interval server error', error: error});
  }
});

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
