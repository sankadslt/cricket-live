const {Match,Round,User,Team}=require('../models');const {pick}=require('../utils/rules');const {view,viewOne}=require('../utils/matchView');
exports.list=async(q,s)=>{const f={};for(const k of['category','round','status'])if(q.query[k])f[k]=q.query[k];s.json(await view(await Match.find(f).sort('no')))};
exports.get=async(q,s)=>{const m=await viewOne(q.params.id);if(!m)throw new Error('Match not found');s.json(m)};

// add one extra league match by hand (the generator normally creates them)
exports.create=async(q,s)=>{const{round,group,teamA,teamB}=q.body,r=await Round.findById(round);if(!r)throw new Error('Select the round');
 if(r.format!=='league')throw new Error('Knockout matches are created by the draw');
 const g=r.groups.find(x=>x.name===group);if(!g)throw new Error('Select the group');
 if(!teamA||!teamB||String(teamA)===String(teamB))throw new Error('Select two different teams');
 if(![teamA,teamB].every(t=>g.teams.some(x=>String(x)===String(t))))throw new Error('Both teams must be in this group');
 if(await Match.exists({round:r._id,group,$or:[{teamA,teamB},{teamA:teamB,teamB:teamA}]}))throw new Error('These two teams already have a match in this group');
 const last=await Match.findOne().sort('-no');
 s.json(await Match.create({no:(last?.no||0)+1,category:r.category,round:r._id,group,label:'Group '+group,teamA,teamB,pitch:'-',overs:r.overs,ballsPerOver:r.ballsPerOver,rules:pick(r.rules)}))};
// schedule: date, time, pitch
exports.update=async(q,s)=>{const m=await Match.findById(q.params.id);if(!m)throw new Error('Match not found');
 for(const k of['date','time','pitch'])if(q.body[k]!==undefined)m[k]=String(q.body[k]).trim();await m.save();s.json({ok:1})};
exports.remove=async(q,s)=>{const m=await Match.findById(q.params.id);if(!m)throw new Error('Match not found');
 if(m.scoringMode)throw new Error('Scoring has started. This match cannot be deleted.');
 if(m.koRound)throw new Error('Knockout matches belong to the draw. Clear the round fixtures instead.');
 await m.deleteOne();s.json({ok:1})};

const num=(v,min,name)=>{v=Number(v);if(!Number.isInteger(v)||v<min)throw new Error(name+' is not valid');return v};
// Scoring setup: who scores, toss, live or hand-written, rules (default = the round's rules, or special). Done once; the mode is locked afterwards.
exports.setup=async(q,s)=>{const m=await Match.findById(q.params.id);if(!m)throw new Error('Match not found');
 if(m.scoringMode)throw new Error('Scoring already started in '+m.scoringMode+' mode. It cannot be changed.');
 if(!m.teamA||!m.teamB)throw new Error('The teams of this match are not decided yet');
 const{scorerId,mode,rulesMode,rules:r={},toss}=q.body;
 if(!['live','paper'].includes(mode))throw new Error('Select live or hand-written scoring');
 if(!scorerId||!await User.findById(scorerId))throw new Error('Select who is scoring');
 const A=String(m.teamA),B=String(m.teamB);
 if(!toss||![A,B].includes(String(toss.winner))||!['bat','bowl'].includes(toss.elected))throw new Error('Select the toss winner and the decision');
 let overs,bpo,rules;
 if(rulesMode==='special'){overs=num(r.overs,1,'Overs');bpo=num(r.ballsPerOver,1,'Balls per over');
  rules={wideRuns:num(r.wideRuns,0,'Wide runs'),noBallRuns:num(r.noBallRuns,0,'No ball runs'),wideBall:!!r.wideBall,noBallBall:!!r.noBallBall,lastBallCounts:!!r.lastBallCounts}}
 else{const rd=await Round.findById(m.round);overs=rd.overs;bpo=rd.ballsPerOver;rules=pick(rd.rules)}
 const first=toss.elected==='bat'?String(toss.winner):(String(toss.winner)===A?B:A),second=first===A?B:A;
 Object.assign(m,{scorer:scorerId,scoringMode:mode,rulesMode:rulesMode==='special'?'special':'default',toss,overs,ballsPerOver:bpo,rules,status:'live',
  innings:[{team:first,source:mode,batters:[],bowlers:[]},{team:second,source:mode,batters:[],bowlers:[]}],log:[]});
 await m.save();s.json(await viewOne(m._id))};
