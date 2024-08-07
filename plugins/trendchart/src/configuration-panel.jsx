import render from './render';
import DataConfigurationPanel from './data-configuration-panel';
import PanelContainer from './panel-container';
import { WithClient } from '@qualtrics/reporting-widget-client';

function ConfigurationPanel() {
	return (
		<WithClient height={262}>
			{Content}
		</WithClient>
	)
}

function Content({
	client,
	dataConfiguration,
	viewConfiguration,
	dataSource,
	data,
	filters
}) {
	return (
		<PanelContainer>
			<DataConfigurationPanel
				client={client}
				configuration={dataConfiguration}
			/>

		</PanelContainer>
	);

	/* View container can be added

			<ViewConfigurationPanel
				client={client}
				data={data}
				configuration={viewConfiguration}
			/>
	
	*/
}

render(ConfigurationPanel);
