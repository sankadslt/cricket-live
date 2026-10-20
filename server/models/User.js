const {Schema,model}=require('mongoose');
// Staff logins. role "super" = can do everything. role "scorer" = can only mark scores.
module.exports=model('User',new Schema({
 username:{type:String,unique:true,required:true},passwordHash:String,
 role:{type:String,enum:['super','scorer'],default:'scorer'},
 name:String,serviceNo:String},{collection:'users'}));
