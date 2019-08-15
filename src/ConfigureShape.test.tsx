import React from 'react';
import { mount, shallow } from 'enzyme';
import './__mocks__/tableau';
import ConfigureShape from './ConfigureShape';
const tableau = window.tableau;

const update = async (wrapper: any) => {
    await new Promise(setImmediate);
    wrapper.update();
}

describe('Basic rendering', () => {
    it('Renders without crashing', () => {
        shallow(<ConfigureShape />);
    });
});

describe('Loads filter values', () => {

    tableau.extensions.settings.set('dimensions', '["AnimalGroup","Zone/Beat"]');
    tableau.extensions.settings.set('worksheets', '["Sheet 1","Sheet 2"]');

    const wrapper = mount(<ConfigureShape />);
    const testWrapper = shallow(<ConfigureShape />);

    it('Loads filters and values', async () => {
        await update(wrapper);
        expect(wrapper.find('.filters').children().length).toBe(2);
        expect(wrapper.find('select[id="AnimalGroup"]').children().length).toBe(5);
        expect(wrapper.find('select[id="Zone/Beat"]').children().length).toBe(5);
    });

    it('Can select and save values', async () => {
        const a = wrapper.find('select[id="AnimalGroup"]');
        const b = wrapper.find('select[id="Zone/Beat"]');

        a.simulate('change', { target: { value: 'Monkey', id: 'AnimalGroup' } });
        b.simulate('change', { target: { value: 'M1', id: 'Zone/Beat' } });
        wrapper.find('button[id="ok"]').simulate('click');
        expect(tableau.extensions.ui.closeDialog).toHaveBeenCalledWith('[{"field":"AnimalGroup","value":"Monkey"},{"field":"Zone/Beat","value":"M1"}]');
        expect(wrapper.find('button[id="ok"]').prop('disabled')).toBe(false);

        a.simulate('change', { target: { value: '', id: 'AnimalGroup' } });
        b.simulate('change', { target: { value: '', id: 'Zone/Beat' } });
        expect(wrapper.find('button[id="ok"]').prop('disabled')).toBe(true);

        a.simulate('change', { target: { value: 'Cheetah', id: 'AnimalGroup' } });
        b.simulate('change', { target: { value: '', id: 'Zone/Beat' } });
        wrapper.find('button[id="ok"]').simulate('click');
        expect(tableau.extensions.ui.closeDialog).toHaveBeenCalledWith('[{"field":"AnimalGroup","value":"Cheetah"},{"field":"Zone/Beat","value":""}]');
        expect(wrapper.find('button[id="ok"]').prop('disabled')).toBe(false);
    });
});

describe('Loads previously filter values', () => {

    it('populates values', async () => {
        tableau.extensions.initializeDialogAsync = async () => {
            return '[{"field":"AnimalGroup","value":"Monkey"},{"field":"Zone/Beat","value":"M1"}]'
        }
        const wrapper = mount(<ConfigureShape />);
        await update(wrapper);
        expect(wrapper.find('select[id="AnimalGroup"]').prop('value')).toBe('Monkey');
        expect(wrapper.find('select[id="Zone/Beat"]').prop('value')).toBe('M1');
    });
});