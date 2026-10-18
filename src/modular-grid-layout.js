// Integer modules: adjoining frames share grid lines, never arbitrary small offsets.
const randomFor=seed=>{let v=seed>>>0;return()=>{v+=0x6D2B79F5;let t=Math.imul(v^(v>>>15),v|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}};
function edgeMask(rows,columns,edge,seed,count){
 const empty=new Set();if(edge<=0)return empty;
 const random=randomFor(seed^Math.imul(rows,92821)^Math.imul(columns,68917));
 if(count<8||rows<3||columns<4){
  const corners=[[0,0],[columns-1,0],[0,rows-1],[columns-1,rows-1]];
  const offset=Math.floor(random()*4);
  const removed=count<8?1:2;
  for(let i=0;i<removed;i++)empty.add(corners[(offset+i*2)%4].join(','));
  return empty;
 }
 const strength=Math.max(0,Math.min(1,edge/100));
 const maximum=Math.max(1,Math.round(columns*(.12+.22*strength)));
 const middle=Math.floor(rows/2);
 for(let y=0;y<rows;y++){
  if(y===middle)continue; // A complete central band connects the outer arms.
  const end=y===0||y===rows-1;
  let left=end?1+Math.floor(random()*maximum):Math.floor(random()*(maximum+1));
  let right=end?1+Math.floor(random()*maximum):Math.floor(random()*(maximum+1));
  if(!end&&random()>.35+.6*strength)left=0;
  if(!end&&random()>.35+.6*strength)right=0;
  // All rows share the center cells: no detached photos or enclosed holes.
  left=Math.min(left,Math.floor((columns-2)/2));
  right=Math.min(right,Math.ceil((columns-2)/2));
  for(let x=0;x<left;x++)empty.add(x+','+y);
  for(let x=columns-right;x<columns;x++)empty.add(x+','+y);
 }
 return empty;
}
export function modularRegions(count,options={}){
 const regular=options.outline==='regular',ratio=regular?(Number(options.aspect)||1):options.direction==='horizontal'?1.8:options.direction==='vertical'?.65:1;
 const random=randomFor((Number(options.seed)||1)^Math.imul(65,7919)),edge=regular?0:Number(options.edge??65),boards=[];
 for(let rows=2;rows<=Math.ceil(Math.sqrt(count/ratio)*2)+3;rows++)for(let columns=2;columns<=Math.ceil(Math.sqrt(count*ratio)*2)+3;columns++){
  const cells=rows*columns,empty=edgeMask(rows,columns,edge,Number(options.seed)||1,count),area=cells-empty.size;
  if(area<count||area>count*2.8||Math.ceil(rows/2)*Math.ceil(columns/2)>count)continue;
  const cellRatio=ratio*rows/columns;
  const score=Math.abs(Math.log(cellRatio))*7+Math.abs(area/count-1.9);
  boards.push({rows,columns,empty,score,cellRatio});
 }
 boards.sort((a,b)=>a.score-b.score);
 let best=null,bestScore=Infinity;
 const balanced=boards.filter(b=>Math.abs(Math.log(b.cellRatio))<=.1);
 const choices=(balanced.length?balanced:boards).slice(0,3);
 for(let attempt=0;attempt<64;attempt++){
  const board=choices[Math.floor(random()*choices.length)],{rows,columns,empty}=board;
  random(); // Preserve existing regular-wall seeds after replacing the corner mask.
  let tiles=[];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(!empty.has(`${x},${y}`))tiles.push({x,y,w:1,h:1});
  // Seed a large module when there is enough area, without selecting a photo.
  if(tiles.length-count>=3&&count>=4){
   const blocks=[];
   for(let y=0;y<rows-1;y++)for(let x=0;x<columns-1;x++)if(![[x,y],[x+1,y],[x,y+1],[x+1,y+1]].some(p=>empty.has(p.join(','))))blocks.push({x,y,w:2,h:2});
   if(blocks.length){const block=blocks[Math.floor(random()*blocks.length)];tiles=tiles.filter(t=>!(t.x>=block.x&&t.x<block.x+2&&t.y>=block.y&&t.y<block.y+2));tiles.push(block)}
  }
  while(tiles.length>count){
   const merges=[];
   const owners=new Map();
   tiles.forEach((t,i)=>{for(let y=t.y;y<t.y+t.h;y++)for(let x=t.x;x<t.x+t.w;x++)owners.set(`${x},${y}`,i)});
   for(let i=0;i<tiles.length;i++){
    const a=tiles[i];
    for(const key of [`${a.x+a.w},${a.y}`,`${a.x},${a.y+a.h}`]){
     const j=owners.get(key);if(j==null||j===i)continue;
     const b=tiles[j];let merged;
     if(a.y===b.y&&a.h===b.h&&a.x+a.w===b.x)merged={x:a.x,y:a.y,w:a.w+b.w,h:a.h};
     if(a.x===b.x&&a.w===b.w&&a.y+a.h===b.y)merged={x:a.x,y:a.y,w:a.w,h:a.h+b.h};
     if(merged&&merged.w<=2&&merged.h<=2)merges.push({i,j,merged});
    }
   }
   if(!merges.length)break;
   const m=merges[Math.floor(random()*merges.length)];tiles=tiles.filter((t,i)=>i!==m.i&&i!==m.j);tiles.push(m.merged);
  }
  if(tiles.length!==count)continue;
  const horizontal=tiles.filter(t=>t.w===2&&t.h===1).length,vertical=tiles.filter(t=>t.w===1&&t.h===2).length;
  let score=board.score+(count>=8&&(!horizontal||!vertical)?15:0);
  for(const [axis,length,other,total] of [['x',columns,'h',rows],['y',rows,'w',columns]])for(let line=1;line<length;line++){
   const span=tiles.filter(t=>t[axis]===line||t[axis]+t[axis==='x'?'w':'h']===line).reduce((n,t)=>n+t[other],0)/(2*total);
   score+=Math.max(0,span-.7)*20;
  }
  score+=random()*2;
  if(score<bestScore){bestScore=score;best={rectangles:tiles,full:{w:columns,h:rows}}}
 }
 if(!best)throw new Error(`No modular layout for ${count} photos`);
 return best;
}
