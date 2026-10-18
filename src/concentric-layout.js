import * as THREE from 'three';
import { ringCardPose } from './ring-layout.js';

// Distribute the existing slots by circumference. Layout edits never change
// the photo count, and each complete ring gets at least three slots.
export function concentricLayout(count, {rings=3, radius=4.2, ringGap=2.4, outerRadius=null,
  width=1.88, height=1.2, stagger=0, phase=0, heightStep=0}={}) {
  const total=Math.max(3,Math.round(Number(count)||3));
  const layers=Math.max(1,Math.min(8,Math.floor(total/3),Math.round(Number(rings)||1)));
  const base=Math.max(.1,Number(radius)||.1);
  const separation=outerRadius!=null&&layers>1
    ?Math.max(.1,(Number(outerRadius)-base)/(layers-1))
    :Math.max(.1,Number(ringGap)||.1);
  const cardWidth=Math.max(.1,Number(width)||1.88);
  const cardHeight=Math.max(.1,Number(height)||1.2);
  const layerHeight=Number.isFinite(Number(heightStep))?Number(heightStep):0;
  const radii=Array.from({length:layers},(_,i)=>base+i*separation);
  const sum=radii.reduce((a,b)=>a+b,0);
  const ideal=radii.map(r=>total*r/sum);
  const counts=ideal.map(n=>Math.max(3,Math.floor(n)));
  while(counts.reduce((a,b)=>a+b,0)>total){
    const candidates=counts.map((n,i)=>n>3?i:-1).filter(i=>i>=0);
    const i=candidates.sort((a,b)=>(counts[b]-ideal[b])-(counts[a]-ideal[a]))[0];
    counts[i]--;
  }
  while(counts.reduce((a,b)=>a+b,0)<total){
    const i=counts.map((_,i)=>i).sort((a,b)=>(ideal[b]-counts[b])-(ideal[a]-counts[a]))[0];
    counts[i]++;
  }
  const poses=[],circles=[];
  counts.forEach((slots,ring)=>{
    // Radius is an explicit composition control. Dense rings may overlap;
    // never enlarge them to fit slots or change the user's card dimensions.
    const fittedRadius=radii[ring];
    const step=2*Math.PI/slots;
    const offset=ring%2?THREE.MathUtils.clamp(Number(stagger)||0,0,1)*step/2:0;
    circles.push({count:slots,radius:fittedRadius,gap:step*fittedRadius-cardWidth});
    for(let column=0;column<slots;column++){
      const pose=ringCardPose(column,slots,fittedRadius,0,phase+offset,cardWidth);
      pose.position.z=ring*layerHeight;
      poses.push({...pose,height:cardHeight,ring,column,curvatureRadius:fittedRadius,curvatureAxis:'x'});
    }
  });
  return {poses,circles};
}
