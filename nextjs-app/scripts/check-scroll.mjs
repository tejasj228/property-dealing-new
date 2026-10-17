import test from 'node:test';
import assert from 'node:assert/strict';
import { attachReadingProgress } from '../components/reading-progress.mjs';

test('progress follows page position, clamps overscroll, remeasures growth and releases listeners', () => {
  const listeners=new Map(), frames=new Map(), attrs=new Map(); let id=0, remeasure, disconnected=false;
  const doc={documentElement:{scrollHeight:3000},body:{}};
  const view={innerHeight:1000,scrollY:0,
    ResizeObserver:class {constructor(callback){remeasure=callback;}observe(){}disconnect(){disconnected=true;}},
    requestAnimationFrame(callback){frames.set(++id,callback);return id;},cancelAnimationFrame(key){frames.delete(key);},
    addEventListener(name,callback,options){assert.equal(options.passive,true);listeners.set(name,callback);},removeEventListener(name){listeners.delete(name);}};
  const fill={style:{}},track={setAttribute:(key,value)=>attrs.set(key,value)};
  const stop=attachReadingProgress(track,fill,doc,view);
  const flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback());};
  flush(); assert.equal(attrs.get('aria-valuenow'),'0');
  view.scrollY=1000; for(let i=0;i<100;i++)listeners.get('scroll')();
  assert.equal(frames.size,1);flush();assert.equal(fill.style.transform,'scaleX(0.5)');
  assert.equal(attrs.get('aria-valuetext'),'50% explored, 50% remaining');
  view.scrollY=3000;listeners.get('scroll')();flush();assert.equal(attrs.get('aria-valuenow'),'100');
  view.scrollY=-50;listeners.get('scroll')();flush();assert.equal(attrs.get('aria-valuenow'),'0');
  doc.documentElement.scrollHeight=5000;view.scrollY=1000;remeasure();flush();assert.equal(attrs.get('aria-valuenow'),'25');
  doc.documentElement.scrollHeight=500;remeasure();flush();assert.equal(attrs.get('aria-valuenow'),'100');
  listeners.get('scroll')();stop();assert.equal(frames.size,0);assert.equal(listeners.size,0);assert.ok(disconnected);
});
