const r=require('express').Router(),c=require('../controllers/teamController'),{SUPER,ah}=require('../middleware/auth');
r.get('/',ah(c.list));r.post('/',SUPER,ah(c.create));r.put('/:id',SUPER,ah(c.update));r.delete('/:id',SUPER,ah(c.remove));
module.exports=r;
