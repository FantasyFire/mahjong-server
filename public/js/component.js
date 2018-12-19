const createDOMFromString = (domString) => {
    const div = document.createElement('div');
    div.innerHTML = domString;
    return div;
};

class Component {
    constructor (props = {}) {
        this.props = props;
    }

    setState (state) {
        const oldEl = this.el;
        this.state = Object.assign({}, this.state, state); // 简单的合并状态
        this.el = this.renderDOM();
        this.wrapper && this.wrapper.replaceChild(this.el, oldEl);
    }

    renderDOM () {
        this.el = createDOMFromString(this.render());
        this.onclick && this.el.addEventListener('click', this.onclick.bind(this), false);
        return this.el;
    }
}

class Card extends Component {
    constructor (props) {
        super(props);
        this.state = {selected: false};
    }

    onclick () {
        if (this.state.selected) {
            this.props.onPlayCard && this.props.onPlayCard(this.props.index);
        } else {
            this.setState({selected: true});
        }
    }

    unselect () {
        this.setState({selected: false});
    }

    render () {
        return `
            <div class="card${this.state.selected?' selected':''}" ${this.props.index==undefined ? "" : `onclick="playCard(${this.props.index})"`} style="background-color:#${['f99','9f9','99f','fff','fff','fff'][number2index(this.props.number)]}">
                <div class="text">${number2text(this.props.number)}</div>
            </div>
        `;
    }
}

class CardGroup extends Component {
    constructor (props) {
        super(props);
        this.state = {visible: true, selected: false};
    }

    renderCard (text) {
        let card = new Card({text});
        return card.render();
    }

    render () {
        return `
            <div class='card-group' style='background-color:red}'>
                ${this.renderCard('3条')}
                ${this.renderCard('3筒')}
                ${this.renderCard('东风')}
            </div>
        `;
    }
}