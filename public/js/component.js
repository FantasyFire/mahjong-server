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
        this.state = {visible: true, selected: false};
    }

    onclick () {
        this.setState({
            visible: true, selected: !this.state.selected
        });
    }

    render () {
        return `
            <div class='card' style='bottom:${this.state.selected?'10px':''};background-color:${this.state.visible?'white':'green'}'>
                <div class='text'>${this.state.visible?this.props.text:''}</div>
            </div>
        `;
    }
}