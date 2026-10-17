require('../../admin-panel/node_modules/@testing-library/jest-dom');
HTMLElement.prototype.scrollIntoView=function(){};
HTMLElement.prototype.hasPointerCapture=()=>false;
HTMLElement.prototype.setPointerCapture=function(){};
HTMLElement.prototype.releasePointerCapture=function(){};
window.ResizeObserver=class {observe(){} unobserve(){} disconnect(){}};
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
