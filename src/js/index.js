import { preloader } from './preloader';
import { Menu } from './menu.js';
import { Cursor } from './cursor';

// menu (<nav> element)
const menuEl = document.querySelector('.menu');

// preload the images set as data attrs in the menu items
preloader('.menu__item').then(() => {
    // initialize menu
    new Menu(menuEl);
});

// initialize custom cursor
const cursor = new Cursor(document.querySelector('.cursor'));

// mouse effects on all links and others
[...document.querySelectorAll('a')].forEach(link => {
    link.addEventListener('mouseenter', () => cursor.enter());
    link.addEventListener('mouseleave', () => cursor.leave());
});