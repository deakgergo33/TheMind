const express = require('express');
const socket = require('socket.io');

//express app
const app = express();
app.use(express.urlencoded({ extended: true}));

//set view engine
app.set('view engine', 'ejs');

//listen for req
const server = app.listen(3000);

//socket setup
const io = socket(server);

//variables
var players = [['','',''],['','',''],['','',''],['','',''],['','',''],['','',''],['','',''],['','','']];
var players_number = 0;
var lastcard = 0;
var level = 1;
//random
var numbers = new Array(100);
for(var i=0;i<100;i++){
    numbers[i] = i+1;
}
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
function rng8(level) {
    var array = new Array(64);
    shuffleArray(numbers);
    for(var i=0;i<level*8;i++){
        array[i] = numbers[i];
    }
    return array;
}
var card8 = rng8(level);

//routes
app.get('/', (req, res) => {
    res.render('home');
});

app.post('/', (req, res) => {
    res.render('game', {name: req.body.name, level: level});
});

app.get('/socket.js', function (req, res) {
    res.sendFile(__dirname + '/socket.js');
});
//css
app.get('/style/home.css', function (req, res) {
    res.sendFile(__dirname + '/style/home.css');
});
app.get('/style/game.css', function (req, res) {
    res.sendFile(__dirname + '/style/game.css');
});
app.get('/style/checkbox.css', function (req, res) {
    res.sendFile(__dirname + '/style/checkbox.css');
});
app.get('/style/cards.css', function (req, res) {
    res.sendFile(__dirname + '/style/cards.css');
});
//pics
app.get('/img/background.jpg', function (req, res) {
    res.sendFile(__dirname + '/img/background.jpg');
});
app.get('/img/card_sample.png', function (req, res) {
    res.sendFile(__dirname + '/img/card_sample.png');
});
app.get('/img/hatlap2.png', function (req, res) {
    res.sendFile(__dirname + '/img/hatlap2.png');
});
app.get('/img/pic3.png', function (req, res) {
    res.sendFile(__dirname + '/img/pic3.png');
});

app.get('/drag(event)', function (req, res) {
    res.sendFile(__dirname + '/socket.js');
});

app.use((req, res) => {
    res.render('home');
});


//socket
io.on('connection', (socket) => {
    console.log('made connection');

    //player connected
    socket.on('player', (data) => {
        var i = 0;
        while(i<8){
            if(players[i][0]==''){
                players[i][0]=data.player;
                players[i][1]=socket.id;
                players[i][2]='false';
                console.log(data.player + ' joined');
                io.to(socket.id).emit('cards',{cards: card8, number: i});
                io.sockets.emit('players_list', {players: players});
                i=0;
                break;
            }
            i++;
        }
        if(i!=0){
            io.to(socket.id).emit('full',{});
        }
        console.log(players);
    });
    //player disconnected
    socket.on('disconnect', () => {

        var i = 0;
        while(i<8){
            if(players[i][1]==socket.id){
                console.log(players[i][0] + ' disconnected');
                players[i][0]='';
                players[i][1]='';
                players[i][2]='';
                io.sockets.emit('players_list', {players: players});
                break;
            }
            i++;
        }
        /*var recards = true;
        for(var i=0;i<8;i++){
            if(players[i][0]!=''){
                recards = false;
            }
        }
        if(recards){
            level = 1;
            card8 = rng8(level);
            lastcard = 0;
        }*/
        console.log(players);
    });
    //player ready
    socket.on('ready', (data) => {
        for(var i=0;i<8;i++){
            if(players[i][0]==data.player){
                players[i][2]=data.ready;
                break;
            }
        }
        var ready = true;
        for(var i=0;i<8;i++){
            if(players[i][0]!=''&&players[i][2]=='false'){
                ready = false;
                break;
            }
        }      
        if(ready){
            players_number=0;
            for(var i=0;i<8;i++){
                if(players[i][0]!=''){
                    players_number++;
                }
                players[i][2]='false';
            }
            players_number = players_number*level;
            io.sockets.emit('ready', {});
        }
    });
    //card played
    socket.on('card_played', (data) => {
        console.log(data.card + '  ' + lastcard + '  ' + players_number);
        if(parseInt(lastcard)<parseInt(data.card)){
            lastcard = data.card;
            io.sockets.emit('card_played', {played_card: data.card, result: 'keep goin', cards_left: --players_number, played_by: data.player});
            if(players_number==0){
                level++;
                card8=rng8(level);
                lastcard = 0;
            }
        }
        else{
            card8=rng8(level);
            lastcard=0;
            level = 1;
            io.sockets.emit('card_played', {played_card: data.card, result: 'lose', cards_left: players_number, played_by: data.player});
        }
    });
});