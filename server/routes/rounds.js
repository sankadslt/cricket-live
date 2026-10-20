const r=require('express').Router(),c=require('../controllers/roundController'),{SUPER,ah}=require('../middleware/auth');
r.get('/',ah(c.list));r.post('/',SUPER,ah(c.create));r.put('/:id',SUPER,ah(c.update));r.delete('/:id',SUPER,ah(c.remove));
r.post('/:id/generate',SUPER,ah(c.generate));r.post('/:id/clear',SUPER,ah(c.clear));r.get('/:id/qualifiers',SUPER,ah(c.qualifiers));
module.exports=r;
