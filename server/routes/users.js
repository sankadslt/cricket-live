const r=require('express').Router(),c=require('../controllers/userController'),{SUPER,STAFF,ah}=require('../middleware/auth');
r.get('/',STAFF,ah(c.list));r.post('/',SUPER,ah(c.create));r.patch('/:id',SUPER,ah(c.update));r.delete('/:id',SUPER,ah(c.remove));
module.exports=r;
