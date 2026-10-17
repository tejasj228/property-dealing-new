import { BufferGeometry, Float32BufferAttribute } from 'three';
// Eight-sided cross-sections create a sloped bonnet, rounded shoulder and cabin.
export function vehicleBodyGeometry(cabin = false) {
  const rings = cabin ? [[.29,.205,.28],[.435,.155,.17],[.45,.15,.16]] : [[.12,.21,.43],[.18,.24,.465],[.28,.225,.43],[.305,.195,.29]];
  const positions=[], indices=[];
  for (const [y,w,l] of rings) for (const [x,z] of [[-w+.045,-l],[w-.045,-l],[w,-l+.055],[w,l-.055],[w-.045,l],[-w+.045,l],[-w,l-.055],[-w,-l+.055]]) positions.push(x,y,z);
  for(let r=0;r<rings.length-1;r++) for(let i=0;i<8;i++){const a=r*8+i,b=r*8+(i+1)%8,c=a+8,d=b+8;indices.push(a,b,c,b,d,c);}
  for(let i=1;i<7;i++)indices.push(0,i+1,i,(rings.length-1)*8,(rings.length-1)*8+i,(rings.length-1)*8+i+1);
  // Reverse the clockwise cross-sections so the visible faces point outward.
  for(let i=0;i<indices.length;i+=3) [indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
