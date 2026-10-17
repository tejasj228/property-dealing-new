'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMotionValue, useReducedMotion } from 'motion/react';
import './ContactOffice.css';
const Scene=dynamic(()=>import('./landing/ArchitectureScene'),{ssr:false});
export default function ContactOffice(){
  const [open,setOpen]=useState(false),[paused,setPaused]=useState(false);
  const progress=useMotionValue(0),reduced=useReducedMotion();
  useEffect(()=>{progress.set(open?1:0);},[open,progress]);
  return <figure className="contact-office">
    <div className="contact-office-stage">
      <div className="contact-office-fallback" aria-hidden="true"><span /><span /><span /><p>A space for your next move.</p></div>
      <Scene kind="office" progress={progress} reduceMotion={Boolean(reduced)} paused={paused}/>
    </div>
    <figcaption><span>Our door is open. Let’s talk.<small>Illustrative office · drag to turn</small></span>
      <div className="contact-office-controls"><button type="button" onClick={()=>setOpen(value=>!value)} aria-pressed={open}>{open?'Close the door':'Open the door'}<i className="fa-solid fa-door-open" aria-hidden="true" /></button>
      {!reduced&&<button type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused} aria-label={paused?'Resume office motion':'Pause office motion'}><i className={`fa-solid fa-${paused?'play':'pause'}`} aria-hidden="true" /></button>}</div>
    </figcaption>
  </figure>;
}
