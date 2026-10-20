const {Team,Round,Match}=require('../models');const D=require('../utils/draw'),{roundTables}=require('../utils/tables');
const int=(v,min,l)=>{v=Number(v);if(!Number.isInteger(v)||v<min)throw new Error(l+' is not valid');return v};
const sameSet=(a,b)=>JSON.stringify(a.map(String))===JSON.stringify(b.map(String));
const rulesOf=r=>({wideRuns:r.rules.wideRuns,noBallRuns:r.rules.noBallRuns,wideBall:r.rules.wideBall,noBallBall:r.rules.noBallBall});
const nextNo=async()=>((await Match.findOne().sort('-no'))?.no||0)+1;

async function clean(b,cat){const r=b.rules||{},p=b.points||{},name=String(b.name||'').trim();if(!name)throw new Error('Enter the round name');
 if(!['league','knockout'].includes(b.format))throw new Error('Select league or knockout');
 const out={name,format:b.format,overs:int(b.overs,1,'Overs'),ballsPerOver:int(b.ballsPerOver,1,'Balls per over'),
  rules:{wideRuns:int(r.wideRuns,0,'Wide runs'),noBallRuns:int(r.noBallRuns,0,'No ball runs'),wideBall:!!r.wideBall,noBallBall:!!r.noBallBall},
  points:{win:int(p.win,0,'Win points'),tie:int(p.tie,0,'Tie points'),loss:int(p.loss,0,'Loss points')}};
 const ids=b.format==='league'?(b.groups||[]).flatMap(g=>g.teams||[]):(b.teams||[]);
 if(new Set(ids.map(String)).size!==ids.length)throw new Error('A team can be added only once in a round');
 const found=await Team.find({_id:{$in:ids},category:cat}).lean();if(found.length!==ids.length)throw new Error('Some teams are not '+cat+' teams');
 if(b.format==='league'){const names=(b.groups||[]).map(g=>String(g.name||'').trim());if(new Set(names).size!==names.length||names.some(n=>!n))throw new Error('Group names must be different');
  out.groups=(b.groups||[]).map(g=>({name:String(g.name).trim(),teams:g.teams||[]}));out.teams=[]}
 else{out.teams=b.teams||[];out.groups=[]}
 return out}

exports.list=async(q,s)=>{const rs=await Round.find(q.query.category?{category:q.query.category}:{}).sort('category no').lean();
 for(const r of rs){const ms=await Match.find({round:r._id},'status').lean();r.progress={total:ms.length,done:ms.filter(m=>m.status==='done').length,live:ms.filter(m=>m.status==='live').length}}
 s.json(rs)};
exports.create=async(q,s)=>{const cat=q.body.category;if(!['boys','girls'].includes(cat))throw new Error('Select Boys or Girls');
 const last=await Round.findOne({category:cat}).sort('-no');s.json(await Round.create({category:cat,no:(last?.no||0)+1,...await clean(q.body,cat)}))};
exports.update=async(q,s)=>{const r=await Round.findById(q.params.id);if(!r)throw new Error('Round not found');
 const c=await clean({...q.body,format:r.format},r.category),has=await Match.exists({round:r._id});
 if(has&&(!sameSet(r.format==='league'?r.groups.flatMap(g=>g.teams):r.teams,r.format==='league'?c.groups.flatMap(g=>g.teams):c.teams)||(r.format==='league'&&JSON.stringify(r.groups.map(g=>[g.name,g.teams.map(String)]))!==JSON.stringify(c.groups.map(g=>[g.name,g.teams.map(String)])))))
  throw new Error('Fixtures are already generated. Clear the fixtures to change groups or teams.');
 Object.assign(r,c);await r.save();
 await Match.updateMany({round:r._id,scoringMode:{$exists:false}},{overs:r.overs,ballsPerOver:r.ballsPerOver,rules:r.rules});   // matches not started follow the new rules
 s.json(r)};
const started=r=>Match.exists({round:r._id,scoringMode:{$exists:true}});
exports.remove=async(q,s)=>{const r=await Round.findById(q.params.id);if(!r)throw new Error('Round not found');
 if(await started(r))throw new Error('Scoring has started in this round. It cannot be deleted.');
 await Match.deleteMany({round:r._id});await r.deleteOne();s.json({ok:1})};
exports.clear=async(q,s)=>{const r=await Round.findById(q.params.id);if(!r)throw new Error('Round not found');
 if(await started(r))throw new Error('Scoring has started in this round. Fixtures cannot be cleared.');
 const n=(await Match.deleteMany({round:r._id})).deletedCount;s.json({deleted:n})};

// create the matches of a round: league = every team plays the others in its group, knockout = bracket
exports.generate=async(q,s)=>{const r=await Round.findById(q.params.id);if(!r)throw new Error('Round not found');
 if(await Match.exists({round:r._id}))throw new Error('Fixtures are already generated. Clear them first.');
 const base={category:r.category,round:r._id,overs:r.overs,ballsPerOver:r.ballsPerOver,rules:rulesOf(r)};let no=await nextNo(),made=0;
 if(r.format==='league'){const fx=D.leagueFixtures(r.groups);if(!fx.length)throw new Error('Add at least 2 teams in a group first');
  for(const f of fx){await Match.create({...base,no:no++,group:f.group,label:f.label,teamA:f.teamA,teamB:f.teamB,pitch:'-'});made++}}
 else{const plan=D.knockoutPlan(r.teams.map(String)),ids={};
  for(const p of plan){const m=await Match.create({...base,no:no++,label:p.label,koRound:p.koRound,pitch:'-',
    teamA:p.a.team,teamB:p.b.team,srcA:p.a.src?ids[p.a.src]:undefined,srcB:p.b.src?ids[p.b.src]:undefined});ids[p.id]=m._id;made++}}
 s.json({created:made})};

// teams that qualify from the previous league round (top N of each group), in bracket order
exports.qualifiers=async(q,s)=>{const r=await Round.findById(q.params.id);if(!r)throw new Error('Round not found');
 const prev=await Round.findOne({category:r.category,no:{$lt:r.no},format:'league'}).sort('-no');if(!prev)throw new Error('There is no earlier league round');
 const top=int(q.query.top||2,1,'Top teams'),tables=await roundTables(prev),ms=await Match.find({round:prev._id},'status').lean();
 s.json({from:{_id:prev._id,name:prev.name},complete:ms.length>0&&ms.every(m=>m.status==='done'),teams:D.qualifierOrder(tables,top)})};
