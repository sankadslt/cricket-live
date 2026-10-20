const {Team,Round,Match}=require('../models');const {who}=require('../middleware/auth');
const ROLES=['Batsman','Bowler','Keeper','All-rounder'];
const clean=b=>{const name=String(b.name||'').trim();if(!name)throw new Error('Enter the team name');
 if(!['boys','girls'].includes(b.category))throw new Error('Select Boys or Girls');
 const players=(b.players||[]).filter(p=>String(p.name||'').trim()).map(p=>({name:p.name.trim(),serviceNo:String(p.serviceNo||'').trim(),role:ROLES.includes(p.role)?p.role:'Batsman'}));
 if(players.length<2)throw new Error('Add at least 2 players');return{name,category:b.category,players}};
exports.list=async(q,s)=>{const t=await Team.find(q.query.category?{category:q.query.category}:{}).lean();
 if(!who(q))t.forEach(x=>x.players.forEach(p=>delete p.serviceNo));s.json(t)};   // service no. is only for logged-in staff
exports.create=async(q,s)=>s.json(await Team.create(clean(q.body)));
exports.update=async(q,s)=>{const t=await Team.findById(q.params.id);if(!t)throw new Error('Team not found');const c=clean({...q.body,category:t.category});t.name=c.name;t.players=c.players;await t.save();s.json(t)};
exports.remove=async(q,s)=>{const id=q.params.id;
 if(await Round.exists({$or:[{teams:id},{'groups.teams':id}]})||await Match.exists({$or:[{teamA:id},{teamB:id}]}))throw new Error('This team is used in a round or a match. Remove it from the rounds first.');
 await Team.findByIdAndDelete(id);s.json({ok:1})};
