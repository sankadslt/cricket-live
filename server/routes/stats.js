const r=require('express').Router(),c=require('../controllers/statsController'),{ah}=require('../middleware/auth');
r.get('/points',ah(c.points));r.get('/top',ah(c.top));r.get('/draw',ah(c.draw));
module.exports=r;
