const {Schema,model}=require('mongoose');const rules=require('./rules');
const oid=ref=>({type:Schema.Types.ObjectId,ref});
// One round of a category (Boys / Girls). Each round has its own match rules and format (league or knockout).
module.exports=model('Round',new Schema({
 category:{type:String,enum:['boys','girls'],required:true},no:Number,name:String,
 format:{type:String,enum:['league','knockout'],required:true},
 overs:{type:Number,default:10},ballsPerOver:{type:Number,default:6},
 rules,                                                   // default rules of every match in this round (wide / no ball)
 points:{win:{type:Number,default:2},tie:{type:Number,default:1},loss:{type:Number,default:0}},   // league only
 groups:[{name:String,teams:[oid('Team')]}],              // league: groups and their teams
 teams:[oid('Team')]                                      // knockout: teams in bracket order
},{collection:'rounds'}));
