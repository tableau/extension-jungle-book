import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import Home from './Home';

declare global {
	interface Window { tableau: any }
}

ReactDOM.render(<Home />, document.getElementById('root'));
