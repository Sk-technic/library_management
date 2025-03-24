const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const db  = require('../config/db')
const path = require('path');
const checkLibrarian = require('../middleware/admin');
const fs = require("fs"); 



// Login Page Route



router.get('/login', (req, res) => {
    console.log("check user logging : ",req.session.user);
    if (req.session.user && !req.query.new) {
      return  res.redirect('/dashboard')
    }
        res.render('login', { title: "Login", content: 'login' });
});

// Register Page Route
router.get('/register', (req, res) => {
    res.render('register', { title: 'Register',content: 'register' });  // Just send title
});

router.get('/unauthorized',(req,res)=>{
    res.status(403).render("unauthorized", { user: req.session.user });
})


router.get(['/dashboard', '/dashboard/addbooks'], async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login'); // Redirect if not authenticated
        }

        const user = req.session.user; // Get logged-in user
        const route = req.path.includes("addbooks") ? "addbooks" : "dashboard";

        let users = [];
        let borrowedBooks = [];

        if (user.role === 'student') {
            try {
                // Fetch books that the student has borrowed but not returned
                [borrowedBooks] = await db.query(
                    `SELECT books.id, books.title, books.author, books.isbn, borrowed_books.return_date, borrowed_books.borrow_date, borrowed_books.status
                     FROM borrowed_books
                     JOIN books ON borrowed_books.book_id = books.id
                     WHERE borrowed_books.user_id = ?`,
                    [user.id]
                );
            } catch (error) {
                console.error("Error fetching borrowed books:", error);
            }
        }

        // Fetch all users (only for main dashboard view)
        if (route === "dashboard") {
            [users] = await db.query("SELECT id, name, email, profile_picture, role FROM users");
        }

        res.render('dashboard', {
            title: "Dashboard",
            content: 'dashboard',
            user: user,
            users: users, // Only if on dashboard
            borrowedBooks: borrowedBooks, // Only if user is a student
            route: route,
            check: req.session.user,
            session: req.session 
        });
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.status(500).send("<h2>Internal Server Error</h2>");
    }
});

// Handle Login Form Submission (Example)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
       

        // Find user by email
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).send('<h2>Invalid email or password. <a href="/login">Try again</a></h2>');
        }

        const user = rows[0];

        // Check password with bcrypt
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).send('<h2>Invalid email or password. <a href="/login">Try again</a></h2>');
        }
        // login successfull

            req.session.user = { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                profile_picture: user.profile_picture,
                role: user.role   
                  };
               
                  console.log("User logged in:", req.session.user);

                  req.session.user = user; 
              
                    return res.redirect("/dashboard");
       
                //login error 
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).send('<h2>Internal Server Error</h2>');
    }
});



// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Folder where images will be saved
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Use path module
    }
});

const upload = multer({ storage: storage });

// **Logout Route**
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        console.log("logout successfull..");
        setTimeout(()=>{
            res.redirect("/login"); // Redirect to home page after logout
        },2000)
    });
});


// Handle Register Form Submission (Example)
router.post('/register',upload.single('profilePicture'), async (req, res) => {
    const { name, email, password,role } = req.body;
    const profilePicture = req.file ? req.file.filename : null; // Store file path
    console.log(profilePicture);
    
    
    try {
        // Check if the user already exists
        const [existingUser] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).send('<h2>Email already registered. <a href="/register">Try again</a></h2>');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert  into database
        await db.query(
            "INSERT INTO users (name, email, password, profile_picture, role) VALUES (?, ?, ?, ?, ?)", 
            [name, email, hashedPassword, profilePicture, role || "user"]
        );
            
            res.send('<h2>Registration Successful! <a href="/login">Login Now</a></h2>');
            res.send(
                console.log("user register successfully...")
                
            )
          

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).send('<h2>Internal Server Error</h2>');
    }
});



// Edit Profile Page Route (GET)
router.get("/edit-profile", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect if not logged in
    }
    res.render("edit-profile", {
        title: "Edit Profile",
        content: "edit-profile",
        user: req.session.user, // Pass user data to the template
    });
});



// Delete profile picture route

// Delete profile picture route
router.get("/users/delete-profile-picture", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect if not logged in
    }

    const userId = req.session.user.id; // Get logged-in user ID

    try {
        // Get the current profile picture filename from DB
        const [user] = await db.query("SELECT profile_picture FROM users WHERE id = ?", [userId]);

        if (!user.length || !user[0].profile_picture) {
            return res.redirect("/edit-profile"); // No profile picture to delete
        }

        const profilePicture = user[0].profile_picture;
        const filePath = path.join(__dirname, "../uploads", profilePicture); // Adjust path if needed

        // Delete the image file from the server
        fs.unlink(filePath, (fileErr) => {
            if (fileErr && fileErr.code !== "ENOENT") {
                console.error("Error deleting file:", fileErr);
            }
        });

        // Remove profile picture from the database
        await db.query("UPDATE users SET profile_picture = NULL WHERE id = ?", [userId]);

        // Update session user object
        req.session.user.profile_picture = null;

        res.redirect("/edit-profile"); // Redirect back to profile edit page
    } catch (error) {
        console.error("Error deleting profile picture:", error);
        res.status(500).send("<h2>Internal Server Error</h2>");
    }
});


// Handle Profile Update (POST)
router.post("/edit-profile", upload.single("profilePicture"), async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect if not logged in
    }

    const { name, email } = req.body;
    const userId = req.session.user.id;
    let profilePicture = req.session.user.profile_picture; // Keep existing picture

    if (req.file) {
        profilePicture = req.file.filename; // If a new file is uploaded, update it
    }

    try {
        // Update user info in the database
        await db.query(
            "UPDATE users SET name = ?, email = ?, profile_picture = ? WHERE id = ?",
            [name, email, profilePicture, userId]
        );

        // Update session data with new values
        req.session.user.name = name;
        req.session.user.email = email;
        req.session.user.profile_picture = profilePicture;

        res.redirect("/dashboard"); // Redirect back to dashboard after update
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).send("<h2>Internal Server Error</h2>");
    }
});


//delete student route
router.get('/delete-student/:id',checkLibrarian, async (req, res) => {
    const studentId = req.params.id;

    try {
        // Check if the user exists and is a student
        const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND role = "student"', [studentId]);

        if (rows.length === 0) {
            return res.status(403).send('<h2>Unauthorized or Student Not Found.</h2>');
        }

        // Delete the student from the database
        await db.query('DELETE FROM users WHERE id = ?', [studentId]);

        console.log(`Student with ID ${studentId} deleted.`);
        res.redirect('/home'); // Redirect back to dashboard
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).send('<h2>Internal Server Error</h2>');
    }
});




module.exports = router;
