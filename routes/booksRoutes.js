const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const path = require("path");
const checkLibrarian = require('../middleware/admin');
// Get form from add books
// router.get("/addbook", (req, res) => {
//     res.render("addBooks", { title: "Add New Book", content: "AddBooks",user: req.session.user, });
//     console.log(req.session.user);
    
// });

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/covers/"); // Folder where images will be saved
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    }
});

const upload = multer({ storage: storage });

// POST Route to Add a New Book
router.post("/add-book", checkLibrarian, upload.single("cover_image"), async (req, res) => {
    try {
        // Store the file path instead of just the filename
        const coverImage = req.file ? `covers/${req.file.filename}` : null;

        // Extract form data
        const { title, author, genre, isbn, publication_year, publisher, copies_available } = req.body;

        // Validate required fields
        if (!title || !author) {
            return res.status(400).json({ error: "Title and Author are required!" });
        }

        // Insert new book into the database
        const query = `
            INSERT INTO books (title, author, genre, isbn, publication_year, publisher, copies_available, cover_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            title,
            author,
            genre,
            isbn,
            publication_year,
            publisher,
            copies_available || 1,
            coverImage // Store the full image path
        ]);

        console.log("Book added successfully! Cover Image Path:", coverImage);
        res.redirect("/getBooks"); // Redirect back to dashboard
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).send("Internal Server Error");
    }
});



// GET all book details
router.get('/getBooks', checkLibrarian, async (req, res) => {
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
        req.session.books = books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            genre: book.genre,
            isbn: book.isbn,
            publication_year: book.publication_year,
            publisher: book.publisher,
            copies_available: book.copies_available,
            cover_image: book.cover_image
        }));


        // console.log("book details:  ",req.session.books);
        
        // Render EJS file with books data
        res.render('getBooks', {
            title: 'Books',
            content: 'Books',
            books: req.session.books,
            user: req.session.user,
            route: req.session.route  // Pass books to template
        });



    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.get('/deleteBook/:bookId',checkLibrarian, async (req,res)=>{
    console.log(req.params.bookId);
    let bookId = req.params.bookId;

    await db.query(`DELETE FROM books WHERE books.id = ${bookId}`);
    // console.log(result, 'result');
    console.log("book deleted successsfully id: ",bookId );
    
 
    res.redirect('/getBooks')

    
})

// get route to update book details
router.get('/edit-book/:id',checkLibrarian, async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const bookId = req.params.id; // Extract book ID from URL
    console.log("Requested Book ID:", bookId);

    try {
        const [bookResult] = await db.query('SELECT * FROM books WHERE id = ?', [bookId]);
        console.log("Database Query Result:", bookResult);

        if (bookResult.length === 0) {
            return res.status(404).send("Book not found");
        }

        res.render('edit-book', {
            title: "Edit Book",
            book: bookResult[0],
            content: "Edit Book"  // Send book details to EJS
        });

    } catch (error) {
        console.error("Error fetching book details:", error);
        res.status(500).send("Internal Server Error");
    }

});


// 🔹 Edit Book Route (POST)
router.post('/edit-book/:id',checkLibrarian, upload.single('cover_image'), async (req, res) => {
    console.log("Edit Book Route Hit!"); 
    if (!req.session.user) return res.redirect('/login');

    const bookId = req.params.id;
    console.log("Editing Book ID:", bookId);

    // 🔹 Extract Form Data
    const { title, author, genre, isbn, publication_year, publisher, copies_available } = req.body;
    let coverImage = req.file ? `covers/${req.file.filename}` : null;

    console.log("Received Form Data:", req.body);
    console.log("Uploaded Cover Image:", coverImage);

    try {
        // 🔹 Fetch existing book details (to retain old cover image if not changed)
        const [existingBook] = await db.query("SELECT cover_image FROM books WHERE id = ?", [bookId]);
        if (!existingBook.length) {
            return res.status(404).send("Book not found");
        }

        // 🔹 Keep the old cover image if no new image is uploaded
        if (!coverImage) {
            coverImage = existingBook[0].cover_image;
        }

        // 🔹 Update book details in the database
        await db.query(
            `UPDATE books SET title = ?, author = ?, genre = ?, isbn = ?, publication_year = ?, 
            publisher = ?, copies_available = ?, cover_image = ? WHERE id = ?`,
            [title, author, genre, isbn, publication_year, publisher, copies_available, coverImage, bookId]
        );
  

        console.log(`✅ Book ID ${bookId} updated successfully`);

        // Redirect back to books list
        res.redirect('/getBooks');

    } catch (error) {
        console.error("❌ Error updating book details:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/books-allot',checkLibrarian, async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;
    const [books] = await db.query("SELECT * FROM books");
    const [borrowedBooks] = await db.query(
        "SELECT bb.id, b.title, b.author FROM borrowed_books bb JOIN books b ON bb.book_id = b.id WHERE bb.user_id = ? AND bb.status = 'borrowed'", 
        [user.id]
    );

    let users  = [];
      [users] = await db.query("SELECT id, name, email, profile_picture, role FROM users");
    res.render('borrow_return', { title: "Borrow & Return Books",content:'Borrow & Return Books', user, books, borrowedBooks,users:users});

    
});

router.post('/books-borrow',checkLibrarian, async (req, res) => {
    const { user_id, book_id, borrow_date, return_date, status } = req.body;

    try {
        // Check if the book is available
        const [book] = await db.query("SELECT copies_available FROM books WHERE id = ?", [book_id]);
        if (!book.length || book[0].copies_available < 1) {
            return res.status(400).send("Book is not available.");
        }

        // Insert into borrowed_books table
        await db.query(
            "INSERT INTO borrowed_books (user_id, book_id, borrow_date, return_date, status) VALUES (?, ?, ?, ?, ?)",
            [user_id, book_id, borrow_date, return_date || null, status]
        );

        // Update available copies
        await db.query("UPDATE books SET copies_available = copies_available - 1 WHERE id = ?", [book_id]);

        res.redirect('/books-allot'); // Redirect to borrow/return page
    } catch (error) {
        console.error("Error allotting book:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/borrow-details/:userId?', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const userId = req.params.userId || null; // Get userId if provided, otherwise null

    try {
        let borrowedDetails = [];
        
        if (userId) {
            // Fetch borrowed books for the selected user
            [borrowedDetails] = await db.query(`
                SELECT bb.id, u.name AS user_name, u.email, 
                       b.title AS book_title, b.author, 
                       bb.borrow_date, bb.return_date, bb.status
                FROM borrowed_books bb
                JOIN users u ON bb.user_id = u.id
                JOIN books b ON bb.book_id = b.id
                WHERE bb.user_id = ? 
                ORDER BY bb.borrow_date DESC
            `, [userId]);
        } else {
            // Fetch all borrowed books if no user is selected
            [borrowedDetails] = await db.query(`
                SELECT bb.id, u.name AS user_name, u.email, 
                       b.title AS book_title, b.author, 
                       bb.borrow_date, bb.return_date, bb.status
                FROM borrowed_books bb
                JOIN users u ON bb.user_id = u.id
                JOIN books b ON bb.book_id = b.id
                ORDER BY bb.borrow_date DESC
            `);
        }

        // Fetch all users to populate the dropdown
        const [users] = await db.query(`SELECT id, name FROM users`);

        res.render('borrow_details', {
            title: "Borrowed Books Details",
            borrowedDetails,
            users,
            selectedUserId: userId,
            content: "📖 All Issued Books"
        });
        
        
        console.log(`Fetching borrow details for userId: ${userId || "All Users"}`);
        
    } catch (error) {
        console.error("Error fetching borrow details:", error);
        res.status(500).send("Internal Server Error");
    }

});



router.get('/borrow-details-all',checkLibrarian, async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        // Fetch borrowed book details with user and book info
        const [borrowedDetails] = await db.query(`
            SELECT bb.id, u.name AS user_name, u.email, b.title AS book_title, b.author, bb.borrow_date, bb.return_date, bb.status
            FROM borrowed_books bb
            JOIN users u ON bb.user_id = u.id
            JOIN books b ON bb.book_id = b.id
            ORDER BY bb.borrow_date DESC
        `);

        const route = req.path.includes("borrow-details-all") ? "borrow-details-all" : "dashboard";


        res.render('borrow_details_all', {
            title: "Borrowed Books Details",
            borrowedDetails,
            content: '📖 Library Borrowing Records',
            route
        });

    } catch (error) {
        console.error("Error fetching borrow details:", error);
        res.status(500).send("Internal Server Error");
    }
});



router.post('/return-book/:id',checkLibrarian, async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const borrowId = req.params.id; // Get borrow record ID from URL

    try {
        // Update the borrowed book status to 'returned' and set return_date
        await db.query(`
            UPDATE borrowed_books 
            SET status = 'returned', return_date = NOW() 
            WHERE id = ? AND status = 'borrowed'
        `, [borrowId]);

        // Redirect back to the borrow details page after returning the book
        res.redirect('/dashboard');
    } catch (error) {
        console.error("Error returning book:", error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;

