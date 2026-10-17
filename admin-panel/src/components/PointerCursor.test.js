import React from 'react';
import { act, render, screen, cleanup } from '@testing-library/react';
import PointerCursor from './PointerCursor';

let frames, now, nextFrame;
beforeEach(() => {
  now=1000; nextFrame=0; frames=new Map();
  jest.spyOn(performance,'now').mockImplementation(()=>now);
  jest.spyOn(document,'hidden','get').mockReturnValue(false);
  window.matchMedia=jest.fn(()=>({matches:true,addEventListener:jest.fn(),removeEventListener:jest.fn()}));
  jest.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{const id=++nextFrame;frames.set(id,callback);return id;});
  jest.spyOn(window,'cancelAnimationFrame').mockImplementation(id=>frames.delete(id));
});
afterEach(()=>{cleanup();jest.restoreAllMocks();});
function pointer(node,type='pointermove',x=80,y=90) {
  const event=new Event(type,{bubbles:true});
  Object.assign(event,{pointerType:'mouse',clientX:x,clientY:y}); node.dispatchEvent(event);
}
function mount() {
  const view=render(<><PointerCursor /><div data-testid="surface">Page</div><div data-testid="model" data-draggable="true">Model</div></>);
  return {cursor:view.container.querySelector('.brand-cursor'),surface:screen.getByTestId('surface'),model:screen.getByTestId('model')};
}

test('pointer bursts coalesce into one animation frame without repeated page-wide cursor writes',()=>{
  const {cursor,surface}=mount();
  const observer=new MutationObserver(()=>{});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-brand-cursor']});
  act(()=>{
    for(let i=0;i<100;i++)pointer(surface,'pointermove',80+i,90);
    expect(observer.takeRecords()).toHaveLength(1);
  });
  expect(frames.size).toBe(1);expect(cursor.hidden).toBe(false);
  // The trail settles and stops scheduling frames when the pointer stops.
  act(()=>{for(let i=0;i<60&&frames.size;i++){const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(now+=16));}});
  expect(frames.size).toBe(0);observer.disconnect();
});

test('scrolling cancels cursor rendering without cancelling wheel input or waking on content hover',()=>{
  const {cursor,surface}=mount();act(()=>pointer(surface));
  const wheel=new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:100});
  act(()=>surface.dispatchEvent(wheel));
  expect(wheel.defaultPrevented).toBe(false);expect(cursor.hidden).toBe(true);expect(frames.size).toBe(0);
  expect(document.documentElement.hasAttribute('data-brand-cursor')).toBe(false);
  act(()=>{pointer(surface,'pointerover');pointer(surface);});
  expect(cursor.hidden).toBe(true);expect(frames.size).toBe(0);
  now+=200;act(()=>pointer(surface));expect(cursor.hidden).toBe(false);
  act(()=>surface.dispatchEvent(new Event('scroll',{bubbles:false})));
  expect(cursor.hidden).toBe(true);expect(frames.size).toBe(0);
});

test('hovering a draggable 3D surface leaves only the native grab cursor',()=>{
  const {cursor,surface,model}=mount();act(()=>pointer(surface));expect(cursor.hidden).toBe(false);
  act(()=>pointer(model,'pointerover'));
  expect(cursor.hidden).toBe(true);expect(frames.size).toBe(0);
  expect(document.documentElement.hasAttribute('data-brand-cursor')).toBe(false);
});

// Geometry regression: the fixed cursor box must never extend document overflow.
test.each([[0,0],[1023,767],[1010,750],[512,768],[-20,-20],[1100,900]])('cursor stays inside the viewport at %s,%s', (x,y)=>{
  const {cursor,surface}=mount();
  act(()=>{ pointer(surface,'pointermove',x,y); const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback(now+=16)); });
  const [left,top]=cursor.style.transform.match(/-?[\d.]+(?=px)/g).map(Number);
  expect(left).toBeGreaterThanOrEqual(0);expect(top).toBeGreaterThanOrEqual(0);
  expect(left+96).toBeLessThanOrEqual(window.innerWidth);expect(top+96).toBeLessThanOrEqual(window.innerHeight);
  const [hotX,hotY]=cursor.firstChild.style.transform.match(/-?[\d.]+(?=px)/g).map(Number);
  expect(left+48+hotX).toBe(Math.max(0,Math.min(x,window.innerWidth)));
  expect(top+48+hotY).toBe(Math.max(0,Math.min(y,window.innerHeight)));
});

test('resize hides the old cursor position until new viewport bounds are available',()=>{
  const {cursor,surface}=mount();act(()=>pointer(surface));
  act(()=>window.dispatchEvent(new Event('resize')));
  expect(cursor.hidden).toBe(true);expect(frames.size).toBe(0);
});
