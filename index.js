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

//routes
app.get('/', (req, res) => {
    res.render('home');
});
app.post('/', (req, res) => {
    res.render('game', {name: req.body.name, level: level});
    console.log(level + ' ezt kapjak');
});
//js
app.get('/socket.js', function (req, res) {
    res.sendFile(__dirname + '/socket.js');
});
app.get('/phonetouch.js', function (req, res) {
    res.sendFile(__dirname + '/phonetouch.js');
});
//css
app.get('/style/home.css', function (req, res) {
    res.sendFile(__dirname + '/style/home.css');
});
app.get('/style/button.css', function (req, res) {
    res.sendFile(__dirname + '/style/button.css');
});
app.get('/style/game.css', function (req, res) {
    res.sendFile(__dirname + '/style/game.css');
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

app.use((req, res) => {
    res.render('home');
});

//variables
var players = [['','','',''],['','','',''],['','','',''],['','','',''],['','','',''],['','','',''],['','','',''],['','','','']];
var players_number = 0;
var lastcard = 0;
var level = 1;
var recards = false;

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
function shuffle_cards() {
    var array = new Array(64);
    shuffleArray(numbers);
    for(var i=0;i<64;i++){
        array[i] = numbers[i];
    }
    return array;
}
var card8 = shuffle_cards();

//socket
io.on('connection', (socket) => {
    console.log('made connection');

    //player connected
    socket.on('player', (data) => {
        var i = 0;
        while(i<8){
            if(players[i][0]==''){
                recards = false;
                players[i][0]=data.player;
                players[i][1]=socket.id;
                players[i][2]='false';
                players[i][3]=data.level.toString();
                console.log(data.player + ' joined');
                io.to(socket.id).emit('cards',{cards: card8, number: i});
                io.sockets.emit('players_list', {players: players});
                i=7;
            }
            i++;
        }
        if(i>8){
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
                players[i][3]='';
                io.sockets.emit('players_list', {players: players});
                break;
            }
            i++;
        }
        var player_counter = 0;
        for(var i=0;i<8;i++){
            if(players[i][0]==''){
                player_counter++;
            }
        }
        if(player_counter == 8) recards = true;
        setTimeout(() => {
            if(recards){
                level = 1;
                card8 = shuffle_cards();
                lastcard = 0;
            }
        }, 10000);
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
        console.log('level: '+level);
        if(parseInt(lastcard)<parseInt(data.card)){
            lastcard = data.card;
            io.sockets.emit('card_played', {played_card: data.card, result: 'keep goin', cards_left: --players_number, played_by: data.player, player_left_cards: data.left_cards});
            if(players_number==0){
                level++;
                card8=shuffle_cards();
                lastcard = 0;
            }
        }
        else{
            card8=shuffle_cards();
            lastcard=0;
            level = 1;
            for(var i=0;i<8;i++)
            {
                players[i][3]='0';
            }
            io.sockets.emit('card_played', {played_card: data.card, result: 'lose', cards_left: players_number, played_by: data.player, player_left_cards: data.left_cards});
        }
    });
    //dropstart
    socket.on('dragstart', (data) => {
        io.sockets.emit('dragstart', {player_name: data.player_name})
    });
    //dropend
    socket.on('dragend', (data) => {
        io.sockets.emit('dragend', {player_name: data.player_name})
    });
});