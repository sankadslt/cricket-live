const {Team,Match,Round}=require('../models');const C=require('../utils/cricket'),{roundTables}=require('../utils/tables'),{view}=require('../utils/matchView');
// points tables of all league rounds of a category (one table per group)
exports.points=async(q,s)=>{const rs=await Round.find({category:q.query.category,format:'league'}).sort('no').lean(),out=[];
 for(const r of rs)out.push({round:{_id:r._id,no:r.no,name:r.name},groups:await roundTables(r)});s.json(out)};
exports.top=async(q,s)=>{const N={};(await Team.find().lean()).forEach(t=>N[t._id]=t.name);s.json(C.top10(await Match.find({category:q.query.category}).lean(),N))};
// the whole draw: every round with its groups / standings and matches (winners move on automatically)
exports.draw=async(q,s)=>{const cat=q.query.category,rs=await Round.find({category:cat}).sort('no').lean(),T={};
 (await Team.find({category:cat}).lean()).forEach(t=>T[t._id]={_id:t._id,name:t.name});
 const ms=await view(await Match.find({category:cat}).sort('no')),out=[];
 for(const r of rs){const mine=ms.filter(m=>String(m.round&&m.round._id)===String(r._id));
  const status=!mine.length?'empty':mine.every(m=>m.status==='done')?'done':mine.some(m=>m.status!=='scheduled')?'live':'upcoming';
  out.push({_id:r._id,no:r.no,name:r.name,format:r.format,overs:r.overs,ballsPerOver:r.ballsPerOver,rules:r.rules,status,
   groups:r.format==='league'?(await roundTables(r)).map(g=>({...g,teams:g.rows.map(x=>x.id)})):[],
   entrants:r.format==='knockout'?r.teams.map(t=>T[t]).filter(Boolean):[],matches:mine})}
 s.json(out)};
