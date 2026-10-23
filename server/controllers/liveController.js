const {Match}=require('../models');const C=require('../utils/cricket'),{viewOne}=require('../utils/matchView'),{inningsComplete,finishMatch}=require('../utils/finish');
const get=async id=>{const m=await Match.findById(id);if(!m)throw new Error('Match not found');if(m.scoringMode!=='live')throw new Error('This match is scored from a hand-written sheet');if(m.status==='done')throw new Error('Match is finished');return m};
exports.ball=async(q,s)=>{const m=await get(q.params.id),b=q.body,t=C.TOK.exec(b.token||''),inn=Number(b.inn);
 if(!t)throw new Error('Bad ball');if(![0,1].includes(inn))throw new Error('Bad innings');
 if(!b.striker||!b.bowler)throw new Error('Select the striker and the bowler');
 if(inn===1&&!await inningsComplete(m,0))throw new Error('The first innings is not finished yet');
 if(await inningsComplete(m,inn))throw new Error(inn===1?'The match is over. No more runs can be added.':'This innings is complete');
 const os=C.overState(m,inn);   // one bowler bowls the whole over; the same bowler cannot bowl two overs in a row
 if(os.bowler&&b.bowler!==os.bowler)throw new Error(os.bowler+' must finish the over ('+os.left+' ball'+(os.left===1?'':'s')+' left)');
 if(!os.bowler&&os.last&&b.bowler===os.last)throw new Error(b.bowler+' bowled the last over. Choose another bowler.');
 let token=b.token;   // last ball of the 2nd innings: a wide / no ball counts as a ball when the rules say so
 if(inn===1&&m.rules.lastBallCounts&&/^(Wd|Nb)/i.test(token)&&!token.endsWith('!')&&C.inningsSum(m.innings[1],m.rules,m.ballsPerOver).balls===m.overs*m.ballsPerOver-1)token+='!';
 if(b.kind||t[2]){ // a wicket
  if(!C.OUTS.includes(b.kind))throw new Error('Select how the batter got out');if(!b.out)throw new Error('Select who is out');
  if(b.kind==='run out'?!!t[2]:!t[2])throw new Error('Wicket and ball mark do not match');
  if(['caught','stumped'].includes(b.kind)&&!b.fielder)throw new Error('Select who took the '+(b.kind==='caught'?'catch':'stumping'))}
 m.log.push({inn,striker:b.striker,bowler:b.bowler,token,out:b.out||'',kind:b.kind||'',fielder:b.fielder||''});C.rebuild(m);await m.save();s.json(await viewOne(m._id))};
exports.undo=async(q,s)=>{const m=await get(q.params.id);m.log.pop();C.rebuild(m);await m.save();s.json(await viewOne(m._id))};
exports.finish=async(q,s)=>{const m=await get(q.params.id);await finishMatch(m,q.body.tieWinner);s.json(await viewOne(m._id))};
