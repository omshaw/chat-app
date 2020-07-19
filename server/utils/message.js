const moment=require('moment');
let m=(from,text)=>{
   return{ 
    from : from,
    text : text,
    createat: moment().valueOf()
   }
}


module.exports ={m};