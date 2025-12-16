// src/index.test.tsx

import {beforeEach, describe, expect, test} from 'bun:test'

// You can use renderToString function from 'hono/jsx/dom/server' to explicitly convert a JSX element into its HTML string reporesentation.
// This function is used form server-side rendering JSX into a string
import {renderToString} from 'hono/jsx/dom/server';

// '@testing-library/dom' provides utilities to query the JavaScript document object
import { screen } from '@testing-library/dom';

// 1. Define a sample Hono JSX component
const Greeting = ({ name } : { name: string}) => {
    return <div>Hello, {name}!</div>
};

// 2. ./bunfig.toml & ./happydom.ts tunes the global property "document" accessible without the browser runtime

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
