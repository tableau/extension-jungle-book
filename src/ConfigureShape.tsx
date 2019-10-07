import React, { useEffect, useState } from 'react';
import { Button, DropdownSelect, Spinner } from '@tableau/tableau-ui';
import { CategoricalDomain, CategoricalFilter, TableauError } from '@tableau/extensions-api-types';
import './ConfigureShape.css';

interface Filter {
	name: string;
	currentValue: string;
	values: string[];
}

function Config() {

	const [loading, setLoading] = useState<boolean>(true);
	const [filters, setFilters] = useState<Array<Filter>>([]);

	useEffect(() => {
		tableau.extensions.initializeDialogAsync().then((payload: string) => {
			const settings = tableau.extensions.settings.getAll();
			const dimensions = JSON.parse(settings.dimensions);
			const values = JSON.parse(payload);
			for (const dimension of dimensions) {
				let currentValue;
				if (payload === 'null') {
					currentValue = null;
				} else {
					const findValue = values.find((filter: { field: string; value: number }) => filter.field === dimension)
					currentValue = findValue ? findValue.value : null;
				}
				getValues(dimension, currentValue);
			}
		}, (error: TableauError) => {
			alert('Initialization failed: ' + error.toString());
		});
	}, []);

	// Pull domain from selected filters
	const getValues = (dimension: string, currentValue: string) => {
		const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
		const settings = tableau.extensions.settings.getAll();
		const selectedWorksheets = JSON.parse(settings.worksheets);
		const values: string[] = [];
		const filterPromises = [];
		for (const worksheet of worksheets) {
			if (selectedWorksheets.includes(worksheet.name)) {
				filterPromises.push(worksheet.getFiltersAsync());
			}
		}

		// Wait to get all filters from all worksheets then populate list
		Promise.all(filterPromises).then((filterResults) => {
			let counter = 0;
			let resultsCount = 0;
			for (const filters of filterResults) {
				resultsCount += filters.length;
			}
			for (const filters of filterResults) {
				for (const filter of filters) {
					const categoricalFilter = filter as CategoricalFilter;

					// eslint-disable-next-line
					categoricalFilter.getDomainAsync().then((domain: CategoricalDomain) => {
						if (dimension === filter.fieldName) {
							for (const value of domain.values) {
								if (values.indexOf(value.value) === -1) {
									values.push(value.value);
								}
							}
						}
						counter++
						if (counter === resultsCount) {
							values.sort();
							setFilters(filters => [...filters, { name: dimension, currentValue: currentValue !== null ? currentValue : values[0], values }])
							setLoading(false);
						}
					});
				}
			}
		}).catch((err: Error) => {
			console.log('Error while populating filter values: ' + err.toString());
		});
	}

	// Update seletion in dropdown
	const updateFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = e.target.value;
		const dimension = e.target.id;
		const newFilters = [...filters];
		newFilters.map(filter => {
			if (filter.name === dimension) {
				filter.currentValue = newValue;
			}
			return filter;
		})
		setFilters(newFilters);
	}

	// Delete the shape
	const remove = () => {
		tableau.extensions.ui.closeDialog('delete');
	}

	// Save settings
	const submit = () => {
		setLoading(true);
		const values = [];
		for (const filter of filters) {
			values.push({
				field: filter.name,
				value: filter.currentValue,
			});
		}
		tableau.extensions.ui.closeDialog(JSON.stringify(values));
	}

	return (
		<>
			<div className={`spinner${loading ? '' : ' hidden'}`}><Spinner color='dark' /></div>
			<div className='sectionTitle'>Configure Shape
				<div className='tooltip'>
					<svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 15 15'>
						<rect x='7' y='6' width='1' height='5' fillRule='evenodd' clipRule='evenodd' fill='#666766' />
						<rect x='7' y='4' width='1' height='1' fillRule='evenodd' clipRule='evenodd' fill='#666766' />
						<path d='M7.5,1C3.9,1,1,3.9,1,7.5S3.9,14,7.5,14 S14,11.1,14,7.5S11.1,1,7.5,1z M7.5,13C4.5,13,2,10.5,2,7.5C2,4.5,4.5,2,7.5,2S13,4.5,13,7.5C13,10.5,10.5,13,7.5,13z' fillRule='evenodd' clipRule='evenodd' fill='#666766' />
					</svg>
					<p className='tooltiptext'>
						Note: If you don't see values listed below, make sure those filters are on the worksheet and values are not filtered out.
					</p>
				</div></div>
			<div className='filters'>
				{filters.map(filter =>
					<div className='selector' key={filter.name}>
						<div className='label'>{filter.name} filter</div>
						<DropdownSelect
							kind='line'
							id={filter.name}
							style={{ width: '100%' }}
							onChange={updateFilter}
							value={filter.currentValue}
						>
							{filter.values.map(option => <option value={option} key={option}>{option}</option>)}
							{filters.length > 1 ? <option value='' style={{ fontStyle: 'italic' }}>Do not filter this field</option> : ''}
						</DropdownSelect>
					</div>
				)}
			</div>
			<div className='footer'>
				<div className='deleteButton'>
					<Button
						kind='destructive'
						children='Delete'
						onClick={remove}
						id='delete'
					/>
				</div>
				<div>
					<Button
						kind='primary'
						children='OK'
						onClick={submit}
						id='ok'
						disabled={filters.find(filter => filter.currentValue !== '') === undefined}
					/>
				</div>
			</div>
		</>
	);
}

export default Config;
