import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ConfigureShape from './ConfigureShape';

declare global {
    interface Window { tableau: any; }
}

ReactDOM.render(<ConfigureShape />, document.getElementById('root'));
