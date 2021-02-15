window.onload = () => {
    var socket = io();

    var player = document.getElementById('player');
    var ready = document.getElementById('ready');
    var gamefield = document.getElementById('gamefield');
    var server_cards = new Array(8);
    var client_cards = new Array(8);
    var played_cards = document.getElementById('played_cards');
    var try_again = document.getElementById('try_again');
    var next_level = document.getElementById('next_level');
    var dropbox = document.getElementById('dropbox');

    for(var i=0; i<8;i++){
        client_cards[i]=document.getElementById('card'+(i+1).toString())
    }

    var level = document.getElementById('level').value;
    var cards_played = 0;

    try_again.style.display='none';
    next_level.style.display='none';

    //send
    //player name
    socket.emit('player', {player: player.value});
    //player ready
    $('#ready').on('change', (event) => {
            if (event.currentTarget.checked) {
                socket.emit('ready', { player: player.value, ready: 'true' });
            }
            else {
                socket.emit('ready', { player: player.value, ready: 'false' });
            }
        });
    //play card
    /*topcard.addEventListener('click', () => {
        socket.emit('card_played', {card: topcard.value, player: player.value});
        server_cards[cards_played++] = 101;
        if(cards_played<level){
            topcard.value = server_cards[cards_played];
        }
        else{
            topcard.style.display = 'none';
        }
    });*/

    function allowDrop(ev){
        ev.preventDefault();
    }

    function drag(ev){
        ev.dataTransfer.setData("text", ev.target.id);
    }

    function drop(ev){
        ev.preventDefault();
        alert(document.getElementById(ev.dataTransfer.getData("text")).id);
    }
    
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
    //get cards
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
            server_cards[i] = temp[i];
        }
        for(var i=0;i<level;i++){
            client_cards[i].innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'0').innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'1').innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'2').innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'3').innerHTML = server_cards[i].toString();
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
        //topcard.removeAttribute('disabled');
    });
    //card played
    socket.on('card_played', (data) => {
        for(var i=0;i<level;i++){
            if(parseInt(data.played_card)>parseInt(server_cards[i])){
                socket.emit('card_played', {card: server_cards[i], player: player.value});
            }
        }
        if(data.result=='lose'){
            //topcard.setAttribute('disabled', 'true');
            try_again.style.display = 'block';
        }
        else if(data.cards_left==0){
            next_level.style.display = 'block';
        }
        played_cards.innerHTML = '<p>' + data.played_card + '</p>' + '<p>' + data.result + '</p>';
    });
}