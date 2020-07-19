class User{
    constructor()
    {
        this.users=[];
    }
    adduser(id,name,room,status)
    {
        let u={id,name,room,status};
        this.users.push(u);
    }
    updatelist(room)
    {
        let u= this.users.filter((user)=>  user.room===room);
        return u;
        // return u.map((user)=> {user.name,user.status});
    }
    getuser(id)
    {
        return this.users.filter((u)=>  u.id===id)[0];
    }
    deleteuser(id)
    {
        let user= this.getuser(id);
        if(user)
        {
            this.users=this.users.filter((u)=> u.id!==id);
        }
        return user;
    }
    deleteoffline(n,r)
    {
        for(var i=0;i<this.users.length;i++)
        {
            if(this.users[i].room===r && this.users[i].name===n && this.users[i].status==="offline")
            {    
                this.users.pop(this.users[i]);
                break;
            }
        }
    }
};
module.exports={User};