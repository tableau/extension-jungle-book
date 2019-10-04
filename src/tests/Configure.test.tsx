import React from 'react';
import { mount, shallow } from 'enzyme';
import './__mocks__/tableau';
import Configure from '../Configure';

const update = async (wrapper: any) => {
	await new Promise(setImmediate);
	wrapper.update();
}

describe('Basic rendering', () => {
	it('Renders without crashing', () => {
		shallow(<Configure />);
	});
});

describe('Config loads', () => {
	const wrapper = mount(<Configure />);

	it('Loads dimensions and worksheets', async () => {
		await update(wrapper);
		expect(wrapper.find('#dimensions').children().length).toBe(2);
		expect(wrapper.find('#worksheets').children().length).toBe(2);
		expect(wrapper.find('button[id="ok"]').prop('disabled')).toBe(true);
	});

});
