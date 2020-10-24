import React from 'react';
import ConnectionOverlay from './ConnectionOverlay';
import LogsComponent from './LogsComponent';
import settings from './settings';

export class MainComponent extends React.Component {
    constructor(props) {
        super(props);

        settings.exclusions = new Set(settings.exclusions);
        this.state = {
            connected: false,
            categories: {},
            logs: []
        };
    }

    componentDidMount() {
        this.ws = new WebSocket(`ws://${window.location.host}/ws`);
        this.ws.onopen = () => this.setState({ connected: true });
        this.ws.onclose = () => this.setState({ connected: false });
        this.ws.onerror = () => this.setState({ connected: false });
        this.ws.onmessage = message => {
            this.setState(state => {
                return this.appendLog(state, JSON.parse(message.data))
            })
        }
    }

    componentWillUnmount() {
        this.ws.close();
    }

    appendLog(state, message) {
        const category = message.container_name || 'unknown';
        const text = message.log || 'unknown';

        if (state.categories[category]) {
            state.categories[category].count += 1
        } else {
            state.categories[category] = { count: 1, selected: !settings.exclusions.has(category) }
        }

        if (state.categories[category].selected) {
            const log = state.logs.length >= 500 ? state.logs.shift() : { key: state.logs.length }
            log.category = category;
            log.text = text;
            state.logs.push(log);
        }

        return state;
    }

    toggleCategory(catName) {
        this.setState(state => {
            const cat = state.categories[catName];
            if (cat.selected) {
                cat.selected = false
                settings.exclusions.add(catName)
            } else {
                cat.selected = true
                settings.exclusions.delete(catName)
            }
            return { categories: state.categories }
        })
    }

    render() {
        const categoriesStyle = {
            padding: '.5em',
            margin: 0,
            borderRight: '1px solid lightgray',
            display: 'flex',
            flexDirection: 'column',
            flex: '0 0 auto'
        }
        const logsStyle = {
            flex: '1 1 auto'
        }

        const catEls = Object.keys(this.state.categories).map(key => {
            const val = this.state.categories[key]
            return <li key={key} className="highlight"><input type="checkbox" checked={val.selected} onChange={() => this.toggleCategory(key)} /> {val.count} {key}</li>
        });

        return (
            <div style={{ flexGrow: 1, display: 'flex' }}>
                <ul style={categoriesStyle}>
                    {catEls}
                </ul>
                <LogsComponent style={logsStyle} logs={this.state.logs} />
                <ConnectionOverlay connected={this.state.connected} />
            </div>
        );
    }
}
