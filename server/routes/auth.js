const r=require('express').Router(),c=require('../controllers/authController'),{ah}=require('../middleware/auth');
r.post('/login',ah(c.login));
module.exports=r;
