import BrandIcon from './BrandIcon';
import './PropertyTypeBadge.css';
export default function PropertyTypeBadge({type}) {
  const known=type==='commercial'||type==='residential';
  return <span className="property-type-badge" data-type={known?type:'other'}>
    <BrandIcon name={type==='commercial'?'building':'home'} />
    {type==='commercial'?'Commercial':type==='residential'?'Residential':'Property'}
  </span>;
}
