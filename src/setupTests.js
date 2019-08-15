// https://thetrevorharmon.com/blog/configuring-jest-and-enzyme-in-create-react-app-on-typescript

// import { configure } from 'enzyme';
// import * as Adapter from 'enzyme-adapter-react-16';

// configure({ adapter: new Adapter() });

// https://stackoverflow.com/questions/49824423/enzyme-typeerror-adapter-is-not-a-constructor
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

// require("../public/tableau.extensions.1.latest.min.js");

// const tableau = {
//     extensions: {
//         settings: {
//             set: () => jest.fn(),
//             getAll: () => jest.fn()
//         }
//     }
// };

/**
 * Suppress React 16.8 act() warnings globally.
 * The react teams fix won't be out of alpha until 16.9.0.
 * https://github.com/facebook/react/issues/14769
 */
// const consoleError = console.error;
// beforeAll(() => {
//     jest.spyOn(console, 'error').mockImplementation((...args) => {
//         if (!args[0].includes('Warning: An update to %s inside a test was not wrapped in act')) {
//             consoleError(...args);
//         }
//     });

// });

const mockConsoleMethod = (realConsoleMethod) => {
    const ignoredMessages = [
        'test was not wrapped in act(...)',
        'Tried to ',
    ]

    return (message, ...args) => {
        const containsIgnoredMessage = ignoredMessages.some(ignoredMessage => message.includes(ignoredMessage))

        if (!containsIgnoredMessage) {
            realConsoleMethod(message, ...args)
        }
    }
}

console.warn = jest.fn(mockConsoleMethod(console.warn))
console.error = jest.fn(mockConsoleMethod(console.error))
    /***************/

Enzyme.configure({
    adapter: new Adapter()
});