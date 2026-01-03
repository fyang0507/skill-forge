---
name: javascript-variable-scope
description: Understand and avoid common scoping issues in JavaScript.
---
# JavaScript Variable Scope

## Key Learnings

*   **Global Scope:** Variables declared outside any function have global scope, accessible from anywhere in the code.
*   **Function Scope (with `var`):** Variables declared with `var` inside a function are only accessible within that function and any nested functions.
*   **Block Scope (with `let` and `const`):** Variables declared with `let` and `const` inside a block (e.g., within an `if` statement or a `for` loop) are only accessible within that block.
*   **Hoisting (with `var`):** `var` variables are hoisted to the top of their scope, meaning you can use them before they are declared, but their value will be `undefined` until the line where they are assigned. `let` and `const` are also hoisted, but accessing them before declaration results in a `ReferenceError`.
*   **Lexical Scope:** Inner functions have access to the variables in their outer (enclosing) functions' scope. This creates a chain of scopes.
*   **Scope Chain:** When a variable is used, JavaScript searches for it in the current scope, then the outer scope, and so on, up to the global scope.

## Common Gotchas

*   **Accidental Global Variables:** Assigning a value to an undeclared variable implicitly creates a global variable, which can lead to naming conflicts and unexpected behavior.  Always declare variables with `var`, `let`, or `const`.
*   **`var` in Loops:** Using `var` in loops can lead to unexpected behavior with asynchronous operations (e.g., `setTimeout`) because the loop variable is shared across all iterations. `let` fixes this by creating a new binding for each iteration.
*   **Forgetting `let` or `const`:** Forgetting to use `let` or `const` can lead to accidental global variables or unintended variable mutations.
*   **Shadowing:** Declaring a variable with the same name as a variable in an outer scope can "shadow" the outer variable, making it inaccessible in the inner scope. Be mindful of variable names to avoid confusion.
*   **Confusing `this`:** The value of `this` is determined by how a function is called, and not where it is defined. This can lead to unexpected behavior, especially with event handlers and methods. (This is technically not scoping, but often comes up together)

## Working Pattern

1.  **Use `const` by default:**  If the variable's value will not change, use `const`.
2.  **Use `let` for variables that change:** If you need to reassign the variable, use `let`.
3.  **Avoid `var`:**  `var` has function scope, which can be confusing, and it is better to avoid its usage in modern JavaScript.
4.  **Declare Variables at the Top of Their Scope:**  While not strictly necessary with `let` and `const`, declaring variables at the top of their scope (function or block) can improve readability.
5.  **Understand Closures:** Be aware of how inner functions retain access to variables in their outer scopes (closures) and how this can be used to create private variables and maintain state.
6.  **Use Strict Mode:** Enable strict mode (`"use strict";`) at the top of your JavaScript files to catch common mistakes, including accidental global variables.