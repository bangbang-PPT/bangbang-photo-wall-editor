import test from 'node:test';
import assert from 'node:assert/strict';
import {freeGridLayout,regularGridLayout,separated,nextGridSeed,layoutStructureDistance} from '../src/free-grid-layout.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const touching=(a,b)=>Math.abs(a-b)<1e-8;
function checkSeams(rectangles,gap){
 gap=rectangles[0]?.gap??gap;
 let horizontal=0,vertical=0;
 for(let i=0;i<rectangles.length;i++)for(const b of rectangles.slice(i+1)){
  const a=rectangles[i],ra=a.region,rb=b.region;
  assert.ok(separated(a,b,gap),'frames must not overlap or narrow a seam');
  const rowOverlap=Math.min(ra.y+ra.h,rb.y+rb.h)-Math.max(ra.y,rb.y);
  const colOverlap=Math.min(ra.x+ra.w,rb.x+rb.w)-Math.max(ra.x,rb.x);
  if(rowOverlap>1e-8&&(touching(ra.x+ra.w,rb.x)||touching(rb.x+rb.w,ra.x))){
   close(Math.abs(a.x-b.x)-(a.width+b.width)/2,gap);horizontal++;
  }
  if(colOverlap>1e-8&&(touching(ra.y+ra.h,rb.y)||touching(rb.y+rb.h,ra.y))){
   close(Math.abs(a.y-b.y)-(a.height+b.height)/2,gap);vertical++;
  }
 }
 return {horizontal,vertical};
}
for(const [name,layout] of [['regular',regularGridLayout],['free',freeGridLayout]]){
 test(`${name}: every supported quantity has usable proportions and equal seams`,()=>{
  for(let count=3;count<=72;count++)for(const seed of [1,2,42]){
   const rectangles=layout(Array(count).fill(.75),{seed,gap:16});
   assert.equal(rectangles.length,count);
   rectangles.forEach((r,i)=>{
    assert.equal(r.index,i);assert.ok(Number.isFinite(r.x)&&Number.isFinite(r.y));
    assert.ok(r.width>0&&r.height>0);
    assert.ok(Math.max(r.width/r.height,r.height/r.width)<=2.8+1e-8,`${name} ${count}/${seed}: strip`);
   });
   const seams=checkSeams(rectangles,16);
   assert.ok(seams.horizontal+seams.vertical>0);
   const areas=rectangles.map(r=>r.width*r.height);
   assert.ok(Math.max(...areas)/Math.min(...areas)<6.5,'avoid giant and tiny tiles in one wall');
  }
 });
 test(`${name}: full spacing range preserves arrangement without overlaps`,()=>{
  for(const count of [3,4,8,12,37,72])for(const gap of [0,16,160]){
   const rectangles=layout(Array(count).fill(1),{gap});checkSeams(rectangles,gap);
   assert.ok(rectangles.every(r=>Math.max(r.width/r.height,r.height/r.width)<=2.8+1e-8));
   assert.deepEqual(rectangles.map(r=>r.region),layout(Array(count).fill(2),{gap:0}).map(r=>r.region));
  }
 });
 test(`${name}: repeatable, with different shuffle settings`,()=>{
  const aspects=Array(12).fill(.75),options={seed:3};
  const result=layout(aspects,options);
  assert.deepEqual(result,layout(aspects,options));
  assert.notDeepEqual(result,layout(aspects,{seed:4}));
  assert.deepEqual(result,layout(aspects,{...options,stagger:0,width:600}));
  assert.ok(result.some(r=>r.width/r.height>1.2));
  assert.ok(result.some(r=>r.width/r.height<.85));
  assert.deepEqual(result,layout(Array(12).fill(2),options));
 });
}
test('regular wall fills one rectangle; free wall has staggered outer edges',()=>{
 for(const count of [4,8,12,24,72]){
  const bounds=rs=>({left:Math.min(...rs.map(r=>r.x)),right:Math.max(...rs.map(r=>r.x+r.w)),top:Math.min(...rs.map(r=>r.y)),bottom:Math.max(...rs.map(r=>r.y+r.h))});
  const regular=regularGridLayout(Array(count).fill(1)).map(r=>r.region),b=bounds(regular);
  close(regular.reduce((area,r)=>area+r.w*r.h,0),(b.right-b.left)*(b.bottom-b.top));
  const free=freeGridLayout(Array(count).fill(1)).map(r=>r.region),f=bounds(free);
  assert.ok(free.reduce((area,r)=>area+r.w*r.h,0)<(f.right-f.left)*(f.bottom-f.top)-1e-7);
 }
});
test('legacy main-photo settings are ignored and the wall stays centered',()=>{
 for(const main of [-1,0,7]){
  const frames=freeGridLayout(Array(12).fill(1),{main,gap:16});
  assert.deepEqual(frames,freeGridLayout(Array(12).fill(1),{gap:16}));
  assert.deepEqual(frames.map(r=>r.index),Array.from({length:12},(_,i)=>i));
  for(const axis of ['x','y']){
   const dimension=axis==='x'?'width':'height';
   close(Math.min(...frames.map(r=>r[axis]-r[dimension]/2))+Math.max(...frames.map(r=>r[axis]+r[dimension]/2)),0);
  }
 }
});
test('horizontal and vertical free walls preserve a uniform gap',()=>{
 for(const direction of ['horizontal','vertical'])for(const count of [3,12,37,72])for(const gap of [0,16,160]){
  checkSeams(freeGridLayout(Array(count).fill(1),{direction,gap,lanes:3}),gap);
 }
});
test('regular visible outline follows the canvas ratio including spacing insets',()=>{
 for(const aspect of [1,16/9,9/16,4/3,21/9])for(const count of [3,4,8,13,24,72])for(const seed of [1,2,42])for(const gap of [0,16,160]){
  const frames=regularGridLayout(Array(count).fill(1),{aspect,gap,seed});
  const width=Math.max(...frames.map(r=>r.x+r.width/2))-Math.min(...frames.map(r=>r.x-r.width/2));
  const height=Math.max(...frames.map(r=>r.y+r.height/2))-Math.min(...frames.map(r=>r.y-r.height/2));
  close(width/height,aspect);checkSeams(frames,gap);
  assert.ok(frames.every(r=>r.width>0&&r.height>0));
 }
});
test('shuffle changes photo neighborhoods, not only frame sizes',()=>{
 const neighborhood=frames=>{
  const neighbors=new Set();
  for(let i=0;i<frames.length;i++)for(const b of frames.slice(i+1)){
   const a=frames[i],ra=a.region,rb=b.region;
   const rows=Math.min(ra.y+ra.h,rb.y+rb.h)-Math.max(ra.y,rb.y);
   const cols=Math.min(ra.x+ra.w,rb.x+rb.w)-Math.max(ra.x,rb.x);
   if((rows>1e-8&&(touching(ra.x+ra.w,rb.x)||touching(rb.x+rb.w,ra.x)))||(cols>1e-8&&(touching(ra.y+ra.h,rb.y)||touching(rb.y+rb.h,ra.y))))neighbors.add(`${a.index}:${b.index}`);
  }
  return neighbors;
 };
 for(const layout of [regularGridLayout,freeGridLayout])for(const count of [8,13,24]){
  const a=neighborhood(layout(Array(count).fill(1),{seed:1,aspect:16/9}));
  const options={seed:1,aspect:16/9,outline:layout===regularGridLayout?'regular':'free'};
  const seed=nextGridSeed(Array(count).fill(1),options);
  const b=neighborhood(layout(Array(count).fill(1),{...options,seed}));
  const retained=[...a].filter(pair=>b.has(pair)).length;
  assert.ok(retained<a.size,`${layout.name}/${count}: photo neighborhoods must change`);
  assert.ok(layoutStructureDistance(layout(Array(count).fill(1),options),layout(Array(count).fill(1),{...options,seed}))>=.18*Math.min(1,Math.sqrt(13/count)));
 }
});
test('structure comparison ignores photo swaps and small cut adjustments',()=>{
 const frames=regularGridLayout(Array(13).fill(1),{aspect:1,seed:2});
 close(layoutStructureDistance(frames,frames.map((r,i)=>({...r,index:12-i}))),0);
 assert.ok(layoutStructureDistance(frames,frames.map(r=>({...r,width:r.width*1.01,height:r.height*.99})))<.02);
});
test('frames use integer modules with exact double-card widths and heights',()=>{
 for(const layout of [regularGridLayout,freeGridLayout])for(const seed of [1,2,3,42]){
  const frames=layout(Array(13).fill(1),{seed,aspect:16/9,gap:19,width:139});
  for(const r of frames){
   assert.ok([1,2].includes(r.region.w)&&[1,2].includes(r.region.h));
   assert.ok(Number.isInteger(r.region.x)&&Number.isInteger(r.region.y));
  }
  for(const [axis,dimension] of [['w','width'],['h','height']]){
   const units=frames.filter(r=>r.region[axis]===1),doubles=frames.filter(r=>r.region[axis]===2);
   assert.ok(units.length&&doubles.length);
   units.forEach(r=>close(r[dimension],units[0][dimension]));
   doubles.forEach(r=>close(r[dimension],2*units[0][dimension]+19));
  }
 }
});
test('13-photo random walls avoid repeated seams resembling three complete rows',()=>{
 for(const layout of [regularGridLayout,freeGridLayout])for(let seed=1;seed<=32;seed++){
  const frames=layout(Array(13).fill(1),{seed,aspect:16/9}),regions=frames.map(r=>r.region);
  for(const axis of ['x','y']){
   const size=axis==='x'?'w':'h',other=axis==='x'?'h':'w';
   const start=Math.min(...regions.map(r=>r[axis])),end=Math.max(...regions.map(r=>r[axis]+r[size]));
   const otherSpan=Math.max(...regions.map(r=>r[axis==='x'?'y':'x']+r[other]))-Math.min(...regions.map(r=>r[axis==='x'?'y':'x']));
   const seams=new Map();
   for(const r of regions)for(const coordinate of [r[axis],r[axis]+r[size]]){
    if(Math.abs(coordinate-start)<1e-7||Math.abs(coordinate-end)<1e-7)continue;
    const key=coordinate.toFixed(5);seams.set(key,(seams.get(key)||0)+r[other]);
   }
   assert.ok([...seams.values()].filter(span=>span/otherSpan>=1.7).length<2,`${layout.name}/${seed} has repeated full-length ${axis} seams`);
  }
 }
});
test('repeated shuffle changes structure after removing main-photo constraints',()=>{
 for(const [outline,layout] of [['regular',regularGridLayout],['free',freeGridLayout]])for(const aspect of [1,16/9,9/16]){
  const photos=Array(13).fill(1),options={outline,aspect,seed:1,width:139,gap:19};
  for(let version=0;version<6;version++){
   const previous=layout(photos,options),nextSeed=nextGridSeed(photos,options);
   assert.notEqual(nextSeed,options.seed);options.seed=nextSeed;
   const next=layout(photos,options);assert.ok(layoutStructureDistance(previous,next)>=.18);
   checkSeams(next,19);
  }
 }
});



test('spacing shrinks cards inside fixed canvas bounds and has an adaptive budget',()=>{
 const bounds=frames=>[
  Math.max(...frames.map(r=>r.x+r.width/2))-Math.min(...frames.map(r=>r.x-r.width/2)),
  Math.max(...frames.map(r=>r.y+r.height/2))-Math.min(...frames.map(r=>r.y-r.height/2))
 ];
 for(const layout of [regularGridLayout,freeGridLayout])for(const count of [3,13,72]){
  const options={canvasWidth:1920,canvasHeight:1080,aspect:16/9,seed:3};
  const base=layout(Array(count).fill(1),{...options,gap:0});
  const maximum=layout(Array(count).fill(1),{...options,gap:1e6});
  assert.ok(maximum[0].gapLimit>0);
  close(maximum[0].gap,maximum[0].gapLimit);
  bounds(base).forEach((v,i)=>close(v,bounds(maximum)[i]));
  assert.deepEqual(base.map(r=>r.region),maximum.map(r=>r.region));
  maximum.forEach((r,i)=>assert.ok(r.width<=base[i].width+1e-8&&r.height<=base[i].height+1e-8&&r.width*r.height<base[i].width*base[i].height));
  checkSeams(maximum,maximum[0].gap);
  const large=layout(Array(count).fill(1),{...options,canvasWidth:3840,canvasHeight:2160,gap:1e6});
  assert.ok(large[0].gapLimit>maximum[0].gapLimit);
 }
});

test('free silhouettes have substantial open edges and remain connected',()=>{
 for(const count of [8,12,13,24,37,72])for(const seed of [1,2,7,42]){
  const regions=freeGridLayout(Array(count).fill(1),{seed,edge:65}).map(r=>r.region);
  const occupied=new Set();
  for(const r of regions)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)occupied.add(x+','+y);
  const width=Math.max(...regions.map(r=>r.x+r.w)),height=Math.max(...regions.map(r=>r.y+r.h));
  assert.ok(occupied.size<width*height*.88,'leave visible background around the outer arms');
  const starts=[],ends=[];
  for(let y=0;y<height;y++){
   const cells=Array.from({length:width},(_,x)=>x).filter(x=>occupied.has(x+','+y));
   starts.push(Math.min(...cells));ends.push(Math.max(...cells));
  }
  assert.ok(new Set(starts).size>1&&new Set(ends).size>1,'stagger both side edges');
  const visited=new Set(),queue=[[...occupied][0]];
  while(queue.length){
   const key=queue.pop();if(visited.has(key))continue;visited.add(key);
   const [x,y]=key.split(',').map(Number);
   for(const point of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
    const neighbor=point.join(',');if(occupied.has(neighbor)&&!visited.has(neighbor))queue.push(neighbor);
   }
  }
  assert.equal(visited.size,occupied.size,'no isolated cards');
 }
});
