const {Schema,model}=require('mongoose');
module.exports=model('Team',new Schema({name:{type:String,required:true},category:{type:String,enum:['boys','girls'],required:true},players:[{name:String,serviceNo:String,role:{type:String,enum:['Batsman','Bowler','Keeper','All-rounder'],default:'Batsman'}}]},{collection:'teams'}));
