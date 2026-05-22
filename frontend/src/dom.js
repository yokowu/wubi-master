export const $ = (id) => document.getElementById(id);
export const $$ = (selector, root = document) => root.querySelectorAll(selector);
