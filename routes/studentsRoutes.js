const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();
const db  = require('../config/db')
const checkStudent = require('../middleware/student');
// Route to get all book details
// GET all book details
router.get('/library-books',checkStudent, async (req, res) => {
    try {
        // Fetch books from database
        const query = `
            SELECT 
                id, title, author, genre, isbn, publication_year, 
                publisher, copies_available, cover_image, created_at 
            FROM books
        `;

        const [books] = await db.query(query);

        // Store books in session
      


        // console.log("book details:  ",req.session.books);
        
        // Render EJS file with books data
        res.render('library_books', {
            title: 'Books',
            content: 'Books',
            books,
            route: req.session.route  // Pass books to template
        });



    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


module.exports = router;