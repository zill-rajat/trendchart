import React from 'react';
import { Label, SelectMenu, MenuItem } from '@qualtrics/ui-react';

const chartTypes = [{
	label: 'Bar',
	key: 'bar',
}, {
	label: 'Line',
	key: 'line'
}, {
	label: 'Pie',
	key: 'pie'
}];

export default function ViewConfigurationPanel({
	client,
	data,
	configuration
}) {
	if (!configuration) {
		configuration = {
			chartType: 'bar'
		};
		change(() => configuration);
	}

	return (
		<div className='form-group'>
			<Label className='label'>Chart Style</Label>
			<SelectMenu
				defaultValue={configuration.chartType}
				onChange={(type) => {
					change((configuration) => ({
						...configuration,
						chartType: type
					}));
				}}
			>
				{chartTypes.map(({ label, key }) =>
					<MenuItem key={key} value={key}>{label}</MenuItem>
				)}
			</SelectMenu>
		</div>
	);

	function change(map) {
		client.onViewConfigurationChange(map(configuration));
	}
}
