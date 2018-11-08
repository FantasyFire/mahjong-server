const StateMachine = require('javascript-state-machine');

let fsm = new StateMachine({
    init: 'A',
    transitions: [
        {name: 'test', from: 'A', to: 'B'},
        {name: 'test', from: 'B', to: 'A'},
        {name: 'AtoB', from: 'A', to: 'B'},
        {name: 'BtoA', from: 'B', to: 'A'}
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
        },
        onTest(transition) {
            console.log(transition);
        }
    }
});

fsm.test();
fsm.test();