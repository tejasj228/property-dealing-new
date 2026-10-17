import React from 'react';
import { act, render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import CustomSelect from '../components/CustomSelect';
import BrandIcon from '../components/BrandIcon';
import PropertyTypeBadge from '../components/PropertyTypeBadge';
afterEach(cleanup);
function Fixture({disabled=false}){
  const [value,setValue]=React.useState('');
  return <div data-theme="dark"><label htmlFor="interest">Area of interest</label><CustomSelect id="interest" name="interest" value={value} disabled={disabled} onChange={event=>setValue(event.target.value)}><><option value="">Select an area</option><option value="unavailable" disabled>Unavailable</option><option value="yamuna">Yamuna Expressway</option><option value="noida">Noida</option></></CustomSelect></div>;
}
test('custom menu carries its theme and commits a keyboard selection to the form value',async()=>{
  const {container}=render(<Fixture/>);const trigger=screen.getByRole('combobox',{name:'Area of interest'});
  act(()=>trigger.focus());fireEvent.keyDown(trigger,{key:'ArrowDown'});
  const menu=await screen.findByRole('listbox');expect(menu).toHaveAttribute('data-theme','dark');
  const option=screen.getByRole('option',{name:'Yamuna Expressway'});act(()=>option.focus());fireEvent.keyDown(option,{key:'Enter'});
  await waitFor(()=>expect(trigger).toHaveTextContent('Yamuna Expressway'));
  expect(container.querySelector('input[name="interest"]')).toHaveValue('yamuna');
});
test('escape closes without changing selection and disabled controls cannot open',async()=>{
  const {rerender,container}=render(<Fixture/>);const trigger=screen.getByRole('combobox');
  fireEvent.keyDown(trigger,{key:'ArrowDown'});await screen.findByRole('listbox');fireEvent.keyDown(document.activeElement,{key:'Escape'});
  await waitFor(()=>expect(screen.queryByRole('listbox')).not.toBeInTheDocument());expect(container.querySelector('input[name="interest"]')).toHaveValue('');
  rerender(<Fixture disabled/>);expect(screen.getByRole('combobox')).toBeDisabled();
});
test('icons use decorative SVGs and preserve legacy semantic names',()=>{
  const {container}=render(<BrandIcon className="fas fa-phone"/>);expect(container.querySelector('svg')).toBeTruthy();expect(container.firstChild).toHaveAttribute('data-icon','phone');expect(container.firstChild).toHaveAttribute('aria-hidden','true');
});

test('property types have explicit distinct badge identities and matching icons',()=>{
 const {container}=render(<><PropertyTypeBadge type="residential"/><PropertyTypeBadge type="commercial"/></>);
 const residential=container.querySelector('[data-type="residential"]'),commercial=container.querySelector('[data-type="commercial"]');
 expect(residential).toHaveTextContent('Residential');expect(residential.querySelector('[data-icon="home"]')).toBeTruthy();
 expect(commercial).toHaveTextContent('Commercial');expect(commercial.querySelector('[data-icon="building"]')).toBeTruthy();
});
