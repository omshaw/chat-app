const express = require('express');
const http = require('http');
const path = require('path');
const port = process.env.PORT || 3000;
const app = express();
const publicpath = path.join(__dirname,'/../public/');
const server = http.createServer(app);
const moment = require('moment');
let socketIO = require('socket.io');
let io = socketIO(server);
let bodyparser=require('body-parser');
const bcrypt=require('bcryptjs');
const flash=require('connect-flash');
const session=require('express-session');
const passport=require('passport');
const Localstrategy=require('passport-local').Strategy;
app.use(express.static(publicpath));
const multer=require('multer');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended:false
}));
app.use(express.urlencoded({extended: false}));

app.set('view-engine','ejs');
let { User } = require('./utils/users.js');
// let {m}=require('./utils/message.js');
require('dotenv').config();
// let user=new User();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/chat', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("conected to mongodb");
});

let chatSchema = mongoose.Schema({
    r: String,
    n: String,
    m: String,
    create: String
});

let userSchema = mongoose.Schema({
    id: String,
    name: String,
    status: String,
    time: String,
    room: String
});

let registerSchema =mongoose.Schema({
    name: String,
    email: String,
    password: String,
    password2: String,
    img: String
});

let listSchema=mongoose.Schema({
    room: String,
    name: String,
    grname: String,
    link: String
});
let joinedSchema=mongoose.Schema({
    email: String,
    list : [listSchema]
});
let Joined= mongoose.model('joined',joinedSchema);
let d = mongoose.model('Message', chatSchema);
function real(str) {
    return (typeof (str) === "string" && str.trim().length > 0);
}
let c = mongoose.model('user', userSchema);

let user=mongoose.model('register',registerSchema);
let k;

async function pics(room){
    let obj=[];
    await Joined.find({"list.room": room})
    .then(async function(record){
        for(let i=0;i<record.length;i++)
        {
            let n;
            for(let j=0;j<record[i].list.length;j++)
            {
                if(record[i].list[j].room===room)
                    n=record[i].list[j].name;
            }
            await user.findOne({email: record[i].email})
            .then(function(doc){
                obj.push({name: n, image: doc.img});
            });
        }
    });
    return obj;
}
passport.use(
    new Localstrategy({usernameField:'email'},(email,password,done)=>{
        user.findOne({email:email})
        .then(u =>{
            if(!u){
                return done(null,false,{message:'This email is not registered'});
            }
            bcrypt.compare(password,u.password,(err,res)=>{
                if(err)
                    throw err;
                if(res)
                {
                    return done(null,u);
                }
                else
                {
                    return done(null,false,{message:'Incorrect password'});
                }
            });
        });
    })
);
passport.serializeUser(function(user,done){
    done(null,user.id);
})
passport.deserializeUser(function(id,done){
    user.findById(id,function(err,u){
        done(err,u);
    });  
})
var storage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, './public/uploads/'); 
    }, 
    filename: (req, file, cb) => { 
        cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname)); 
    } 
}); 
var upload = multer({ storage: storage }).single('image'); 

app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
  );
//passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });
const ensureAuthenticated= function(req, res, next) {
    if(req.isAuthenticated()){
      return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    return res.redirect('/users/login');
}
const forwardAuthenticated= function(req,res,next){
    if(!req.isAuthenticated())
        return next();
    return res.redirect('/dashboard');
}
app.get('/', forwardAuthenticated,(req,res)=>{
    return res.render('welcome.ejs');
});
app.get('/users/register',forwardAuthenticated,(req,res)=>{
    return res.render('register.ejs');
});
app.get('/users/login',forwardAuthenticated,(req,res)=>{
    return res.render('login.ejs');
});
app.post('/users/register',(req,res)=>{
    const {name,email,password,password2}=req.body;
    let errors=[];
    if(password!=password2){
        errors.push({msg: 'passwors do not match'});
    }
    if(password.length<6){
        errors.push({msg: "password must be atleast 6 characters"});
    }
    if(errors.length>0)
    {
        res.render('register.ejs',{
            errors,
            name,
            email,
            password,
            password2
        });
    }
    else{
        user.findOne({email:email}).then(u=>{
            if(u)
            {
                errors.push({msg: "email already exist"});
                res.render('register.ejs',{
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            }
            else{
                const newRegister=new user({
                    name,
                    email,
                    password
                });
                bcrypt.genSalt(10,(err,salt)=>{
                    bcrypt.hash(newRegister.password,salt,(err,hash)=>{
                        if(err)
                            throw err;
                        newRegister.password=hash;
                        newRegister
                        .save()
                        .then(()=>{
                            req.flash('success_msg','You are now registered and can log in');
                            res.redirect('/users/login');
                        });
                    });
                });
            }
        });
    }
});
app.post('/users/login',(req,res,next)=>{
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req,res,next);
});
app.get('/dashboard',ensureAuthenticated,(req,res)=>{
    Joined.findOne({email:req.user.email}).then(function(record){
        user.findOne({email: req.user.email})
        .then(function(doc){
            return res.render('dashboard.ejs',{
                user: doc,
                list: (record)?record.list:[]
            });
        });
    });
});
app.post('/dashboard',upload,(req,res) =>{
    user.findOne({email: req.user.email})
      .then(function(record){
        record.img=req.file.filename;
        record.save();
      }); 
    res.redirect('/dashboard');
});
app.get('/join',ensureAuthenticated ,(req, res) => {
    // res.sendFile(publicpath + '/f.html');
    res.render('f.ejs',{message:""});
});
app.get('/create',ensureAuthenticated,(req,res)=>{
    res.render('c.ejs',{message:""});
});
app.post('/join',(req,res)=>{
    let j=0;
    c.find({},(err,doc)=>{
        if(err)
            throw err;
        for(let i=0;i<doc.length;i++)
        {
            if(doc[i].room === req.body.room && doc[i].name === req.body.name)
            {
                return res.render('f.ejs',{message: "username already exist!"});
            }
            if(doc[i].room===req.body.room)
            {
                j=1;
                let grname;
                Joined.findOne({"list.room": req.body.room}).then(function(record){
                    if(record){
                        console.log(record);
                        for(let j=0;j<record.list.length;j++)
                        {
                            if(record.list[j].room===req.body.room && record.list[j].grname!='')
                            {    
                                grname=record.list[j].grname;
                                console.log(grname);
                                return;
                            }
                        }
                    }
                });
                Joined.findOne({email:req.user.email}).then(function(record){
                    if(record)
                    {
                        for(let i=0; i<record.list.length;i++)
                        {
                            if(record.list[i].room === req.body.room)
                                return;
                        }

                        record.list.push({room: req.body.room,name: req.body.name, grname: grname, link: '/app?name='+req.body.name+'&room='+req.body.room});
                        record.save();
                        // .then(function(){
                        //     return res.redirect('/dashboard');
                        // });
                    }
                    else{
                        let newjoined= new Joined({
                            email:req.user.email,
                            list: [{room: req.body.room,name: req.body.name, grname: grname, link: '/app?name='+req.body.name+'&room='+req.body.room}]
                        });
                        newjoined.save();
                        // .then(function(){
                        //     return res.redirect('/dashboard');
                        // });
                    }
                });
                return res.redirect('/app?name='+req.body.name+'&room='+req.body.room);
            }
        }
        if(j==0)
            return res.render('f.ejs',{message: "Room id does not exist!"});
    });
});
app.post('/create',(req,res)=>{
    let j=0;
    c.find({},async(err,doc)=>{
        if(err)
            throw err;
        for(let i=0;i<doc.length;i++)
        {
            if(doc[i].room===req.body.room)
            {
                j=1;
                return res.render('c.ejs',{message: "Room-id already exist!"});
            }
        }
        if(j==0)
        {
            await Joined.findOne({email:req.user.email}).then(async function(record){
                if(record)
                {
                    record.list.push({room: req.body.room,name: req.body.name, grname: req.body.grname, link: '/app?name='+req.body.name+'&room='+req.body.room});
                    await record.save();
                }
                else{
                    let newjoined= new Joined({
                        email:req.user.email,
                        list: [{room: req.body.room, name: req.body.name, grname: req.body.grname ,link: '/app?name='+req.body.name+'&room='+req.body.room}]
                    });
                    await newjoined.save();
                }
            });
            return res.redirect('/app?name='+req.body.name+'&room='+req.body.room);
        }
    });
});
app.get('/app',(req,res)=>{
    res.sendFile(publicpath+'/app.html');
});
// Logout
app.get('/users/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });

io.on('connection', (socket) => {
    socket.on('join', async(k,callback) => {
        if (!real(k.name) || !real(k.room)) {
            callback("Invalid Name or Room-name");
        }
        socket.join(k.room);

        Joined.findOne({"list.room":k.room}).then(function(record){
            if(record){
            for(let i=0;i<record.list.length;i++)
            {
                if(record.list[i].room===k.room)
                {
                    socket.emit('gr-name',record.list[i].grname);
                    return;
                }
            }
        }
        });
        // user.deleteuser(socket.id);
        // user.deleteoffline(k.name,k.room);
        // user.adduser(socket.id,k.name,k.room,"online",moment().format("LT"));
        // await c.findOne({ name: k.name, room: k.room },async function (err, bt) {
        //     if (err)
        //         throw err;
        //     if (bt) {
        //         bt.status = "online";
        //         bt.id = socket.id;
        //         await bt.save(async function (err) {
        //             if (err)
        //                 throw err;
        //             console.log(bt.status);
        //             await c.find({ room: k.room }, async function (err, docs) {
        //                 if (err)
        //                     throw err;
        //                 io.to(k.room).emit('updatelist', docs);
        //                 console.log(bt);
        //             });
        //         });
        //     }
        //     else{
        //         let newuser = new c({ id: socket.id, name: k.name, status: "online", time: moment().format("LT"), room: k.room });
        //         await newuser.save(function (err) {
        //             if (err)
        //                 throw err;
        //             c.find({ room: k.room }, function (err, docs) {
        //                 if (err)
        //                     throw err;
        //                 io.to(k.room).emit('updatelist', docs);
        //             });
        //         });
        //     }
        // });
        c.findOne({ name: k.name, room:k.room})
        .then(function(bt){
            if(bt)
            {
                bt.status='online';
                bt.id=socket.id;
                bt.save()
                .then(function(){
                    c.find({room: k.room})
                    .then(function(docs){
                        pics(k.room)
                        .then(function(result){
                            io.to(k.room).emit('updatelist', docs, result);
                        });
                    });
                });
            }
            else{
                let newuser = new c({ id: socket.id, name: k.name, status: "online", time: moment().format("LT"), room: k.room });
                newuser.save()
                .then(function(){
                    c.find({room: k.room})
                    .then(function(docs){
                        io.to(k.room).emit('updatelist', docs, pics(k.room));
                    });
                });
            }
        }); 
        socket.on('admin',function(){
            socket.emit('newmessage-admin',`Welcome to our chat room:${k.room}`);
            socket.broadcast.to(k.room).emit('newmessage-admin',`${k.name} joined!`);
        });
        // let rm =user.getuser(socket.id);
        // let g=rm.room;
        d.find({ r: k.room }, function (err, docs) {
            if (err)
                throw err;
            socket.emit('old-msg', docs, k.name);
        });
        callback();
    });
    
    socket.on('create-message', (message) => {
        // let u=user.getuser(socket.id);
        c.findOne({ id: socket.id }, function (err, u) {
            if (err)
                throw err;
            console.log(u);
            if (u && real(message)) {
                // let ms=m(u.name,message);
                let ms = { n: u.name, m: message, create: moment().format("LT") };
                let newmsg = new d({ r: u.room, n: u.name, m: message, create: moment().format("LT") });
                newmsg.save(function (err) {
                    if (err)
                        throw err;
                    socket.emit('newmessage', ms, 'right');
                    socket.broadcast.to(u.room).emit('newmessage', ms, 'left');
                });
            }
        });
    });

    socket.on('disconnect', async() => {

        // let u=user.getuser(socket.id);
        // user.deleteuser(socket.id);
        // user.adduser(socket.id,u.name,u.room,"offline",moment().format("LT"));
        // let v=user.updatelist(u.room);
        // if(u)
        // {    io.to(u.room).emit('updatelist',v); 

        // }
        // await c.findOne({ id: socket.id }, async function (err, bd) {
        //     if (err)
        //         throw err;
        //     if (bd) {
        //         bd.status = "offline";
        //         bd.time = moment().format("lll");
        //         await bd.save(async function (err) {
        //             if (err)
        //                 throw err;
        //             console.log("success...");
        //             await c.find({ room: bd.room }, async function (err, docs) {
        //                 if (err)
        //                     throw err;
        //                 io.to(bd.room).emit('updatelist', docs);
        //                 console.log(bd);
        //                 // io.to(bd.room).emit('newmessage-admin',`${k.name} disconnected!`);
        //             });
        //         });
        //     }
        // });
        c.findOne({id: socket.id})
        .then(function(bd){
            if(bd)
            {
                bd.status="offline";
                bd.time = moment().format("lll");
                bd.save()
                .then(function(){
                    c.find({room : bd.room})
                    .then(function(docs){
                        io.to(bd.room).emit('updatelist', docs, pics(bd.room));
                    });
                });
            }
        });
    });
});

server.listen(port, () => {
    console.log(`server running at ${port}`);
})