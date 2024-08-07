import React from 'react';
import { UIProvider } from '@qualtrics/ui-react';

export default function PanelContainer({ children }) {
	return (
		<UIProvider>
			<div className='panel'>
				{children}
			</div>
		</UIProvider>
	);
}
