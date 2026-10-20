const r=require('express').Router();
r.use('/auth',require('./auth'));r.use('/users',require('./users'));r.use('/teams',require('./teams'));r.use('/rounds',require('./rounds'));
r.use('/matches',require('./matches'));r.use('/live',require('./live'));r.use('/paper',require('./paper'));r.use('/stats',require('./stats'));
module.exports=r;
