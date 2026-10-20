const {Schema,model}=require('mongoose');const rules=require('./rules');
const oid=ref=>({type:Schema.Types.ObjectId,ref});
const Batter=new Schema({name:String,seq:[String],runs:{type:Number,default:0},balls:{type:Number,default:0},fours:{type:Number,default:0},sixes:{type:Number,default:0},
 out:{type:String,default:'not out'},fielder:{type:String,default:''},bowler:{type:String,default:''}},{_id:false});   // how out, who took the catch / stumping / run out, which bowler
const Bowler=new Schema({name:String,marks:[String]},{_id:false});
const Innings=new Schema({team:oid('Team'),batters:[Batter],bowlers:[Bowler],source:{type:String,enum:['live','paper']},closed:{type:Boolean,default:false}},{_id:false});
module.exports=model('Match',new Schema({
 no:{type:Number,unique:true},category:{type:String,enum:['boys','girls']},
 round:oid('Round'),group:String,label:String,koRound:Number,        // league: group "A". knockout: koRound 1,2,3... and label (Semi-final...)
 teamA:oid('Team'),teamB:oid('Team'),srcA:oid('Match'),srcB:oid('Match'),   // knockout: a slot can wait for the winner of match srcA / srcB
 date:String,time:String,pitch:String,status:{type:String,enum:['scheduled','live','done'],default:'scheduled'},
 scorer:oid('User'),scoringMode:{type:String,enum:['live','paper']},rulesMode:{type:String,enum:['default','special']},
 toss:{winner:Schema.Types.ObjectId,elected:{type:String,enum:['bat','bowl']}},tieWinner:oid('Team'),
 overs:Number,ballsPerOver:{type:Number,default:6},rules,innings:[Innings],
 log:[new Schema({inn:Number,striker:String,bowler:String,token:String,out:String,kind:String,fielder:String},{_id:false})]},{collection:'matches'}));
