const StateMachine = require('javascript-state-machine');

let fsm = new StateMachine({
    init: 'A',
    transitions: [
        {name: 'start', from: 'A', to: 'B'}
    ],
    methods: {
        onStart () {
            console.log('onStart');
        },
        onA () {
            console.log('onA');
        },
        onB () {
            console.log('onB');
        }
    }
});

fsm.start();