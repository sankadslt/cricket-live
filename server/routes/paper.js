const r=require('express').Router(),c=require('../controllers/paperController'),{STAFF,ah}=require('../middleware/auth');
r.post('/:id/innings/:i/preview',STAFF,ah(c.preview));r.put('/:id/innings/:i',STAFF,ah(c.save));r.post('/:id/finish',STAFF,ah(c.finish));
module.exports=r;
