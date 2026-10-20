// Pure cricket logic. No database here.
const TOK=/^(?:(\d)|(W)|(Wd)(\d?)|(Nb)(\d?)|(B)(\d)|(L)(\d))$/i;
const OUTS=['bowled','caught','lbw','run out','stumped','hit wicket'];
const parseMarks=s=>Array.isArray(s)?s:String(s||'').trim().split(/[\s,]+/).filter(Boolean);

// figures of a list of ball marks. wide / no-ball runs and "counts as a ball" follow the match rules R
function fromMarks(marks,R){const o={balls:0,runs:0,bat:0,wk:0,wd:0,nb:0,wdRuns:0,nbRuns:0,bye:0,lb:0,ex:0};
 for(const t of marks){const m=TOK.exec(String(t).trim());if(!m)throw new Error('Bad ball mark: "'+t+'"');
  if(m[1]!==undefined){o.balls++;o.runs+=+m[1];o.bat+=+m[1]}
  else if(m[2]){o.balls++;o.wk++}
  else if(m[3]){o.wd++;const r=R.wideRuns+(+m[4]||0);o.runs+=r;o.wdRuns+=r;o.ex+=r;if(R.wideBall)o.balls++}
  else if(m[5]){const b=+m[6]||0;o.nb++;o.runs+=R.noBallRuns+b;o.nbRuns+=R.noBallRuns;o.ex+=R.noBallRuns;o.bat+=b;if(R.noBallBall)o.balls++}
  else if(m[7]){o.balls++;o.bye+=+m[8]}
  else{o.balls++;o.lb+=+m[10]}}
 return o}

// split one bowler's marks into overs
function overs(marks,R,bpo){const out=[];let cur=null;
 for(const t of marks){if(!cur){cur={no:out.length+1,marks:[],runs:0,wickets:0,balls:0};out.push(cur)}
  const o=fromMarks([t],R);cur.marks.push(t);cur.runs+=o.runs+o.bye+o.lb;cur.wickets+=o.wk;cur.balls+=o.balls;if(cur.balls>=bpo)cur=null}
 return out}

// Everything about one innings.
//  total = batters' runs + extras            (batters side)
//  bowlRuns + byes + leg byes                (bowlers side) -> must be equal to total
function inningsSum(I,R,bpo){let bat=0,wd=0,nb=0,wdN=0,nbN=0,bye=0,lb=0,balls=0,batTok=0,credited=0,outs=0,runOuts=0,bowlRuns=0,noBowler=false;const bowl=[],dis={};
 for(const b of I.batters){bat+=b.runs;const o=(b.out||'not out').toLowerCase();
  if(o!=='not out'){outs++;if(o==='run out')runOuts++;else if(b.bowler)dis[b.bowler]=(dis[b.bowler]||0)+1;else noBowler=true}}
 for(const w of I.bowlers){const o=fromMarks(w.marks||[],R);wd+=o.wdRuns;nb+=o.nbRuns;wdN+=o.wd;nbN+=o.nb;bye+=o.bye;lb+=o.lb;balls+=o.balls;batTok+=o.bat;credited+=o.wk;bowlRuns+=o.runs;bowl.push({name:w.name,...o,overs:overs(w.marks||[],R,bpo)})}
 const wkDiff=bowl.filter(w=>w.wk!==(dis[w.name]||0)).map(w=>({name:w.name,marks:w.wk,recorded:dis[w.name]||0}));
 const ex=wd+nb+bye+lb;
 return{runs:bat+ex,wickets:outs,balls,bat,extras:{wd,nb,wdN,nbN,bye,lb,total:ex},bowlRuns,bowl,
  diff:bat-batTok,mismatch:bat!==batTok,wkDiff,wkMismatch:credited+runOuts!==outs||(!noBowler&&wkDiff.length>0)}}

// Live scoring: rebuild batters / bowlers from the ball log (this makes Undo simple)
function rebuild(m){m.innings.forEach(I=>{I.batters=[];I.bowlers=[]});
 const pick=(a,n,d)=>{let x=a.find(y=>y.name===n);if(!x){a.push(d);x=a[a.length-1]}return x};
 const nb=n=>({name:n,seq:[],runs:0,balls:0,fours:0,sixes:0,out:'not out',fielder:'',bowler:''});
 for(const b of m.log){const I=m.innings[b.inn];if(!I)continue;const t=TOK.exec(b.token),bat=pick(I.batters,b.striker,nb(b.striker)),bw=pick(I.bowlers,b.bowler,{name:b.bowler,marks:[]});
  bw.marks.push(b.token);
  if(t[1]!==undefined||t[5]){const n=+(t[1]!==undefined?t[1]:t[6]||0);bat.runs+=n;bat.balls++;bat.seq.push(String(n));if(n===4)bat.fours++;if(n===6)bat.sixes++}
  else if(t[2]||t[7]||t[9]){bat.balls++;bat.seq.push('0')}
  if(b.out){const o=pick(I.batters,b.out,nb(b.out));o.out=b.kind||'out';o.fielder=b.fielder||'';o.bowler=b.kind==='run out'?'':b.bowler}}}

// Result of a match from the scores. A,B = the team that batted first / second {_id,name,size}
function outcomeOf(m,A,B,s0,s1){
 const total=m.overs*m.ballsPerOver,done0=s0.balls>=total||s0.wickets>=A.size-1,done1=s1.balls>=total||s1.wickets>=B.size-1;
 const target=s0.runs+1,left=Math.max(total-s1.balls,0),wl=Math.max(B.size-1-s1.wickets,0),started1=!!(m.innings[1]&&(m.innings[1].bowlers.length||m.innings[1].batters.length)),pl=n=>n===1?'':'s';
 if(started1&&s1.runs>=target)return{over:true,winner:B._id,text:`${B.name} won by ${wl} wicket${pl(wl)}`+(left?` (${left} ball${pl(left)} left)`:'')};
 if(done0&&done1){if(s0.runs>s1.runs)return{over:true,winner:A._id,text:`${A.name} won by ${s0.runs-s1.runs} run${pl(s0.runs-s1.runs)}`};return{over:true,winner:null,text:'Match tied'}}
 if(done0)return{over:false,winner:null,text:`${B.name} need ${target-s1.runs} run${pl(target-s1.runs)} from ${left} ball${pl(left)}`,need:target-s1.runs,left};
 return{over:false,winner:null,text:`${A.name} batting: ${s0.runs}/${s0.wickets}`}}

// Points table: points, then net run rate. A team that is all out is counted for its full quota of overs.
function pointsTable(teams,matches,pts){const X={};
 teams.forEach(t=>X[t._id]={id:String(t._id),team:t.name,size:t.players.length,P:0,W:0,L:0,T:0,pts:0,rf:0,of:0,ra:0,ob:0});
 for(const m of matches){if(m.status!=='done'||m.innings.length<2)continue;const[i0,i1]=m.innings,A=X[i0.team],B=X[i1.team];if(!A||!B)continue;
  const s0=inningsSum(i0,m.rules,m.ballsPerOver),s1=inningsSum(i1,m.rules,m.ballsPerOver),bpo=m.ballsPerOver||6;
  const of=(x,q)=>q.wickets>=x.size-1?m.overs:q.balls/bpo,o0=of(A,s0),o1=of(B,s1);
  A.P++;B.P++;A.rf+=s0.runs;A.of+=o0;A.ra+=s1.runs;A.ob+=o1;B.rf+=s1.runs;B.of+=o1;B.ra+=s0.runs;B.ob+=o0;
  if(s0.runs>s1.runs){A.W++;B.L++;A.pts+=pts.win;B.pts+=pts.loss}
  else if(s1.runs>s0.runs){B.W++;A.L++;B.pts+=pts.win;A.pts+=pts.loss}
  else{A.T++;B.T++;A.pts+=pts.tie;B.pts+=pts.tie}}
 return Object.values(X).map(x=>({...x,nrr:(x.of?x.rf/x.of:0)-(x.ob?x.ra/x.ob:0)})).sort((a,b)=>b.pts-a.pts||b.nrr-a.nrr)}

function playerStats(matches,N){const P={};
 const g=(n,t)=>P[n+'|'+t]??={name:n,team:N[t]||'',ms:new Set(),runs:0,balls:0,fours:0,sixes:0,hs:0,wickets:0,bBalls:0,bRuns:0,bOvers:0};
 for(const m of matches)m.innings.forEach((I,i)=>{const bpo=m.ballsPerOver||6,other=m.innings[1-i];
  for(const b of I.batters){const p=g(b.name,I.team);p.ms.add(String(m._id));p.runs+=b.runs;p.balls+=b.balls;p.fours+=b.fours;p.sixes+=b.sixes;p.hs=Math.max(p.hs,b.runs)}
  for(const w of I.bowlers){const p=g(w.name,other&&other.team),o=fromMarks(w.marks,m.rules);p.ms.add(String(m._id));p.wickets+=o.wk;p.bBalls+=o.balls;p.bRuns+=o.runs;p.bOvers+=o.balls/bpo}});
 return Object.values(P).map(({ms,...p})=>({...p,matches:ms.size,sr:p.balls?+(p.runs*100/p.balls).toFixed(1):0,econ:p.bOvers?+(p.bRuns/p.bOvers).toFixed(2):0}))}
function top10(matches,N){const A=playerStats(matches,N),t=(k,tie)=>A.filter(p=>p[k]>0).sort((a,b)=>b[k]-a[k]||tie(a,b)).slice(0,10);
 return{runs:t('runs',(a,b)=>a.balls-b.balls),sixes:t('sixes',(a,b)=>b.runs-a.runs),fours:t('fours',(a,b)=>b.runs-a.runs),wickets:t('wickets',(a,b)=>a.bRuns-b.bRuns)}}

function bestOf(m){let bat=null,bow=null;
 m.innings.forEach((I,i)=>{for(const b of I.batters)if(!bat||b.runs>bat.runs||(b.runs===bat.runs&&b.balls<bat.balls))bat={...b,team:I.team&&I.team.name,sr:b.balls?+(b.runs*100/b.balls).toFixed(1):0};
  const other=m.innings[1-i];for(const w of I.sum.bowl)if(!bow||w.wk>bow.wk||(w.wk===bow.wk&&w.runs<bow.runs))bow={name:w.name,wk:w.wk,runs:w.runs,balls:w.balls,team:other&&other.team&&other.team.name,econ:w.balls?+(w.runs/(w.balls/m.ballsPerOver)).toFixed(2):0}});
 return{bat,bow:bow&&bow.wk>0?bow:null}}
module.exports={TOK,OUTS,parseMarks,fromMarks,overs,inningsSum,rebuild,outcomeOf,pointsTable,top10,bestOf};
