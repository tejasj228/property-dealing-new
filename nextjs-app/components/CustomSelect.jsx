'use client';
import { Children, Fragment, isValidElement, useRef, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import BrandIcon from './BrandIcon';
import './CustomSelect.css';

function collectOptions(children) {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) return [];
    if (child.type === Fragment) return collectOptions(child.props.children);
    return child.type === 'option' ? [{value:String(child.props.value ?? ''),label:child.props.children,disabled:child.props.disabled}] : [];
  });
}
export default function CustomSelect({id,name,value,onChange,disabled,children,'aria-label':label}) {
  const trigger=useRef(null),[theme,setTheme]=useState('light');
  const options=collectOptions(children),selected=options.find(option=>option.value===String(value));
  // Prefix values so an optional empty selection remains a real selectable item.
  return <Select.Root value={`option:${value ?? ''}`} disabled={disabled} onValueChange={next=>onChange?.({target:{name,value:next.slice(7)}})} onOpenChange={open=>{
    if(open){const stored=trigger.current?.closest('[data-theme]')?.dataset.theme;setTheme(stored==='dark'||(stored==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');}
  }}>
    {name&&<input type="hidden" name={name} value={value ?? ''} disabled={disabled}/>}
    <Select.Trigger ref={trigger} id={id} aria-label={label} className="custom-select-trigger">
      <Select.Value>{selected?.label || 'Select an option'}</Select.Value><Select.Icon><BrandIcon name="chevron-down" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content className="custom-select-menu" data-theme={theme} position="popper" sideOffset={7} collisionPadding={12}>
      <Select.ScrollUpButton className="custom-select-scroll"><BrandIcon name="chevron-up" /></Select.ScrollUpButton>
      <Select.Viewport>{options.map(option=><Select.Item key={option.value} value={`option:${option.value}`} disabled={option.disabled} className="custom-select-option">
        <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><BrandIcon name="check" /></Select.ItemIndicator>
      </Select.Item>)}</Select.Viewport>
      <Select.ScrollDownButton className="custom-select-scroll"><BrandIcon name="chevron-down" /></Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>;
}
