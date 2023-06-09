let socket = io();

function scrolldown() {
    let m = document.querySelector('.message').lastElementChild;
    m.scrollIntoView();
}
socket.on('connect', () => {
    console.log("server connected");
    let q = window.location.search.substring(1);
    let t = decodeURI(q).replace(/=/g, '":"').replace(/&/g, '","').replace(/\+/g, ' ');
    let k = JSON.parse('{"' + t + '"}');
    // $.get('/app',function(k){
    // let k=JSON.parse('{"name" : "om" , "room" : "5"}');
    socket.emit('join', k, function (err) {
        if (err) {
            alert(err);
            window.location.href = "/";
        }
        else
            console.log("NO Error");
    });
    socket.emit('admin');
    // });
});
socket.on('gr-name', (name) => {
    document.getElementById('gr-name').innerText = name;
});
socket.on('updatelist', (user, obj) => {
    // console.log(user);
    // console.log(obj);
    // console.log(user[0].status);
    document.querySelector('.user h2').innerText = `${user.length} Participants`;
    let vd = document.createElement('ol');
    vd.style.cssText = 'list-style-type:none;';
    user.forEach(function (element) {
        let v = document.createElement('li');
        // console.log(element);
        for (let i = 0; i < obj.length; i++) {
            if (obj[i].name === element.name) {
                let p = document.createElement('img');
                p.setAttribute("id", "dp");
                p.style.cssText = 'border-radius: 50%; width: 2.5em; margin: 10px; cursor: pointer;';
                if (element.status === "offline") {
                    p.src = `./uploads/${obj[i].image}`;
                    p.alt =element.name;
                    v.appendChild(p);
                    v.innerHTML += `${element.name}<span><img src="https://img.icons8.com/emoji/48/000000/red-circle-emoji.png"/>last seen at ${element.time}</span><hr>`;
                }
                else {
                    p.src = `./uploads/${obj[i].image}`;
                    p.alt = element.name;
                    v.appendChild(p);
                    v.innerHTML += `${element.name}<span><img src="https://img.icons8.com/emoji/48/000000/green-circle-emoji.png"/>Online</span><hr>`;
                }
            }
        }
        vd.appendChild(v);
    });
    let s = document.querySelector('.users');
    s.innerHTML = "";
    s.appendChild(vd);
});
socket.on('newmessage-admin',function(message){
    let v=document.createElement('div');
    v.setAttribute("class","me");
    v.innerText=message;
    document.querySelector('.message').appendChild(v);
    // setTimeout(() => {
    //     document.querySelector('h3').innerText="";
    // }, 3000);
    scrolldown();
});

document.getElementById("sb").addEventListener('click', (e) => {
    let v = document.getElementById("Msg").innerHTML;
    console.log(v);
    socket.emit('create-message', v);
    document.getElementById("Msg").innerHTML='';
});
let t="";
socket.on('old-msg', function (docs, name) {
    for (var i = 0; i < docs.length; i++) {
        if (docs[i].n !== name) {
            if(t=="")
            {
                t=docs[i].date;
                let v=document.createElement('div');
                v.setAttribute("class","me");
                v.innerText=t;
                document.querySelector('.message').appendChild(v);
            }
            else if(t!=docs[i].date)
            {
                t=docs[i].date;
                let v=document.createElement('div');
                v.setAttribute("class","me");
                v.innerText=t;
                document.querySelector('.message').appendChild(v);
            }
            let b = document.createElement('div');
            b.setAttribute('class', 'left');
            let v = document.createElement('div');
            v.setAttribute('class', 'l');
            let u = document.createElement('div');
            u.setAttribute('class', 'lt');
            u.innerHTML = `<b>From</b>:${docs[i].n}`;
            v.innerHTML = `${docs[i].m}     <span>${docs[i].create}</span>`;
            b.appendChild(u);
            b.appendChild(v);
            document.querySelector('.message').appendChild(b);
            scrolldown();
        }
        else {
            if(t=="")
            {
                t=docs[i].date;
                let v=document.createElement('div');
                v.setAttribute("class","me");
                v.innerText=t;
                document.querySelector('.message').appendChild(v);
            }
            else if(t!=docs[i].date)
            {
                t=docs[i].date;
                let v=document.createElement('div');
                v.setAttribute("class","me");
                v.innerText=t;
                document.querySelector('.message').appendChild(v);
            }
            let b = document.createElement('div');
            b.setAttribute('class', 'right');
            let v = document.createElement('div');
            v.setAttribute('class', 'r');
            v.innerHTML = `${docs[i].m}     <span>${docs[i].create}</span>`;
            b.appendChild(v);
            document.querySelector('.message').appendChild(b);
            scrolldown();
        }
    }
});
socket.on('newmessage', function (message, f) {
    if(t=="")
    {
        t=message.date;
        let v=document.createElement('div');
        v.setAttribute("class","me");
        v.innerText=t;
        document.querySelector('.message').appendChild(v);
    }
    else if(t!=message.date)
    {
        t=message.date;
        let v=document.createElement('div');
        v.setAttribute("class","me");
        v.innerText=t;
        document.querySelector('.message').appendChild(v);
    }
    if (f == 'left') {
        let b = document.createElement('div');
        b.setAttribute('class', 'left');
        let v = document.createElement('div');
        v.setAttribute('class', 'l');
        let u = document.createElement('div');
        u.setAttribute('class', 'lt');
        // const t=moment(message.create).format('LT');
        u.innerHTML = `<b>From</b>:${message.n}`;
        v.innerHTML = `${message.m}     <span>${message.create}</span>`;
        b.appendChild(u);
        b.appendChild(v);
        document.querySelector('.message').appendChild(b);
        scrolldown();
    }
    else {
        let b = document.createElement('div');
        b.setAttribute('class', 'right');
        // const t=moment(message.create).format("LT");
        let v = document.createElement('div');
        v.setAttribute('class', 'r');
        v.innerHTML = `${message.m}     <span>${message.create}</span>`;
        b.appendChild(v);
        document.querySelector('.message').appendChild(b);
        scrolldown();
    }
});
socket.on('disconmect', () => {
    console.log('server disconnected');
});
