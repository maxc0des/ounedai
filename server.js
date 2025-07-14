const cron = require('node-cron');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const log = require('./logger');
const fs = require('fs');

const app = express();
const http = require('http').createServer(app);

// Middleware setup
app.use(express.json());
app.use(cors());

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return log.error(`Error connecting to database: ${err.message}`);
    }
    log.info('Successfully connected to database');
});

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// Variables
const vars = get_vars();
let working_date = vars.set_working_date;
let last_time = vars.set_last_time;
let current_month = vars.set_current_month;
check_month();

// Generate a random date in the current local month
function generate_date() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-based for num_days
    const num_days = new Date(year, month, 0).getDate();
    const random_day = Math.floor(Math.random() * num_days) + 1;
    const random_date = new Date(year, month - 1, random_day);
    log.info(`Generated new working date: ${random_date.toString()}`);
    return random_date;
}

// Check if the month has changed (in local time)
function check_month() {
    const now = new Date();
    const month = now.getMonth();
    if (month !== current_month || current_month === null) {
        current_month = month;
        working_date = generate_date();
        change_var('current_month', current_month);
        change_var('working_day', working_date);
        //uncomment for debugging:
        //working_date = new Date();
        log.info(`Month changed or initialized. New working date: ${working_date.toString()}`);
    } else {
        log.info('Month unchanged, no new working date generated');
    }
}

//get vars from json, so thy dont get lost if the server restarts
function get_vars(){
    try {
        const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
        const set_working_date = new Date(data.working_day);
        const set_last_time = new Date(data.last_time);
        const set_current_month = typeof data.current_month === 'number'
            ? data.current_month
            : new Date(data.current_month).getMonth();
        return {set_working_date, set_last_time, set_current_month};
    } catch (e) {
        log.warn('data.json nicht gefunden oder fehlerhaft, Standardwerte werden gesetzt');
        const now = new Date();
        return {
            set_working_date: now,
            set_last_time: now,
            set_current_month: now.getMonth()
        };
    }
}

function change_var(variable, value) {
    const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
    data[variable] = value;
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 4));
    log.info(`Updated ${variable} to ${value}`);
}

// Run check_month() every day at midnight local time
cron.schedule('0 0 * * *', () => {
    log.info('Running scheduled month check...');
    check_month();
    if (new Date().getDate() === working_date.getDate()) {
        last_time = new Date();
        change_var('last_time', last_time);
        log.info(`Updated last_time to ${last_time.toString()}`);
    }
});

// Static middleware for conditional content
const dayStatic = express.static(path.join(__dirname, 'public', 'day'));
const nonDayStatic = express.static(path.join(__dirname, 'public', '!day'));

app.use((req, res, next) => {
    log.debug(`Processing request for ${req.url}`);
    const now = new Date();
    const current_day = now.getDate();
    const working_day = working_date.getDate();

    if (current_day === working_day) {
        log.debug(`It's the working date. Serving day content. Last time updated: ${last_time.toString()}`);
        return dayStatic(req, res, next);
    } else {
        log.debug('Not the working date. Serving non-day content.');
        return nonDayStatic(req, res, next);
    }
});

// Submit form data
app.post('/submit', (req, res) => {
    d = new Date();
    if(d.getDate() !== working_date.getDate()) {
        log.warn('Form submission attempted on a non-working date');
        res.status(403).json({ error: 'Form submissions are only allowed on the working date' });
        return;
    }
    log.info('Received form submission');
    log.debug(`Form data: ${JSON.stringify(req.body)}`);

    const { name, message } = req.body;

    if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required' });
    }

    db.run(
        'INSERT INTO users (name, message) VALUES (?, ?)',
        [name, message],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Get guest entries
app.get('/guests', (req, res) => {
    log.info('Received request for guest list');
    db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get last active working date timestamp
app.get('/last-time', (req, res) => {
    log.info('Received request for last_time');
    res.json({ last_time: last_time.toString() });
});

http.listen(3000, () => {
    log.info('Server is running on port 3000');
});