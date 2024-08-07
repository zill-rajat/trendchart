import '@qualtrics/base-styles/dist/base-styles.css'
import './styles.css';

import React from 'react';
import ReactDOM from 'react-dom';

export default function render(Component) {
	ReactDOM.render(
		<Component />,
		document.getElementById('root'),
	);
}
