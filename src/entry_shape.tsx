import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import ConfigureShape from './ConfigureShape';

declare global {
	interface Window { tableau: any }
}

ReactDOM.render(<ConfigureShape />, document.getElementById('root'));
