const KEY_LEFT = 'ArrowLeft';
const KEY_RIGHT = 'ArrowRight';
document.addEventListener('DOMContentLoaded', () =>{

    const socket = io("https://browserjam-event-server.herokuapp.com/bjurns-invaders");
    const MAX_X = 100;
    const MAX_Y = 100;

    const battlefield = document.getElementById("battlefield");
    const players = {};
    const invaders = {};
    const keys = {};


    window.players = players;

    let invaderId = 0;

    // Helper functions

    function random(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clockTick() {
        showPlayers();
        showInvaders();
        moveMe();
        moveInvaders();
        evaluate();
        window.requestAnimationFrame(clockTick);
    }

    function showPlayers() {
        for (const player of Object.values(players)) {
            let element = document.getElementById(`player_${player.id}`);
            if (!element) {
                element = document.createElement('div');
                element.classList.add('player');
                element.id = `player_${player.id}`;

                let type = document.createElement('div');
                type.classList.add('type', `type${player.type}`);
                element.appendChild(type);
                battlefield.appendChild(element);
            }
            element.style.top = `${battlefield.clientHeight - 70}px`;
            element.style.left = `${player.x / MAX_X * (battlefield.clientWidth - 140)}px`;
        }
    }

    function showInvaders() {
        for (const invader of Object.values(invaders)) {
            let element = document.getElementById(`invader_${invader.id}`);
            if (!element) {
                element = document.createElement('div');
                element.classList.add('invader', `type${invader.type}`);
                element.id = `invader_${invader.id}`;
                battlefield.appendChild(element);
            }
            element.style.top = `${(invader.y / MAX_Y * battlefield.clientHeight) - 70}px`;
            element.style.left = `${invader.x / MAX_X * (battlefield.clientWidth - 70)}px`;
        }
    }

    function moveMe() {
        if (!(keys[KEY_LEFT] || keys[KEY_RIGHT])) return;
        const me = Object.values(players).find(p => p.id == socket.id);

        if (!me) return;
        me.x += keys[KEY_LEFT] ? -2 : 2;
        me.x = Math.max(0, me.x);
        me.x = Math.min(MAX_X, me.x);
        socket.volatile.emit('update', me, {volatile: true});
    }

    function moveInvaders() {
        for (const invader of Object.values(invaders)) {
            invader.y += invader.speed / 10;
        }
    }

    function evaluate() {
        const me = Object.values(players).find(p => p.id == socket.id);

        for (const invader of Object.values(invaders).filter(i => i.type == me.type)) {
            if (invader.y > MAX_Y * 0.9) {
                if(Math.abs((me.x + 70) - (invader.x + 35)) < 70) {
                    document.getElementById(`invader_${invader.id}`).remove();
                    delete invaders[invader.id];

                    socket.emit('state', {
                        killed: invader.id
                    })
                }
            }
        }

        for (const invader of Object.values(invaders)) {
            if (invader.y > MAX_Y * 1.1) {
                document.getElementById(`invader_${invader.id}`).remove();
                delete invaders[invader.id];
            }
        }
    }

    function spawnInvader() {
        let newInvader = {
            invader: {
                x: random(0, MAX_X),
                type: random(1, Object.values(players).length),
                speed: random(4, 8)
            }
        };
        socket.emit('state', newInvader)
        window.setTimeout(spawnInvader, random(2000, 5000));
    }

    // Event listeners
    socket.on('join', player => {
        players[player.id] = player;
        player.type = Object.values(players).length;
    });
    socket.on('update', player => players[player.id] = player);
    socket.on('leave', player => {
        document.getElementById(`player_${player.id}`).remove();
        delete players[player.id];
    });

    socket.on('state', (state, player) => {
        console.log(state)
        if (state == null) {
            window.setTimeout(spawnInvader, 500);
            return;
        }

        if (state.invader) {
            const invader = {
                id: invaderId,
                x: state.invader.x,
                y: 0,
                type: state.invader.type,
                speed: state.invader.speed
            }
            invaderId += 1;
            invaders[invader.id] = invader;
            return;
        }

        if (state.killed) {
            let invader = document.getElementById(`invader_${state.killed}`);
            if (invader) {
                invader.remove();
            }
            delete invaders[state.killed];
        }
    });

    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    // Start!

    socket.emit('join', {
        player: {
            x: MAX_X / 2
        }
    });

    window.requestAnimationFrame(clockTick);
});
