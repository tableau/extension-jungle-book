import React from 'react';
import { mount, shallow } from 'enzyme';
import './__mocks__/tableau';
import Home from '../Home';
import { modes } from '../Home';

const update = async (wrapper: any) => {
	await new Promise(setImmediate);
	wrapper.update();
}

describe('Basic rendering', () => {
	it('Renders without crashing', () => {
		shallow(<Home />);
	});
});

describe('Adds shapes', () => {

	tableau.extensions.settings.set('configured', 'true');
	tableau.extensions.settings.set('imageDimensions', '[100,100]');
	tableau.extensions.settings.set('dimensions', '["AnimalGroup","Zone/Beat"]');
	tableau.extensions.settings.set('worksheets', '["Sheet 1","Sheet 2"]');
	tableau.extensions.environment.mode = 'authoring';
	tableau.extensions.settings.set('shapes', '[]');
	tableau.extensions.settings.set('image', '{"name":"hi","ext":"png","data":""}');

	const wrapper = mount(<Home />);

	it('Clicking button changes mode', async () => {
		await update(wrapper);
		Object.values(modes.EDIT).forEach(mode => {
			wrapper.find(`#${mode}`).simulate('click');
			expect(wrapper.find('#menuBox').prop('data-mode')).toBe(mode);
		});
	});

	it('Clicking and dragging in lasso mode creates new freeform polygon', () => {
		const mockedEvents = [
			{
				button: 0,
				pageX: 10,
				pageY: 10,
			},
			{
				button: 0,
				pageX: 10,
				pageY: 30,
			},
			{
				button: 0,
				pageX: 30,
				pageY: 30,
			},
			{
				button: 0,
				pageX: 30,
				pageY: 10,
			},
		];

		// Set mode
		wrapper.find(`#lasso`).simulate('click');

		// Create shape
		wrapper.find(`#selectionBox`).simulate('mouseDown', mockedEvents[0]);
		for (let x = 1; x <= 3; x++) {
			wrapper.find(`#selectionBox`).simulate('mouseMove', { button: 0, pageX: mockedEvents[x].pageX, pageY: mockedEvents[x].pageY });
		}
		// Close shape
		wrapper.find(`#selectionBox`).simulate('mouseUp', { button: 0 });
		expect(wrapper.find('#svgRoot').children().children().length).toBe(1)
		expect(wrapper.find('#svgRoot polygon').exists()).toEqual(true);
		expect(wrapper.find('#svgRoot polygon').prop('points')).toBe('10,10 10,30 30,30 30,10');
	});

	it('Clicking and dragging in ellipse mode creates new Ellipse', () => {
		const mockedEvent = {
			button: 0,
			pageX: 20,
			pageY: 20,
		};

		// Set mode
		wrapper.find(`#ellipse`).simulate('click');

		// Create shape
		wrapper.find(`#selectionBox`).simulate('mouseDown', mockedEvent);
		for (let x = 20; x <= 40; x++) {
			for (let y = 20; y <= 40; y++) {
				wrapper.find(`#selectionBox`).simulate('mouseMove', { button: 0, pageX: x, pageY: y });
			}
		}
		// Close shape
		wrapper.find(`#selectionBox`).simulate('mouseUp', { button: 0 });

		expect(wrapper.find('#svgRoot').children().children().length).toBe(2);
		expect(wrapper.find('#svgRoot ellipse').exists()).toEqual(true);
		expect(wrapper.find('#svgRoot ellipse').prop('cx')).toBe(mockedEvent.pageX);
		expect(wrapper.find('#svgRoot ellipse').prop('cy')).toBe(mockedEvent.pageY);
		const rx: any = wrapper.find('#svgRoot ellipse').prop('rx');
		const ry: any = wrapper.find('#svgRoot ellipse').prop('ry');
		expect(rx).toBe(20);
		expect(ry).toBe(20);
	});

	it('Clicking and dragging in rectangle mode creates new Rectangle', () => {
		const mockedEvent = {
			button: 0,
			pageX: 30,
			pageY: 30,
		};

		// Set mode
		wrapper.find(`#rectangle`).simulate('click');

		// Create shape
		wrapper.find(`#selectionBox`).simulate('mouseDown', mockedEvent);
		for (let x = 30; x >= 10; x--) {
			for (let y = 30; y >= 10; y--) {
				wrapper.find(`#selectionBox`).simulate('mouseMove', { button: 0, pageX: x, pageY: y });
			}
		}
		// Close shape
		wrapper.find(`#selectionBox`).simulate('mouseUp', { button: 0 });

		expect(wrapper.find('#svgRoot').children().children().length).toBe(3);
		expect(wrapper.find('#svgRoot rect').exists()).toEqual(true);
		expect(wrapper.find('#svgRoot rect').prop('x')).toBe(10);
		expect(wrapper.find('#svgRoot rect').prop('y')).toBe(10);
		expect(wrapper.find('#svgRoot rect').prop('width')).toBe(20);
		expect(wrapper.find('#svgRoot rect').prop('height')).toBe(20);
	})
});

describe('Shapes settings get saved', () => {
	const wrapper = mount(<Home />);

	it('Creates shape', async () => {
		await update(wrapper);
		const mockedEvent = {
			button: 0,
			pageX: 30,
			pageY: 30,
		};

		// Set mode
		wrapper.find(`#rectangle`).simulate('click');

		// Create shape
		wrapper.find(`#selectionBox`).simulate('mouseDown', mockedEvent);
		for (let x = 30; x >= 10; x--) {
			for (let y = 30; y >= 10; y--) {
				wrapper.find(`#selectionBox`).simulate('mouseMove', { button: 0, pageX: x, pageY: y });
			}
		}

		// Close shape
		wrapper.find(`#selectionBox`).simulate('mouseUp', { button: 0 });

		expect(wrapper.find('#svgRoot').children().children().length).toBe(1);
		expect(wrapper.find('#svgRoot rect').exists()).toEqual(true);
		expect(wrapper.find('#svgRoot rect').prop('x')).toBe(10);
		expect(wrapper.find('#svgRoot rect').prop('y')).toBe(10);
		expect(wrapper.find('#svgRoot rect').prop('width')).toBe(20);
		expect(wrapper.find('#svgRoot rect').prop('height')).toBe(20);
	});

	it('Saves shapes to settings', () => {
		let shapes = tableau.extensions.settings.getAll().shapes;
		shapes = JSON.parse(shapes);
		shapes[0].id = '';
		const rectangle = '[{"id":"","type":"rectangle","coords":[10,10],"points":[[30,30]],"dimensions":[20,20],\"radius\":[0,0],"originalPoints":[],"values":[{"field":"AnimalGroup","value":"Lion"}]}]';
		expect(shapes.length).toBe(1);
		expect(JSON.stringify(shapes)).toEqual(rectangle);
	})
})

describe('Loads settings', () => {
	it('Creates shapes from settings', async () => {
		tableau.extensions.settings.set('shapes', '[{"id":"","type":"rectangle","coords":[10,10],"points":[[30,30]],"dimensions":[20,20],"values":[{"field":"AnimalGroup","value":"Lion"}]}]');
		const wrapper = mount(<Home />);
		await update(wrapper);

		expect(wrapper.find('#svgRoot').children().children().length).toBe(1);
		expect(wrapper.find('#svgRoot rect').exists()).toEqual(true);
		expect(wrapper.find('#svgRoot rect').prop('x')).toBe(10);
		expect(wrapper.find('#svgRoot rect').prop('y')).toBe(10);
		expect(wrapper.find('#svgRoot rect').prop('width')).toBe(20);
		expect(wrapper.find('#svgRoot rect').prop('height')).toBe(20);
	});

})

describe('Can change worksheet filters', () => {

	it('Changes filters', async () => {
		const multi = {
			button: 0,
			shiftKey: true
		}
		tableau.extensions.environment.mode = 'viewing';
		tableau.extensions.settings.set('dimensions', '["AnimalGroup","Zone/Beat"]');
		tableau.extensions.settings.set('shapes', '[{"id":"1","type":"rectangle","coords":[10,10],"points":[[30,30]],"dimensions":[20,20],"values":[{"field":"AnimalGroup","value":"Lion"},{"field":"Zone/Beat","value":"L1"}]},{"id":"2","type":"ellipse","coords":[286,115],"points":[[286,115]],"dimensions":[0,0],"radius":39.698866482558415,"values":[{"field":"AnimalGroup","value":"Cheetah"},{"field":"Zone/Beat","value":"C2"}]},{"id":"3","type":"lasso","coords":[218,33],"points":[[218,33],[193,20],[192,20],[191,20],[190,20],[188,20],[185,20],[184,20],[182,20],[181,20],[180,20],[178,20],[177,21],[175,21],[174,23],[172,24],[171,25],[170,27],[170,28],[170,30],[170,32],[170,35],[170,39],[169,41],[169,46],[169,49],[169,52],[169,55],[169,56],[169,60],[169,63],[169,65],[169,68],[170,72],[170,73],[170,74],[171,76],[172,77],[173,78],[176,79],[181,79],[185,80],[190,80],[192,80],[196,81],[198,81],[201,81],[203,81],[208,80],[210,80],[211,80],[214,79],[216,79],[217,79],[219,78],[220,77],[222,75],[223,74],[224,73],[224,71],[226,68],[226,65],[226,63],[226,61],[226,58],[226,56],[226,55],[226,53],[226,52],[226,51],[226,49],[226,47],[226,46],[226,45],[226,44],[226,43],[226,42],[226,41]],"dimensions":[0,0],"values":[{"field":"AnimalGroup","value":"Monkey"},{"field":"Zone/Beat","value":""}]}]');
		const wrapper = mount(<Home />);
		await update(wrapper);

		// Filter 1 on
		wrapper.find('#svgRoot rect').simulate('click');
		for (const worksheet of tableau.extensions.dashboardContent.dashboard.worksheets) {
			expect(worksheet.applyFilterAsync).toHaveBeenCalledTimes(2);
			const expectedCalls = [
				['AnimalGroup', ['Lion'], 'replace', { isExcludeMode: false }],
				['Zone/Beat', ['L1'], 'replace', { isExcludeMode: false }]
			]
			expect(worksheet.applyFilterAsync.mock.calls).toEqual(expectedCalls);
			worksheet.applyFilterAsync.mockClear();
		}
		expect(wrapper.find('#svgRoot rect').prop('className')).toBe('filter hiddenFilter activeFilter')
		expect(wrapper.find('#svgRoot Rectangle').prop('active')).toBe(true)

		// Filter 2 on
		wrapper.find('#svgRoot ellipse').simulate('click', multi);
		for (const worksheet of tableau.extensions.dashboardContent.dashboard.worksheets) {
			expect(worksheet.applyFilterAsync).toHaveBeenCalledTimes(2);
			const expectedCalls = [
				['AnimalGroup', ['Lion', 'Cheetah'], 'replace', { isExcludeMode: false }],
				['Zone/Beat', ['L1', 'C2'], 'replace', { isExcludeMode: false }]
			]
			expect(worksheet.applyFilterAsync.mock.calls).toEqual(expectedCalls);
			worksheet.applyFilterAsync.mockClear();
		}
		expect(wrapper.find('#svgRoot ellipse').prop('className')).toBe('filter hiddenFilter activeFilter');
		expect(wrapper.find('#svgRoot Ellipse').prop('active')).toBe(true);

		// Filter 1 off 
		wrapper.find('#svgRoot rect').simulate('click', multi);
		for (const worksheet of tableau.extensions.dashboardContent.dashboard.worksheets) {
			expect(worksheet.applyFilterAsync).toHaveBeenCalledTimes(2);
			const expectedCalls = [
				['AnimalGroup', ['Cheetah'], 'replace', { isExcludeMode: false }],
				['Zone/Beat', ['C2'], 'replace', { isExcludeMode: false }]
			]
			expect(worksheet.applyFilterAsync.mock.calls).toEqual(expectedCalls);
			worksheet.applyFilterAsync.mockClear();
		}

		expect(wrapper.find('#svgRoot rect').prop('className')).toBe('filter hiddenFilter')
		expect(wrapper.find('#svgRoot Rectangle').prop('active')).toBe(false)

		// Filter 2 off
		wrapper.find('#svgRoot ellipse').simulate('click');
		for (const worksheet of tableau.extensions.dashboardContent.dashboard.worksheets) {
			expect(worksheet.clearFilterAsync).toHaveBeenCalledTimes(2);
			const expectedCalls = [
				['AnimalGroup'],
				['Zone/Beat']
			]
			expect(worksheet.clearFilterAsync.mock.calls).toEqual(expectedCalls);
			worksheet.clearFilterAsync.mockClear();
		}
		expect(wrapper.find('#svgRoot ellipse').prop('className')).toBe('filter hiddenFilter');
		expect(wrapper.find('#svgRoot Ellipse').prop('active')).toBe(false);

		// Filter 3 on
		wrapper.find('#svgRoot polygon').simulate('click');
		for (const worksheet of tableau.extensions.dashboardContent.dashboard.worksheets) {
			expect(worksheet.applyFilterAsync).toHaveBeenCalledTimes(2);
			const expectedCalls = [
				['AnimalGroup', ['Monkey'], 'replace', { isExcludeMode: false }],
				['Zone/Beat', [''], 'all', { isExcludeMode: false }]
			]
			expect(worksheet.applyFilterAsync.mock.calls).toEqual(expectedCalls);
			worksheet.applyFilterAsync.mockClear();
		}
		expect(wrapper.find('#svgRoot polygon').prop('className')).toBe('filter hiddenFilter activeFilter')
		expect(wrapper.find('#svgRoot Lasso').prop('active')).toBe(true)

		// Clear all filters
		wrapper.find('#svgRoot').simulate('mousedown');
		wrapper.find('#svgRoot').simulate('mouseup');
		for (const worksheet of tableau.extensions.dashboardContent.dashboard.worksheets) {
			expect(worksheet.clearFilterAsync).toHaveBeenCalledTimes(2);
			const expectedCalls = [
				['AnimalGroup'],
				['Zone/Beat']
			]
			expect(worksheet.clearFilterAsync.mock.calls).toEqual(expectedCalls);
		}
		expect(wrapper.find('#svgRoot ellipse').prop('className')).toBe('filter hiddenFilter')
		expect(wrapper.find('#svgRoot Ellipse').prop('active')).toBe(false)
		expect(wrapper.find('#svgRoot rect').prop('className')).toBe('filter hiddenFilter')
		expect(wrapper.find('#svgRoot Rectangle').prop('active')).toBe(false)
		expect(wrapper.find('#svgRoot polygon').prop('className')).toBe('filter hiddenFilter')
		expect(wrapper.find('#svgRoot Lasso').prop('active')).toBe(false)
	});

})

describe('Can update filter settings', () => {

	it('Opens shape edit form and updates filter', async () => {
		tableau.extensions.environment.mode = 'authoring';
		tableau.extensions.settings.set('shapes', '[{"id":"","type":"rectangle","coords":[10,10],"points":[[30,30]],"dimensions":[20,20],"values":[{"field":"AnimalGroup","value":"Cheetah"}]}]');

		const wrapper = mount(<Home />);
		await update(wrapper);

		wrapper.find(`#select`).simulate('click');
		expect(wrapper.find('#menuBox').prop('data-mode')).toBe('select');
		wrapper.find('#svgRoot rect').simulate('click');
		await update(wrapper);

		expect(JSON.stringify(wrapper.find('#svgRoot Rectangle').prop('values'))).toBe('[{"field":"AnimalGroup","value":"Lion"}]');
	});

})
