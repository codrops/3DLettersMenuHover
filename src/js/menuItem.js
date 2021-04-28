import { gsap } from 'gsap';
import { map, lerp, clamp, getMousePos } from './utils';
const images = Object.entries(require('../img/*.jpg'));

import 'splitting/dist/splitting.css';
import 'splitting/dist/splitting-cells.css';
import Splitting from 'splitting';

// initialize Splitting
const splitting = Splitting();

// track the mouse position
let mousepos = {x: 0, y: 0};
// cache the mouse position
let mousePosCache = mousepos;
let cursorDirection = {x: mousePosCache.x-mousepos.x, y: mousePosCache.y-mousepos.y};

// update mouse position when moving the mouse
window.addEventListener('mousemove', ev => mousepos = getMousePos(ev));

export class MenuItem {
    constructor(el, inMenuPosition, animatableProperties) {
        // el is the <a> with class "menu__item"
        this.DOM = {el: el};
        // position in the Menu
        this.inMenuPosition = inMenuPosition;
        // menu item properties that will animate as we move the mouse around the menu
        this.animatableProperties = animatableProperties;
        // create the image structure and split title texts
        this.layout();
        // initialize some events
        this.initEvents();
    }
    // create the image structure
    // we want to add/append to the menu item the following html:
    // <div class="hover-reveal">
    //   <div class="hover-reveal__inner" style="overflow: hidden;">
    //     <div class="hover-reveal__img" style="background-image: url(pathToImage);">
    //     </div>
    //   </div>
    // </div>
    layout() {
        // this is the element that gets its position animated (and perhaps other properties like the rotation etc..)
        this.DOM.reveal = document.createElement('div');
        this.DOM.reveal.className = 'hover-reveal';
        this.DOM.reveal.style.transformOrigin = '0% 0%';
        // the next two elements could actually be only one, the image element
        // adding an extra wrapper (revealInner) around the image element with overflow hidden, gives us the possibility to scale the image inside
        this.DOM.revealInner = document.createElement('div');
        this.DOM.revealInner.className = 'hover-reveal__inner';
        this.DOM.revealImage = document.createElement('div');
        this.DOM.revealImage.className = 'hover-reveal__img';
        this.DOM.revealImage.style.backgroundImage = `url(${images[this.inMenuPosition][1]})`;

        this.DOM.revealInner.appendChild(this.DOM.revealImage);
        this.DOM.reveal.appendChild(this.DOM.revealInner);
        this.DOM.el.appendChild(this.DOM.reveal);

        // title text/chars elements
        // text element
        this.DOM.textInner = this.DOM.el.querySelector('.menu__item-text');
        this.DOM.word = this.DOM.textInner.querySelector('.word');
        this.DOM.wordClone = this.DOM.word.cloneNode(true);
        this.DOM.wordClone.classList.add('word--clone');
        this.DOM.textInner.appendChild(this.DOM.wordClone);
        // all text chars (Splittingjs)
        this.DOM.titleChars = [...this.DOM.word.querySelectorAll('span.char')];
        this.DOM.titleCloneChars = [...this.DOM.wordClone.querySelectorAll('span.char')];
    }
    // calculate the position/size of both the menu item and reveal element
    calcBounds() {
        this.bounds = {
            el: this.DOM.el.getBoundingClientRect(),
            reveal: this.DOM.reveal.getBoundingClientRect(),
            width: this.DOM.reveal.offsetWidth,
            height: this.DOM.reveal.offsetHeight
        };
    }
    // bind some events
    initEvents() {
        this.mouseenterFn = () => {
            this.hoverTimeout = setTimeout(() => {
                this.hoverEnter = true;
                this.firstRAFCycle = true;
                // calculate position/sizes the first time
                this.calcBounds();

                this.DOM.reveal.style.transformOrigin = '100% 0%';
                // animate the title characters
                this.animateCharsIn();
                // show the image element
                this.showImage();

                // start the render loop animation (rAF)
                this.loopRender();
            }, 100);
        }
        this.mouseleaveFn = () => {
            if ( this.hoverTimeout ) {
                clearTimeout(this.hoverTimeout);
            }
            if ( this.hoverEnter ) {
                this.hoverEnter = null;
                // stop the render loop animation (rAF)
                this.stopRendering();
                this.animateCharsOut();
                // hide the image element
                this.hideImage();
            }
        };
        
        this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
        this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
    }
    animateCharsIn() {
        this.animateCharsTimeline = gsap.timeline({
            defaults: {duration: 0.5, ease: 'power2', stagger: 0.025}
        })
        .to(this.DOM.titleChars, {
            y: '100%',
            rotationX: -90,
            opacity: 0
        })
        .to(this.DOM.titleCloneChars, {
            startAt: {y: '-100%', rotationX: 90, opacity: 0},
            y: '0%',
            rotationX: 0,
            opacity: 1
        }, 0);
    }
    animateCharsOut() {
        if ( this.animateCharsTimeline ) this.animateCharsTimeline.kill();
        this.animateCharsTimeline = gsap.timeline({
            defaults: {duration: 0.5, ease: 'power2', stagger: 0.025}
        })
        .to(this.DOM.titleCloneChars, {
            y: '-100%',
            rotationX: 90,
            opacity: 0
        })
        .to(this.DOM.titleChars, {
            startAt: {y: '100%', rotationX: -90, opacity: 0},
            y: '0%',
            rotationX: 0,
            opacity: 1
        }, 0);
    }
    // show the image element
    showImage() {
        if (this.tl) {
            this.tl.kill();
        }

        this.tl = gsap.timeline({
            onStart: () => {
                // show both image and its parent element
                gsap.set([this.DOM.reveal, this.DOM.revealInner], {opacity: 1})
                // set a high z-index value so image appears on top of other elements
                gsap.set(this.DOM.el, {zIndex: images.length});
            }
        })
        // animate the image wrap
        .to(this.DOM.revealInner, {
            duration: 1.3,
            ease: 'expo',
            startAt: {scale: 0.5},
            scale: 1
        })
        // animate the image element
        .to(this.DOM.revealImage, {
            duration: 1.3,
            ease: 'expo',
            startAt: {scaleX: 2},
            scaleX: 1
        }, 0)
        .to(this.DOM.reveal, {
            duration: 0.6,
            ease: 'power1.inOut'
        }, 0);
    }
    // hide the image element
    hideImage() {
        if (this.tl) {
            this.tl.kill();
        }

        this.tl = gsap.timeline({
            defaults: {
                duration: 1.2,
                ease: 'power1',
            },
            onStart: () => {
                gsap.set(this.DOM.el, {zIndex: 1});
            },
            onComplete: () => {
                gsap.set(this.DOM.reveal, {opacity: 0});
            }
        })
        .to(this.DOM.revealInner, {
            opacity: 0
        })
        .to(this.DOM.revealImage, {
            scaleX: 1.7
        }, 0)
        .to(this.DOM.reveal, {
            rotation: cursorDirection.x < 0 ? '+=5' : '-=5',
            y: '200%'
        }, 0);
    }
    // start the render loop animation (rAF)
    loopRender() {
        if ( !this.requestId ) {
            this.requestId = requestAnimationFrame(() => this.render());
        }
    }
    // stop the render loop animation (rAF)
    stopRendering() {
        if ( this.requestId ) {
            window.cancelAnimationFrame(this.requestId);
            this.requestId = undefined;
        }
    }
    // translate the item as the mouse moves
    render() {
        this.requestId = undefined;

        // calculate the mouse distance (current vs previous cycle)
        const mouseDistanceX = clamp(Math.abs(mousePosCache.x - mousepos.x), 0, 100);
        // direction where the mouse is moving
        cursorDirection = {x: mousePosCache.x-mousepos.x, y: mousePosCache.y-mousepos.y};
        // updated cache values
        mousePosCache = {x: mousepos.x, y: mousepos.y};
        
        // new translation values
        this.animatableProperties.tx.current = this.isPositionOdd ? Math.abs(mousepos.x - this.bounds.el.left) : Math.abs(mousepos.x - this.bounds.el.left) - this.bounds.width;
        this.animatableProperties.ty.current = this.firstRAFCycle ? this.bounds.height/1.5 : Math.abs(mousepos.y - this.bounds.el.top);
        // new rotation value
        let startingAngle = -30;  
        this.animatableProperties.rotation.current = this.firstRAFCycle 
                                                     ? startingAngle
                                                     : map(mouseDistanceX, 0, 300, startingAngle, cursorDirection.x < 0 ? startingAngle+100 : startingAngle-100)
        

        // new filter value
        this.animatableProperties.brightness.current = this.firstRAFCycle ? 1 : map(mouseDistanceX,0,100,1,5);

        // set up the interpolated values
        // for the first cycle, both the interpolated values need to be the same so there's no "lerped" animation between the previous and current state
        this.animatableProperties.tx.previous = this.firstRAFCycle ? this.animatableProperties.tx.current : lerp(this.animatableProperties.tx.previous, this.animatableProperties.tx.current, this.animatableProperties.tx.amt);
        this.animatableProperties.ty.previous = this.firstRAFCycle ? this.animatableProperties.ty.current : lerp(this.animatableProperties.ty.previous, this.animatableProperties.ty.current, this.animatableProperties.ty.amt);
        this.animatableProperties.rotation.previous = this.firstRAFCycle ? this.animatableProperties.rotation.current : lerp(this.animatableProperties.rotation.previous, this.animatableProperties.rotation.current, this.animatableProperties.rotation.amt);
        this.animatableProperties.brightness.previous = this.firstRAFCycle ? this.animatableProperties.brightness.current : lerp(this.animatableProperties.brightness.previous, this.animatableProperties.brightness.current, this.animatableProperties.brightness.amt);
        
        // set styles
        gsap.set(this.DOM.reveal, {
            x: this.animatableProperties.tx.previous,
            y: this.animatableProperties.ty.previous,
            rotation: this.animatableProperties.rotation.previous,
            //filter: `brightness(${this.animatableProperties.brightness.previous})`
        });

        // loop
        this.firstRAFCycle = false;
        this.loopRender();
    }
}