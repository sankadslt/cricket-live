const jwt=require('jsonwebtoken');
const who=q=>{try{return jwt.verify((q.headers.authorization||'').slice(7),process.env.JWT_SECRET)}catch{return null}};
const need=roles=>(q,s,n)=>{const u=who(q);if(!u)return s.status(401).json({error:'Please login'});if(!roles.includes(u.role))return s.status(403).json({error:'Only the super admin can do this'});q.user=u;n()};
const ah=f=>(q,s)=>f(q,s).catch(e=>s.status(400).json({error:e.message}));
// SUPER = super admin only. STAFF = super admin or scorer (marking scores)
module.exports={who,SUPER:need(['super']),STAFF:need(['super','scorer']),ah};
