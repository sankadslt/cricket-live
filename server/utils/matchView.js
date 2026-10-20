const {Team,Match,Round,User}=require('../models');const C=require('./cricket');
// Match documents -> what the website needs: team names, round, innings totals, result text, best players, next match
async function view(ms){const T={},R={},U={},NO={},NEXT={};
 (await Team.find().lean()).forEach(t=>T[t._id]={_id:t._id,name:t.name,size:t.players.length});
 (await Round.find().lean()).forEach(r=>R[r._id]={_id:r._id,no:r.no,name:r.name,format:r.format});
 (await User.find({},'name username').lean()).forEach(u=>U[u._id]={_id:u._id,name:u.name||u.username});
 (await Match.find({},'no label teamA teamB srcA srcB').lean()).forEach(x=>{NO[x._id]=x;if(x.srcA)NEXT[x.srcA]=x;if(x.srcB)NEXT[x.srcB]=x});
 const slot=(team,src)=>team&&T[team]?T[team]:{_id:null,name:'TBD',placeholder:src&&NO[src]?'Winner of Match '+NO[src].no:'To be decided'};
 return ms.map(m=>{m=m.toObject?m.toObject():m;delete m.log;
  m.round=R[m.round]||null;m.scorer=U[m.scorer]||null;
  const next=NEXT[m._id];m.next=next?{_id:next._id,no:next.no,label:next.label,teamA:slot(next.teamA,next.srcA),teamB:slot(next.teamB,next.srcB)}:null;
  const A=slot(m.teamA,m.srcA),B=slot(m.teamB,m.srcB);m.teamA=A;m.teamB=B;
  m.innings=m.scoringMode?m.innings.map(I=>({...I,team:T[I.team],sum:C.inningsSum(I,m.rules,m.ballsPerOver)})):[];
  m.winner=null;
  if(m.innings.length===2){const[a,b]=m.innings,o=C.outcomeOf(m,a.team,b.team,a.sum,b.sum);m.outcome=o;m.best=C.bestOf(m);
   let winner=o.over?o.winner:(a.sum.runs>b.sum.runs?a.team._id:b.sum.runs>a.sum.runs?b.team._id:null),text=o.text;
   if(!o.over&&m.status==='done'){text=a.sum.runs>b.sum.runs?`${a.team.name} won by ${a.sum.runs-b.sum.runs} runs`:b.sum.runs>a.sum.runs?`${b.team.name} won by ${Math.max(b.team.size-1-b.sum.wickets,0)} wickets`:'Match tied'}
   if(m.status==='done'&&!winner&&m.tieWinner){winner=m.tieWinner;text=`Match tied · ${T[m.tieWinner].name} won the tie-break`}
   m.winner=m.status==='done'?winner:null;m.result=m.status==='done'?text:null;m.statusText=m.status==='done'?text:o.text}
  else{m.statusText=m.status==='scheduled'?'Not started':'Scoring is about to start';m.result=null}
  return m})}
const viewOne=async id=>(await view(await Match.find({_id:id})))[0];
module.exports={view,viewOne};
