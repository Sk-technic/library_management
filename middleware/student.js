const checkStudent = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/login-error');
    }
    if (req.session.user.role !== 'student') {
        

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(403).json({ success: false, message: "Access denied. Students only." });
        }
        // If the request is from a browser, redirect to an unauthorized page
        return res.redirect('/unauthorized');
    }
    next(); // Proceed if user is a student
};

module.exports = checkStudent;
