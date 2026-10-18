import {modularRegions} from './modular-grid-layout.js';
// Seeded, planar layouts. Coordinates describe card centers in design units.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function randomFor(seed){
  let value=Number(seed)>>>0;
  return ()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
}
export function separated(a,b,gap){
  return Math.abs(a.x-b.x)+1e-8>=(a.width+b.width)/2+gap || Math.abs(a.y-b.y)+1e-8>=(a.height+b.height)/2+gap;
}

export function freeGridLayout(aspects,options={}){
  const count=aspects.length;
  if(!count)return [];
  const regular=options.outline==='regular';
  const aspect=regular?clamp(Number(options.aspect)||1,.025,40):undefined;
  const seed=Number(options.seed??1)>>>0;
  const {rectangles}=modularRegions(count,{...options,aspect,seed});
  const fullWidth=Math.max(...rectangles.map(r=>r.x+r.w))-Math.min(...rectangles.map(r=>r.x));
  const fullHeight=Math.max(...rectangles.map(r=>r.y+r.h))-Math.min(...rectangles.map(r=>r.y));
  const canvasHeight=Math.max(1,Number(options.canvasHeight)||1080);
  const canvasWidth=Math.max(1,Number(options.canvasWidth)||canvasHeight*(aspect||1));
  // Reserve the camera's fit margin. Bounds stay fixed when spacing changes.
  const availableWidth=canvasWidth/1.08,availableHeight=canvasHeight/1.08;
  const unit=Math.min(availableWidth/fullWidth,availableHeight/fullHeight);
  const wallWidth=regular?availableWidth:fullWidth*unit;
  const wallHeight=regular?availableHeight:fullHeight*unit;
  // Keep at least 70% of a cell (and 64 design pixels when available).
  // Solving (wall + gap) / cells - gap >= minimum gives a true gap budget.
  const cell=Math.min(wallWidth/fullWidth,wallHeight/fullHeight);
  const minimum=Math.max(cell*.7,Math.min(64,cell));
  const budget=(extent,cells)=>cells>1?(extent-cells*minimum)/(cells-1):Infinity;
  const gapLimit=Math.max(0,Math.floor(Math.min(budget(wallWidth,fullWidth),budget(wallHeight,fullHeight))));
  const gap=clamp(Number(options.gap)||0,0,gapLimit);
  const sx=(wallWidth+gap)/fullWidth,scale=(wallHeight+gap)/fullHeight;
  // Reassign photo positions without reordering the user's slot list.
  const slots=Array.from({length:count},(_,i)=>i),slotRandom=randomFor(seed^0x9E3779B9);
  for(let i=slots.length-1;i>0;i--){const j=Math.floor(slotRandom()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]]}
  let slot=0;
  const indexFor=()=>slots[slot++];
  const output=rectangles.map((r,i)=>({index:indexFor(i),gap,gapLimit,region:{...r},x:(r.x+r.w/2)*sx,y:(r.y+r.h/2)*scale,width:r.w*sx-gap,height:r.h*scale-gap}));
  const minX=Math.min(...output.map(r=>r.x-r.width/2)),maxX=Math.max(...output.map(r=>r.x+r.width/2));
  const minY=Math.min(...output.map(r=>r.y-r.height/2)),maxY=Math.max(...output.map(r=>r.y+r.height/2));
  return output.map(r=>({...r,x:r.x-(minX+maxX)/2,y:-(r.y-(minY+maxY)/2)})).sort((a,b)=>a.index-b.index);
}

export function regularGridLayout(aspects,options={}){return freeGridLayout(aspects,{...options,outline:'regular'})}

// Compare normalized geometry with photo identities removed. A photo swap,
// mirror of a symmetric grid, or small cut adjustment cannot pass as new structure.
export function layoutStructureDistance(a,b){
  const normalize=frames=>{
    const left=Math.min(...frames.map(r=>r.x-r.width/2)),right=Math.max(...frames.map(r=>r.x+r.width/2));
    const top=Math.min(...frames.map(r=>r.y-r.height/2)),bottom=Math.max(...frames.map(r=>r.y+r.height/2));
    return frames.map(r=>[(r.x-left)/(right-left),(r.y-top)/(bottom-top),r.width/(right-left),r.height/(bottom-top)]);
  };
  if(!a.length||!b.length)return 0;
  const first=normalize(a),second=normalize(b);
  const directed=(from,to)=>from.reduce((sum,r)=>sum+Math.min(...to.map(s=>r.reduce((d,v,i)=>d+Math.abs(v-s[i]),0))),0)/from.length;
  return (directed(first,second)+directed(second,first))/2;
}
export function nextGridSeed(aspects,options={}){
  const layout=options.outline==='regular'?regularGridLayout:freeGridLayout;
  const previous=layout(aspects,options),seed=Number(options.seed??1)>>>0;
  const minimumDistance=.18*Math.min(1,Math.sqrt(13/aspects.length));
  let bestSeed=seed,bestDistance=-1;
  for(let offset=1;offset<=16;offset++){
    const candidateSeed=(seed+offset)>>>0;
    const distance=layoutStructureDistance(previous,layout(aspects,{...options,seed:candidateSeed}));
    if(distance>bestDistance){bestDistance=distance;bestSeed=candidateSeed}
    if(distance>=minimumDistance)return candidateSeed;
  }
  return bestSeed;
}
