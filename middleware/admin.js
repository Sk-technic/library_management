const checkLibrarian = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/login-error');
    }

    if (req.session.user.role !== 'librarian') {

        // res.send(`Access denied for user: ${req.session.user.username}, Role: ${req.session.user.role}`);
        // If the request is from the frontend (AJAX/JSON request)
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(403).json({ success: false, message: "Access denied. Librarians only." });
        }
        
        // If the request is from a browser, redirect to a different page
        return res.redirect('/unauthorized');
    }

    next(); // Proceed if user is a librarian
};

module.exports = checkLibrarian;
