const {Match}=require('../models');const C=require('../utils/cricket'),{viewOne}=require('../utils/matchView'),{finishMatch}=require('../utils/finish');
const get=async id=>{const m=await Match.findById(id);if(!m)throw new Error('Match not found');if(m.scoringMode!=='paper')throw new Error('This match is scored live');if(m.status==='done')throw new Error('Match is finished');return m};
// a batter's total comes from the balls marked one by one (0-6); how out / bowler / fielder are checked
// seq: runs 0-6 for each ball faced; "W" (last) = the ball on which he got out (it counts as a ball he faced)
const norm=b=>{const seq=(b.seq||[]).map(String);if(seq.some(x=>!/^([0-6]|W)$/.test(x))||seq.some((x,i)=>x==='W'&&i!==seq.length-1))throw new Error('Bad batter mark for '+b.name);
 const out=b.out&&b.out!=='not out'?b.out:'not out';if(out!=='not out'&&!C.OUTS.includes(out))throw new Error('Bad "how out" for '+b.name);
 if(out!=='not out'&&out!=='run out'&&!b.bowler)throw new Error('Select the bowler for '+b.name);
 if((out==='caught'||out==='stumped')&&!b.fielder)throw new Error('Select who took the '+(out==='caught'?'catch':'stumping')+' for '+b.name);
 if(seq.includes('W')&&out==='not out')throw new Error(b.name+' has a wicket ball but is marked not out');
 return{name:b.name,seq,runs:seq.reduce((a,x)=>a+(x==='W'?0:+x),0),balls:seq.length,fours:seq.filter(x=>x==='4').length,sixes:seq.filter(x=>x==='6').length,out,fielder:out==='not out'?'':(b.fielder||''),bowler:out==='not out'||out==='run out'?'':b.bowler}};
const build=(m,b)=>{const batters=(b.batters||[]).filter(x=>x.name).map(norm),bowlers=(b.bowlers||[]).filter(x=>x.name).map(x=>({name:x.name,marks:C.parseMarks(x.marks)}));
 const sum=C.inningsSum({batters,bowlers},m.rules,m.ballsPerOver);
 if(sum.balls>m.overs*m.ballsPerOver)throw new Error('Too many balls: the rules allow only '+m.overs*m.ballsPerOver+' balls ('+m.overs+' overs of '+m.ballsPerOver+') in an innings');
 return{batters,bowlers,sum}};   // throws on a bad mark
exports.preview=async(q,s)=>{const m=await get(q.params.id);s.json(build(m,q.body).sum)};
exports.save=async(q,s)=>{const m=await get(q.params.id),I=m.innings[+q.params.i];if(!I)throw new Error('No such innings');
 const{batters,bowlers}=build(m,q.body);I.batters=batters;I.bowlers=bowlers;I.closed=true;await m.save();s.json(await viewOne(m._id))};
exports.finish=async(q,s)=>{const m=await get(q.params.id);if(!m.innings.every(I=>I.closed))throw new Error('Save both innings first');await finishMatch(m,q.body.tieWinner);s.json(await viewOne(m._id))};
