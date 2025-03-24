const express = require('express');
const router = express.Router();
const db  = require('../config/db')

router.get('/', (req, res) => {
    // console.log("from / route ",req.session.user);
    
    res.render('home', {
        title: "home",
        content: '<h1>Welcome to the Library</h1>', });

});
router.get("/home", async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, name, email, profile_picture,role FROM users");
        console.log(users);

        res.render('home', {
            title: "home",
            content: 'home',
            users:users
         });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("<h2>Internal Server Error</h2>");
    }
});




module.exports = router;
