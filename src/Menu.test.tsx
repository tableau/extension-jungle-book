import React from "react";
import { mount, shallow } from 'enzyme';
import Menu from './Menu';
import Button from './Menu';
import { actions, modes } from './Home';

describe('Basic rendering', () => {
    it('Menu render without crashing', () => {
        const updateMode = () => { };
        shallow(<Menu onClick={updateMode} mode='testing' />);
    });

    it('Edit Buttons render without crashing', () => {
        const updateMode = () => { };
        shallow(<Button onClick={updateMode} mode='testing' />);
    });

    it('Clicking button triggers function', () => {
        const setMode = jest.fn();
        // const runAction = jest.fn();

        // TODO: change starting mode
        const wrapper = mount(<Menu setMode={setMode} mode={modes.EDIT.LASSO} />);

        Object.values(modes.EDIT).forEach(mode => {
            wrapper.find(`#${mode}`).simulate('click');
            expect(setMode).toHaveBeenCalledWith(mode);
        });
        // Object.values(actions).forEach(action => {
        //     wrapper.find(`#${action}`).simulate('click');
        //     expect(runAction).toHaveBeenCalledWith(action);
        // });
    });
});
