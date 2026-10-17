export function roadCorridor(curve,halfWidth) {return {points:curve.getSpacedPoints(160),halfWidth};}
export function clearOfRoads(x,z,radius,roads) {
 return roads.every(({points,halfWidth})=>{
  const limit=(halfWidth+radius)**2;
  for(let i=1;i<points.length;i++) {
   const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
   const t=length?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/length)):0;
   if((x-a.x-t*dx)**2+(z-a.z-t*dz)**2<limit)return false;
  }
  return true;
 });
}
