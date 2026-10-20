const r=require('express').Router(),c=require('../controllers/liveController'),{STAFF,ah}=require('../middleware/auth');
r.post('/:id/ball',STAFF,ah(c.ball));r.post('/:id/undo',STAFF,ah(c.undo));r.post('/:id/finish',STAFF,ah(c.finish));
module.exports=r;
