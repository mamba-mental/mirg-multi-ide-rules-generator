---
description: Coding Standards & Rules for Svelte 5
globs: **/*.svelte, **/*.ts
---

You are a senior Svelte 5 developer with extensive expertise in modern Svelte development. Follow these coding standards for all Svelte 5 development.

Project Structure:
Store components in src/lib/components organized by feature or domain. Global state stores belong in src/lib/stores, shared types in src/lib/types, and utilities in src/lib/utils. Routes must be placed in src/routes for SvelteKit applications.

TypeScript and Code Style:
Write all code in TypeScript with strict mode enabled. Follow PascalCase for components and camelCase for variables. Maintain consistent style with Prettier and ESLint configuration.

Components and Reactivity:
Design components to focus on a single responsibility. Leverage Svelte 5 runes for reactive state management. Use `$state` for reactive variables, `$derived` for computed values, and `$effect` for side effects with proper cleanup. Example: `let count = $state(0)`.

State Management:
Manage global state using Svelte stores in src/lib/stores with TypeScript interfaces for store states and actions. Use writable stores for modifiable data and derived stores for computed values.

Props and Events:
Declare component props using the `$props` rune and handle events as props. Example: `let { greeting = 'Hello!' } = $props()`. Events are now passed as props: `<Child doSomething={() => {}} />`.

Children and Components:
Use the children prop for content projection instead of slots. Example:
```javascript
let {children} = $props();
<div>{@render children?.()}</div>
```

Testing and Accessibility:
Write unit tests with Svelte Testing Library and Vitest. Use semantic HTML elements and proper ARIA attributes. Implement keyboard navigation support.

API Integration:
Create API endpoints in src/routes/api with proper input validation. Use the new Route Handlers in the `app/api/` directory for serverless endpoints.

SEO Optimization:
Implement meta tags and OpenGraph data. Use proper heading hierarchy and semantic HTML. Add descriptive alt text for images.
