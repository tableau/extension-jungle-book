import React from 'react';
import { mount, shallow } from 'enzyme';
import './__mocks__/tableau';
import Configure from './Configure';
const tableau = window.tableau;

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
        // window.FileReader        = jest.fn(() => dummyFileReader);
        let file = new File(['foo'], 'test.png', {
            type: 'image/png',
        });
        // let file = new File(['foo'], 'test.png', {
        //     lastModified: 1449505890000,
        //     name: 'test.png',
        //     size: 44320,
        //     type: 'image/png',
        // });

        wrapper.find('#imgInput').simulate('change', {
            target: {
                files: [
                    file
                ]
            }
        });
        await update(wrapper);
        wrapper.update();
        wrapper.setProps({});
        // wrapper.find('button[id="ok"]').simulate('click');
        // expect(tableau.extensions.ui.closeDialog).toHaveBeenCalledWith('');
    });

});