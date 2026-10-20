require('dotenv').config();
const express=require('express'),cors=require('cors'),mongoose=require('mongoose'),path=require('path'),bcrypt=require('bcryptjs');
const {User}=require('./models');
const app=express();app.use(cors(),express.json({limit:'1mb'}));
app.use('/api',require('./routes'));
app.use('/api',(q,s)=>s.status(404).json({error:'Not found'}));
const dist=path.join(__dirname,'../client/dist');           // production: serve the built React app
app.use(express.static(dist));
app.get('*',(q,s)=>s.sendFile(path.join(dist,'index.html'),e=>e&&s.status(404).send('Build the client first: cd client && npm run build')));
(async()=>{
 await mongoose.connect(process.env.MONGO_URI);
 await User.updateMany({role:'admin'},{role:'super'});    // older databases
 if(!await User.countDocuments())await User.create({username:process.env.ADMIN_USER||'admin',passwordHash:await bcrypt.hash(process.env.ADMIN_PASS||'ChangeMe123',10),role:'super',name:'Super Admin'});
 const p=process.env.PORT||5000;app.listen(p,()=>console.log('API running on http://localhost:'+p));
})().catch(e=>{console.error(e);process.exit(1)});
