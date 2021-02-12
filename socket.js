window.onload = () => {
    var socket = io();

    var player = document.getElementById('player');
    var ready = document.getElementById('ready');
    var gamefield = document.getElementById('gamefield');
    var card = new Array(8);
    var topcard = document.getElementById('card1');
    var played_cards = document.getElementById('played_cards');
    var try_again = document.getElementById('try_again');
    var next_level = document.getElementById('next_level');
    var cards = document.getElementById('cards');


    var level = document.getElementById('level').value;
    var cards_played = 0;

    topcard.setAttribute('disabled', 'true');

    try_again.style.display='none';
    next_level.style.display='none';

    //send
    //player name
    socket.emit('player', {player: player.value});
    //player ready
    ready.addEventListener('change', (event) => {
        if(event.currentTarget.checked){
            socket.emit('ready', {player: player.value, ready: 'true'});
        }
        else{
            socket.emit('ready', {player: player.value, ready: 'false'});
        }
    });
    //play card
    topcard.addEventListener('click', () => {
        socket.emit('card_played', {card: topcard.value, player: player.value});
        card[cards_played++] = 101;
        if(cards_played<level){
            topcard.value = card[cards_played];
        }
        else{
            topcard.style.display = 'none';
        }
    });    
    
    //next level
    next_level.addEventListener('click', () => {
        level++;
        ready.checked = 'false';
        socket.emit('next_level', {level: level});
    });
    

    //get
    //server full
    socket.on('full', () => {
        alert('server full');
    });
    //card
    socket.on('cards', (data) => {
        var temp = new Array(8);
        for(var i=0;i<level;i++){
            temp[i] = data.cards[data.number+i*8];
        }
        for(var i=7;i>=level;i--){
            temp[i] = 101;
        }
        temp = temp.sort(function(a, b){return a-b});
        for(var i=0;i<8;i++){
            card[i] = temp[i];
        }
        topcard.value = card[0];
        topcard.innerHTML = card[0].toString();
        for(var i=0;i<level;i++){
            cards.innerHTML += card[i] + '  ';
        }
    });
    //players joined, disconnected
    socket.on('players_list', (data) => {
        for(var i = 0;i<7;i++){
            document.getElementById((i.toString())).innerHTML = data.players[i][0];
        }
    });
    //players ready to start
    socket.on('ready', () => {
        ready.style.display = 'none';
        topcard.removeAttribute('disabled');
    });
    //card played
    socket.on('card_played', (data) => {
        for(var i=0;i<level;i++){
            if(parseInt(data.played_card)>parseInt(card[i])){
                socket.emit('card_played', {card: card[i], player: player.value});
            }
        }
        if(data.result=='lose'){
            topcard.setAttribute('disabled', 'true');
            try_again.style.display = 'block';
        }
        else if(data.cards_left==0){
            next_level.style.display = 'block';
        }
        played_cards.innerHTML = '<p>' + data.played_card + '</p>' + '<p>' + data.result + '</p>';
    });
}