import React from "react";
import { mount, shallow } from 'enzyme';
import Menu from '../Menu';
import Button from '../Menu';
import { modes } from '../Home';

describe('Basic rendering', () => {
	it('Menu render without crashing', () => {
		const updateMode = () => { };
		shallow(<Menu setMode={updateMode} mode='testing' />);
	});

	it('Edit Buttons render without crashing', () => {
		const updateMode = () => { };
		shallow(<Button setMode={updateMode} mode='testing' />);
	});

	it('Clicking button triggers function', () => {
		const setMode = jest.fn();
		const wrapper = mount(<Menu setMode={setMode} mode={modes.VIEWING} />);

		Object.values(modes.EDIT).forEach(mode => {
			wrapper.find(`#${mode}`).simulate('click');
			expect(setMode).toHaveBeenCalledWith(mode);
		});
	});
});
