const jwt=require('jsonwebtoken'),bcrypt=require('bcryptjs');const {User}=require('../models');
exports.login=async(q,s)=>{const u=await User.findOne({username:String(q.body.username||'').trim()});
 if(!u||!await bcrypt.compare(q.body.password||'',u.passwordHash))return s.status(401).json({error:'Wrong username or password'});
 const role=u.role==='admin'?'super':u.role;
 s.json({token:jwt.sign({id:u._id,role,name:u.name||u.username},process.env.JWT_SECRET,{expiresIn:'12h'}),role,name:u.name||u.username,id:u._id})};
