const {Team,Match}=require('../models');const C=require('./cricket');
const sizeOf=async m=>{const T=await Team.find({_id:{$in:m.innings.map(I=>I.team)}}).lean();return m.innings.map(I=>{const t=T.find(x=>String(x._id)===String(I.team));return{_id:t._id,name:t.name,size:t.players.length}})};
// An innings is complete: all overs bowled, all out, or (2nd innings) the target is reached
async function inningsComplete(m,i){const[a,b]=await sizeOf(m),s=m.innings.map(I=>C.inningsSum(I,m.rules,m.ballsPerOver)),total=m.overs*m.ballsPerOver,t=i?b:a;
 return s[i].balls>=total||s[i].wickets>=t.size-1||(i===1&&s[1].runs>=s[0].runs+1)}
// Finish a match. A tied knockout match needs the tie-break winner. The winner moves into the next knockout match.
async function finishMatch(m,tieWinner){
 if(m.innings.length<2)throw new Error('Scoring has not started');
 const[a,b]=await sizeOf(m),s0=C.inningsSum(m.innings[0],m.rules,m.ballsPerOver),s1=C.inningsSum(m.innings[1],m.rules,m.ballsPerOver),o=C.outcomeOf(m,a,b,s0,s1);
 let winner=o.over?o.winner:(s0.runs>s1.runs?a._id:s1.runs>s0.runs?b._id:null);
 if(!winner&&m.koRound){if(!tieWinner||![String(a._id),String(b._id)].includes(String(tieWinner)))throw new Error('This knockout match is tied. Select the tie-break winner.');winner=tieWinner;m.tieWinner=tieWinner}
 m.status='done';m.innings.forEach(I=>{I.closed=true});await m.save();
 if(winner){await Match.updateMany({srcA:m._id},{teamA:winner});await Match.updateMany({srcB:m._id},{teamB:winner})}
 return winner}
module.exports={sizeOf,inningsComplete,finishMatch};
