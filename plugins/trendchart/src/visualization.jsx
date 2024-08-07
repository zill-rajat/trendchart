import React from 'react';
import { WithClient } from '@qualtrics/reporting-widget-client';
import render from './render';
import Table from './heatmap-table';

function Visualization() {
	return (
		<WithClient>
			{(props) =>
				<Content
					// Force re-mount when chart type has changed
					//key={props.viewConfiguration.chartType}
					{...props}
				/>
			}
		</WithClient>
	);
}

function Content({ data, viewConfiguration }) {
	return (
    <div className="App" style={{height: '100%', overflowY: 'scroll'} }>
      <Table shapeData={data}/>
    </div>
  );
}

render(Visualization);
