window.onload = () => {
    var socket = io();

    var player = document.getElementById('player');
    var ready = document.getElementById('ready');
    var server_cards = new Array(8);
    var client_cards = new Array(8);
    var client_cards_box = new Array(8);
    var played_cards = document.getElementById('played_cards');
    var try_again = document.getElementById('try_again');
    var next_level = document.getElementById('next_level');
    var dropbox = document.getElementById('dropbox');
    var indicator_text = document.getElementById('indicator_text');
    var left_cards = new Array(7);
    var player_name = new Array(7);

    for(var i=0; i<8;i++){
        client_cards[i]=document.getElementById('card'+(i+1).toString());
        client_cards_box[i]=document.getElementById('card'+(i+1).toString()+'_box');
    }

    for(var i=0;i<7;i++){
        left_cards[i]=document.getElementById('left_cards'+i.toString());
        player_name[i]=document.getElementById(i.toString());
    }

    var level = document.getElementById('level').value;
    var cards_played = 0;

    try_again.style.display='none';
    next_level.style.display='none';

    //send
    //player name
    socket.emit('player', {player: player.value, level: level});
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

    dropbox.ondrop = (ev) => {
        ev.preventDefault();
        socket.emit('card_played', {card: document.getElementById(ev.dataTransfer.getData("text").substring(0, 5)).value, player: player.value, left_cards: parseInt(level)-cards_played-1});
        document.getElementById(ev.dataTransfer.getData("text")).style.display = 'none';
        client_cards_box[parseInt(ev.dataTransfer.getData("text").substring(4, 5))].setAttribute('draggable', 'true');

        server_cards[cards_played++] = 101;
    };

    dropbox.ondragover = (ev) => {
        ev.preventDefault();
    };

    client_cards_box.forEach(element => {
        element.ondragstart = (ev) => {
            ev.dataTransfer.setData("text", ev.target.id);
            socket.emit('dragstart', {player_name: player.value});
        };
        element.ondragend = () => {
            socket.emit('dragend', {player_name: player.value});
        };
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
    //get cards
    socket.on('cards', (data) => {
        var temp = new Array(8);
        for(var i=0;i<level;i++){
            temp[i] = data.cards[data.number+i*8];
            client_cards_box[i].style.display='block';
        }
        for(var i=7;i>=level;i--){
            temp[i] = 101;
            client_cards_box[i].style.display='none';
        }
        temp = temp.sort(function(a, b){return a-b});
        for(var i=0;i<8;i++){
            server_cards[i] = temp[i];
        }
        for(var i=0;i<level;i++){
            client_cards[i].innerHTML = server_cards[i].toString();
            client_cards[i].value = server_cards[i];
            document.getElementById('card'+(i+1).toString()+'0').innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'1').innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'2').innerHTML = server_cards[i].toString();
            document.getElementById('card'+(i+1).toString()+'3').innerHTML = server_cards[i].toString();
        }
    });
    //players joined, disconnected
    socket.on('players_list', (data) => {
        var index=0;
        for(var i = 0;i<8;i++){
            if(data.players[i][0]!='' && player.value != data.players[i][0] && data.players[i][3] == level.toString())
            {
                player_name[index].innerHTML = data.players[i][0];
                player_name[index].value = data.players[i][0];
                document.getElementById('player_box'+index.toString()).style.visibility='visible';
                index++;
            }  
        }
        for(var i=6;i>=index;i--){
            document.getElementById('player_box'+i.toString()).style.visibility='hidden';
        }
    });
    //players ready to start
    socket.on('ready', () => {
        setTimeout(()=>{
            document.getElementById('ready_div').style.display='none';
            client_cards_box[0].setAttribute('draggable', 'true');
            left_cards.forEach((item)=>{
                item.innerHTML = level;
            });
        }, 500)

        indicator_text.innerHTML = 'Start!';
        indicator_text.style.color = 'chartreuse';
        setTimeout(() => {
            jQuery(indicator_text).animate({
                fontSize: '12vh'
            }, 400);
            setTimeout(() => jQuery(indicator_text).animate({
                fontSize: '0vh'
            }, 400), 600);
        }, 300);
    });
    //card played
    socket.on('card_played', (data) => {
        for(var i=0;i<7;i++){
            if(player_name[i].value == data.played_by){
                left_cards[i].innerHTML = data.player_left_cards;
            }
        }
        for(var i=0;i<level;i++){
            if(parseInt(data.played_card)>parseInt(server_cards[i])){
                socket.emit('card_played', {card: server_cards[i], player: player.value, left_cards: parseInt(level)-cards_played});
            }
        }
        if(data.result=='lose'){
            client_cards_box.forEach(element => {
                element.setAttribute('draggable', 'false');
            });
            try_again.style.display = 'block';

            level=0;

            indicator_text.innerHTML = 'Lose';
            indicator_text.style.color = 'red';
            jQuery(indicator_text).animate({
                fontSize: '12vh'
            }, 400);
            setTimeout(() => jQuery(indicator_text).animate({
                fontSize: '0vh'
            }, 400), 600);
        }
        else if(data.cards_left==0){
            next_level.style.display = 'block';

            indicator_text.innerHTML = 'Win!';
            indicator_text.style.color = 'green';
            jQuery(indicator_text).animate({
                fontSize: '12vh'
            }, 400);
            setTimeout(() => jQuery(indicator_text).animate({
                fontSize: '0vh'
            }, 400), 600);
        }
        played_cards.innerHTML = data.played_card;
        document.getElementById('played_cards0').innerHTML = data.played_card;
        document.getElementById('played_cards1').innerHTML = data.played_card;
        document.getElementById('played_cards2').innerHTML = data.played_card;
        document.getElementById('played_cards3').innerHTML = data.played_card;
    });
    //dragstart
    socket.on('dragstart', (data) => {
        for(var i=0;i<7;i++){
            if(player_name[i].value == data.player_name){
                player_name[i].style.textShadow = '0.1vh 0 red, -0.1vh 0 red, 0 0.1vh red, 0 -0.1vh red';
            }
        }
    });
    //dragend
    socket.on('dragend', (data) => {
        for(var i=0;i<7;i++){
            if(player_name[i].value == data.player_name){
                player_name[i].style.textShadow = '';
            }
        }
    });
}