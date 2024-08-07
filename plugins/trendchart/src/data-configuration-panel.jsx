import './styles.css';
import React, { useEffect, useState, useCallback } from 'react';
import { Label, LoadingSpinner, SelectMenu, MenuItem } from '@qualtrics/ui-react';

const groupByOptions = [
	{ name: 'Month', fieldId: 'month' },
	{ name: 'Quarter', fieldId: 'quarter' },
	{ name: 'Year', fieldId: 'year' }
];

const metricOptions = [
	{ name: 'Top 2 Box', fieldId: 'top2Box', function: 'topBottomBox', boxRange: [1, 2] },
	{ name: 'Top Box', fieldId: 'topBox', function: 'topBottomBox', boxRange: [1, 1] },
	{ name: 'Average', fieldId: 'average', function: 'avg' },
	{ name: 'Count', fieldId: 'count', function: 'count' }

];

export default function DataConfigurationPanel({ client, configuration }) {

	const { metric, dimension, groupBy } = extractConfiguration(configuration);

	const [definition, setDefinition] = useState(null);
	const [selectedGroupBy, setSelectedGroupBy] = useState(groupBy? groupBy : groupByOptions[0].fieldId);
	const [selectedMetric, setSelectedMetric] = useState(metric? metric : metricOptions[0]);

	useEffect(() => {
		let canceled = false;

		const fetchDefinition = async () => {
			try {
				const { fieldsetDefinition } = await client.getDataSourceDefinition();
				if (!canceled) {
					setDefinition(fieldsetDefinition);
				}
			} catch (error) {
				if (!canceled) {
					console.error('Error fetching data source definition:', error);
				}
			}
		};

		if (!definition) {
			fetchDefinition();
		}

		return () => {
			canceled = true;
		};
	}, [client, definition]);

	const updateConfiguration = useCallback((configMapper) => {
		if (!definition) return; // Ensure definition is available

		const baseConfig = {
			component: "fieldsets-aggregate",
			metrics: [{
				id: `metric_${selectedMetric.fieldId}`,
				label: selectedMetric.name,
				function: selectedMetric.function,
				...(selectedMetric.boxRange ? { boxRange: selectedMetric.boxRange } : {})
			}],
			axes: [
				{
					id: "rows",
					label: "Rows",
					dimensions: [
						{
							id: "d59bd6bf-b211-4499-93a0-6f510c9e62a5",
							breakoutByValue: false,
							label: "Discharge MG",
							fieldId: "unused_8ba7jiq",
							order: {
								key: "label",
								direction: "asc"
							}
						}
					]
				},
				{
					id: "columns",
					label: "Columns",
					dimensions: [
						{
							fieldId: "recordedDate",
							id: "3a591d86-5c11-4be5-961d-64aea2c139cd",
							groupBy: [selectedGroupBy],
							order: {
								key: "id",
								direction: "asc"
							}
						}
					]
				}
			],
			isComplete: selectedGroupBy && selectedMetric,
			combineGroupedLeafMembers: true,
			comparisons: [],
			dateFormat: "detailed",
			calculations: [],
			includeRecordCount: true,
			timezone: "GMT",
			localizeDataLabels: true,
			defaultLanguageKeys: true
		};

		const newConfiguration = {
			...configMapper(baseConfig),
			component: 'fieldsets-aggregate',
			fieldsetId: definition.fieldSetId,
		};
		newConfiguration.isComplete = newConfiguration.metrics && newConfiguration.axes;

		client.onDataConfigurationChange(newConfiguration);
	}, [client, definition, selectedGroupBy, selectedMetric]);

	const handleDimensionChange = useCallback((field) => {
		updateConfiguration((prevConfig) => ({
			...prevConfig,
			axes: [
				{
					id: "rows",
					label: "Rows",
					dimensions: [
						{
							id: "row_dimension_id",
							breakoutByValue: false,
							label: field.name,
							fieldId: field.fieldId,
							order: {
								key: "label",
								direction: "asc"
							}
						}
					]
				},
				{
					id: "columns",
					label: "Columns",
					dimensions: [
						{
							fieldId: "recordedDate",
							id: "3a591d86-5c11-4be5-961d-64aea2c139cd",
							groupBy: [selectedGroupBy],
							order: {
								key: "id",
								direction: "asc"
							}
						}
					]
				}
			]
		}));
	}, [updateConfiguration]);

	const handleGroupByChange = useCallback((field) => {
		setSelectedGroupBy(field.fieldId);
		updateConfiguration((prevConfig) => ({
			...prevConfig,
			axes: [
				{
					id: "rows",
					label: "Rows",
					dimensions: prevConfig.axes[0].dimensions
				},
				{
					id: "columns",
					label: "Columns",
					dimensions: [
						{
							...prevConfig.axes[1].dimensions[0],
							groupBy: [field.fieldId]
						}
					]
				}
			]
		}));
	}, [updateConfiguration]);

	const handleMetricChange = useCallback((field) => {
		setSelectedMetric(field);
		updateConfiguration((prevConfig) => ({
			...prevConfig,
			metrics: [{
				id: `metric_${field.fieldId}`,
				label: field.name,
				function: field.function,
				...(field.boxRange ? { boxRange: field.boxRange } : {})
			}]
		}));
	}, [updateConfiguration]);

	if (!definition) {
		return (
			<div className='spinner'>
				<LoadingSpinner show size="medium" />
			</div>
		);
	}

	return (
		<>
			<FieldSelectMenu
				client={client}
				label={client.getText('configurationPanel.dimension')}
				defaultValue={dimension?.fieldId}
				fields={getFieldsOfType(definition, 'FieldGroup')}
				placement='bottom-start'
				onChange={handleDimensionChange}
			/>
			<FieldSelectMenu
				client={client}
				label='Group By'
				defaultValue={selectedGroupBy}
				fields={groupByOptions}
				placement='bottom-start'
				onChange={handleGroupByChange}
			/>
			<FieldSelectMenu
				client={client}
				label={client.getText('configurationPanel.metric')}
				defaultValue={selectedMetric?.fieldId ? selectedMetric.fieldId : selectedMetric.id.split('_')[1]}
				fields={metricOptions}
				placement='top-start'
				onChange={handleMetricChange}
			/>
		</>
	);

	function extractConfiguration(configuration) {
		let metric = null;
		let dimension = null;
		let groupBy = null;

		if (configuration) {
			const { metrics, axes } = configuration;
			if (metrics) {
				metric = metricOptions.find(m => m.fieldId === metrics[0].id.split('_')[1]) || null;
			}
			if (axes) {
				dimension = axes[0]?.dimensions[0] || null;
				groupBy = axes[1]?.dimensions[0]?.groupBy[0] || null;
			}
		}

		return { metric, dimension, groupBy };
	}

	function getFieldsOfType(definition, ...types) {
		return definition.fieldSetView.filter(field => types.includes(field.type));
	}
}

function FieldSelectMenu({ client, defaultValue, fields, label, onChange, placement }) {
	return (
		<div className='form-group'>
			<Label className='label'>{label}</Label>
			<SelectMenu
				defaultValue={defaultValue}
				defaultLabel={client.getText('configurationPanel.selectAField')}
				placement={placement}
				maxHeight='100px'
				disabled={fields.length === 0}
				onChange={fieldId => onChange(fields.find(field => field.fieldId === fieldId))}
			>
				{fields.map(({ fieldId, name }) => (
					<MenuItem key={fieldId} className='menu-item' value={fieldId}>
						{name}
					</MenuItem>
				))}
			</SelectMenu>
		</div>
	);
}
