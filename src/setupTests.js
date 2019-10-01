import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

/**
 * Suppress React 16.8 act() warnings globally.
 * The react teams fix won't be out of alpha until 16.9.0.
 * https://github.com/facebook/react/issues/14769
 */
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