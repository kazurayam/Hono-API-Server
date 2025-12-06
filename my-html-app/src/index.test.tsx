// src/index.test.tsx

import {beforeEach, describe, expect, test} from 'bun:test'

// You can use renderToString function from 'hono/jsx/dom/server' to explicitly convert a JSX element into its HTML string reporesentation.
// This function is used form server-side rendering JSX into a string
import {renderToString} from 'hono/jsx/dom/server';

// '@testing-library/dom' provides utilities to query the JSDom document
import {screen} from '@testing-library/dom';
import {JSDOM} from 'jsdom';

// 1. Define a sample Hono JSX component
const Greeting = ({ name } : { name: string}) => {
    return <div>Hello, {name}!</div>
};

// 2. Set up JSDom environment before each test
let dom: JSDOM;
let document: Document;

beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><body><div id="app"></div></body>');
    document = dom.window.document;
    // Ensure the global environment uses the JSDom document
    Object.defineProperty(global, 'document', { value: document });
});

describe('Greeting Component', () => {
    test('renders the correct name', () => {
        // 3. Render the Hono JSX component into a string
        // 4. Insert the rendered HTML into the JSDom body
        document.body.innerHTML = renderToString(<Greeting name="Hono"/>);
        // 5. Use DOM testing library or standard DOM APIs to make assertions
        const greetingElement: HTMLElement = screen.getByText(/Hello, Hono!/i);
        //expect(greetingElement).toBeInTheDocument(); // Requires jest-dom matcher
        expect(greetingElement.tagName).toBe('DIV')
    });
});

describe('smoke test', () => {
    test('1 + 1 makes 2', () => {
        expect(1 + 1).toBe(2);
    })
})
