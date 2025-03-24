require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');

// Import Routes
const homeRoutes = require('./routes/homeRoutes');
const authRoutes = require('./routes/authRoutes');
const booksRoutes = require('./routes/booksRoutes');
const studentRoute = require('./routes/studentsRoutes')
const errors = require('./routes/error_Routes');
// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


//session middleware

app.use(session({
    secret: process.env.SECRET_KEY , 
    resave: false,

    saveUninitialized: true,
    cookie: {
        secure: false,  // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 1 day session duration
    }
}));






// Use Routes middlewares
app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/',booksRoutes);
app.use('/',studentRoute);
app.use('/',errors);

app.use('/uploads', express.static('public/uploads'));
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
