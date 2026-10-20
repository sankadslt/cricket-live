// Draw logic: league fixtures, knockout bracket, qualifiers. No database here.

// every team plays every other team of its group once
function leagueFixtures(groups){const out=[];
 for(const g of groups){const T=g.teams.map(String);for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++)out.push({group:g.name,label:'Group '+g.name,teamA:T[i],teamB:T[j]})}
 return out}

// Knockout bracket from teams in bracket order (1st plays 2nd, 3rd plays 4th ...).
// If the number of teams is not a power of two, the first teams in the list get a bye.
// Returns matches in play order: {id, koRound, label, a:{team}|{src}, b:{team}|{src}}
function knockoutPlan(teams){const n=teams.length;if(n<2)throw new Error('Select at least 2 teams');
 let P=1;while(P*2<=n)P*=2;
 const m1=n===P?P/2:n-P,byes=n-2*m1,byeTeams=teams.slice(0,byes),players=teams.slice(byes),out=[];
 const label=(count,first)=>(first&&byes>0)?'Playoff':count===1?'Final':count===2?'Semi-final':count===4?'Quarter-final':'Round of '+count*2;
 let cur=[];for(let i=0;i<m1;i++)cur.push({id:'k1_'+i,koRound:1,a:{team:players[2*i]},b:{team:players[2*i+1]}});
 cur.forEach(x=>x.label=label(m1,true));out.push(...cur);
 let ent=[];const bq=byeTeams.map(t=>({team:t})),wq=cur.map(x=>({src:x.id}));
 while(bq.length||wq.length){if(bq.length)ent.push(bq.shift());if(wq.length)ent.push(wq.shift())}
 let k=2;
 while(ent.length>1){const next=[],cnt=ent.length/2;
  for(let i=0;i<ent.length;i+=2){const m={id:`k${k}_${i/2}`,koRound:k,label:label(cnt,false),a:ent[i],b:ent[i+1]};out.push(m);next.push({src:m.id})}
  ent=next;k++}
 return out}

// teams that qualify from the groups of a league round, in bracket order. tables = [{name,rows}]
function qualifierOrder(tables,top){const G=tables.length,pick=tables.map(t=>t.rows.slice(0,top).map(r=>r.id));
 if(G===1){const L=pick[0],o=[];let i=0,j=L.length-1;while(i<j){o.push(L[i++],L[j--])}if(i===j)o.push(L[i]);return o}
 if(G===2&&top===2)return[pick[0][0],pick[1][1],pick[1][0],pick[0][1]];
 const o=[];for(let r=0;r<top;r++)for(let g=0;g<G;g++)if(pick[g][r])o.push(pick[g][r]);return o}
module.exports={leagueFixtures,knockoutPlan,qualifierOrder};
