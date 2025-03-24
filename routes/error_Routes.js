const express = require('express');
const router = express.Router();








router.get('/unauthorized',(req,res)=>{
    res.status(403).render("unauthorized", { user: req.session.user });
})


router.get('/login-error',(req,res)=>{
    res.status(403).render("login_error", { user: req.session.user });
})


module.exports = router