require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');

// DB Schema
const Meeting = require('./src/model/meeting.js').Meeting;
const Event = require('./src/model/event.js').Event

const app = express();
app.use(cors({origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true})); 
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
  app.listen(3000, () => console.log('Server running at 3000'));
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
        res.redirect(`http://localhost:3001/${id}`);
      });
    });
  });
});

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

// API route for adding user events to the meeting
app.post('/api/addCalendar', isAuthenticated, async (req, res) => { // Route only accessible if user is authenticated

  const {calendarId, meetingId} = req.body;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  let calData = {};

  calendar.events.list({
    calendarId: calendarId,

  }, async (err, response) => {
    if (err) {
      console.error('Can\'t fetch events');
      res.status(500).send('Error');
      console.log(err);
      return;
    }

    calData = response.data.items;

    const meeting = await Meeting.findOne({ id: meetingId });

    if (!meeting)
    {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    let allEvents = [];

    for (let i = 0; i < calData.length; i++)
    {
      let eventData = calData[i];

      const start = eventData.start;
      const end = eventData.end;

      const event = new Event({eventName: eventData.summary, start: start, end: end});
      event.save();
      allEvents.push(event);
    }
    
    const email = calData[0].creator.email;


    // Possibly reimplement read personIndex

    let personInDatabase = false;
    for (let i = 0; i < meeting.calendars.length; i++)
    {
      const eachPerson = meeting.calendars[i]
      if ("personName" in eachPerson && eachPerson.personName === email)
      {
        personInDatabase = true;
      }
    }

    console.log(email + " " + allEvents + "\n\n\n");

    if (personInDatabase)
    {
      console.log(meeting._id);
      Meeting.updateOne({ _id: meeting._id}, 
        { $push: {"calendars.$[personObj].personCalendar": {calendarId: calendarId, events: allEvents}}},
        {arrayFilters: [{"personObj.personName": email}]}).catch(err => {
        console.error(err);
      });
    } else {
      Meeting.updateOne({ _id: meeting._id},
      { $push: {"calendars": {personName: email, personCalendar: [{calendarId: calendarId, events: allEvents}]}}}).catch (err => {
        console.error(err);
      });
    }


    res.end();
    
  });


});

// Route to list all calendars
app.get('/api/getCalendars', isAuthenticated, (req, res) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      res.status(500).send('Error');
      return;
    }
    res.json(response.data.items);
  });
});

// Route to list events from a specified calendar
app.get('/events', (req, res) => {
  const calId = req.query.calendar ?? 'primary';
  console.log(calId);
  console.log(typeof calId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.events.list({
    calendarId: calId,

  }, (err, response) => {
    if (err) {
      console.error('Can\'t fetch events');
      res.status(500).send('Error');
      console.log(err);
      return;
    }

    res.json(response.data.items);
    console.log(response.data.items)

    
  });
});
