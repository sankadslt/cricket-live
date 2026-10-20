const bcrypt=require('bcryptjs');const {User}=require('../models');
const pub=u=>({_id:u._id,username:u.username,role:u.role,name:u.name||u.username,serviceNo:u.serviceNo||''});
// list: used for "who is scoring" (any staff) and the Users page (super admin)
exports.list=async(q,s)=>s.json((await User.find().sort('name').lean()).map(pub));
exports.create=async(q,s)=>{const{username,password,role,name,serviceNo}=q.body;
 if(!String(username||'').trim())throw new Error('Enter a username');if(String(password||'').length<4)throw new Error('Password must be at least 4 characters');
 if(!String(name||'').trim())throw new Error('Enter the name');
 if(await User.findOne({username:username.trim()}))throw new Error('This username is already used');
 const u=await User.create({username:username.trim(),passwordHash:await bcrypt.hash(password,10),role:role==='super'?'super':'scorer',name:name.trim(),serviceNo:(serviceNo||'').trim()});s.json(pub(u))};
exports.update=async(q,s)=>{const u=await User.findById(q.params.id);if(!u)throw new Error('User not found');const{password,role,name,serviceNo}=q.body;
 if(name!==undefined)u.name=String(name).trim();if(serviceNo!==undefined)u.serviceNo=String(serviceNo).trim();
 if(password){if(String(password).length<4)throw new Error('Password must be at least 4 characters');u.passwordHash=await bcrypt.hash(password,10)}
 if(role&&role!==u.role){if(u.role==='super'&&await User.countDocuments({role:'super'})<2)throw new Error('There must be at least one super admin');u.role=role==='super'?'super':'scorer'}
 await u.save();s.json(pub(u))};
exports.remove=async(q,s)=>{const u=await User.findById(q.params.id);if(!u)throw new Error('User not found');
 if(String(u._id)===String(q.user.id))throw new Error('You cannot delete your own account');
 if(u.role==='super'&&await User.countDocuments({role:'super'})<2)throw new Error('There must be at least one super admin');
 await u.deleteOne();s.json({ok:1})};
