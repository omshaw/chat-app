const express=require('express');
const http=require('http');
const path=require('path');
const port=process.env.PORT|| 4000;
const app=express();
const publicpath=path.join(__dirname,'/../public');
const server=http.createServer(app); 
const moment=require('moment');
let socketIO=require('socket.io');
let io=socketIO(server);
app.use(express.static(publicpath));

let {User}=require('./utils/users.js');
// let {m}=require('./utils/message.js');
require('dotenv').config();
// let user=new User();

const mongoose=require('mongoose');
mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost/chat',{ useNewUrlParser: true ,useUnifiedTopology: true });
const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("conected to mongodb");
});

let chatSchema =mongoose.Schema({
    r: String,
    n: String,
    m: String,
    create: String
});

let userSchema =mongoose.Schema({
    id: String,
    name: String,
    status: String,
    time: String,
    room: String
})
let d=mongoose.model('Message',chatSchema);
function real(str)
{
    return (typeof(str)==="string" && str.trim().length>0);
}
 
let c=mongoose.model('user',userSchema);
app.get('/',(req,res)=>{
    res.sendFile(publicpath+'/f.html');
});
io.on('connection',(socket)=>{
    socket.on('join',(k,callback)=>{
        if(!real(k.name) || !real(k.room))
        {
            callback("Invalid Name or Room-name");
        }
        socket.join(k.room);
        // user.deleteuser(socket.id);
        // user.deleteoffline(k.name,k.room);
        // user.adduser(socket.id,k.name,k.room,"online",moment().format("LT"));
        c.remove({name: k.name, status:"offline"});
        let newuser=new c({id: socket.id, name: k.name, status: "online", time: moment().format("LT"), room: k.room});
        newuser.save(function(err){
            if(err)
                throw err;
        });
        c.find({ room:k.room}, function(err,docs){
            if(err)
                throw err;
            io.to(k.room).emit('updatelist',docs);
        });
        
        // socket.on('admin',function(){
        //     socket.emit('newmessage-admin',`Welcome to our chat room:${k.room}`);
        //     socket.broadcast.to(k.room).emit('newmessage-admin',`${k.name} joined!`);
        // });
        // let rm =user.getuser(socket.id);
        // let g=rm.room;
        d.find({ r: k.room},function(err,docs){
            if(err)
                throw err;
            socket.emit('old-msg',docs,user.getuser(socket.id));
        });
        callback(); 
    });
    socket.on('create-message',(message)=>{
        // let u=user.getuser(socket.id);
        c.find({id:socket.id}, function(err,u){
            if(err)
                throw err;
            if(u && real(message))
            {
                // let ms=m(u.name,message);
                let ms={n: u.name, m: message, create: moment().format("LT")};
                let newmsg= new d({r:u.room, n:u.name, m: message , create: moment().format("LT")});
                newmsg.save(function(err){
                if(err)
                    throw err;
                socket.emit('newmessage',ms,'right');
                socket.broadcast.to(u.room).emit('newmessage',ms,'left');
                });
            }
        });
    });

    socket.on('disconnect',()=>{

        // let u=user.getuser(socket.id);
        // user.deleteuser(socket.id);
        c.remove({id: socket.id});
        let newuser=new c({id: socket.id, name: k.name, status: "offline", time: moment().format("LT"), room: k.room});
        newuser.save(function(err){
            if(err)
                throw err;
        });
        // user.adduser(socket.id,u.name,u.room,"offline",moment().format("LT"));
        // let v=user.updatelist(u.room);
        // if(u)
        // {    io.to(u.room).emit('updatelist',v); 
    
        // }
        c.find({ room:k.room}, function(err,docs){
            if(err)
                throw err;
            io.to(k.room).emit('updatelist',docs);
            io.to(u.room).emit('newmessage-admin',`${u.name} disconnected!`);
        });
    });
});
server.listen(port,()=>{
    console.log(`server running at ${port}`);
})