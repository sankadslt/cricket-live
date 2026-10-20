const {Team,Match}=require('../models');const C=require('./cricket');
// Standings of every group of a league round: [{name, rows}]
async function roundTables(round){
 const ids=round.groups.flatMap(g=>g.teams),teams=await Team.find({_id:{$in:ids}}).lean(),ms=await Match.find({round:round._id,status:'done'}).lean();
 return round.groups.map(g=>({name:g.name,rows:C.pointsTable(teams.filter(t=>g.teams.some(x=>String(x)===String(t._id))),ms.filter(m=>m.group===g.name),round.points)}))}
module.exports={roundTables};
