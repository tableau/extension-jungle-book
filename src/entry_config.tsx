import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import Configure from './Configure';

declare global {
	interface Window { tableau: any }
}

ReactDOM.render(<Configure />, document.getElementById('root'));
