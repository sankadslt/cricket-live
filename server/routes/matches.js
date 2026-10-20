const r=require('express').Router(),c=require('../controllers/matchController'),{SUPER,STAFF,ah}=require('../middleware/auth');
r.get('/',ah(c.list));r.get('/:id',ah(c.get));r.post('/',SUPER,ah(c.create));r.patch('/:id',SUPER,ah(c.update));r.delete('/:id',SUPER,ah(c.remove));
r.post('/:id/setup',STAFF,ah(c.setup));
module.exports=r;
