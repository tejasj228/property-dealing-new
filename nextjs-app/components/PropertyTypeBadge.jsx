import BrandIcon from './BrandIcon';
import './PropertyTypeBadge.css';
// An empty plot shows its own badge, whichever kind of land use it is listed under.
export default function PropertyTypeBadge({type, plot=false}) {
  const kind=plot||type==='plot'?'plot':type;
  const known=kind==='commercial'||kind==='residential'||kind==='plot';
  return <span className="property-type-badge" data-type={known?kind:'other'}>
    <BrandIcon name={kind==='plot'?'draw-polygon':kind==='commercial'?'building':'home'} />
    {kind==='plot'?'Plot':kind==='commercial'?'Commercial':kind==='residential'?'Residential':'Property'}
  </span>;
}
