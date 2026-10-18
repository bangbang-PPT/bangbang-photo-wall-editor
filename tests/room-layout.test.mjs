import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {roomCardPose,createRoomCardGeometry} from '../src/room-layout.js';

const pose=(i,amount,direction='vertical',columns=12)=>roomCardPose(i,5,columns,.08,.08,1.88,2.4,amount,0,direction);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('rings 1 and 3 stay aligned; rings 2 and 4 move by a fractional slot',()=>{
  for(let i=0;i<60;i++){
    const original=pose(i,0),shifted=pose(i,1);
    close(shifted.surface.start-original.surface.start,Math.floor(i/12)%2?.98:0);
    close(shifted.position.z,original.position.z);
    assert.equal(shifted.column,original.column);
    if(Math.floor(i/12)%2){
      const unshifted=Array.from({length:12},(_,j)=>pose(12+j,0).position);
      assert.ok(unshifted.every(p=>p.distanceTo(shifted.position)>.1));
    }
  }
});

test('corner-crossing slot folds onto both walls with continuous UVs and inward faces',()=>{
  const p=pose(14,1),g=createRoomCardGeometry(p);
  assert.equal(g.attributes.position.count,6);
  const pos=g.attributes.position,uv=g.attributes.uv;
  close(uv.getX(2),.5);close(uv.getX(3),.5);
  const points=Array.from({length:pos.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(pos,i).add(p.position));
  const half=p.surface.side/2;
  points.forEach(v=>close(Math.max(Math.abs(v.x),Math.abs(v.y)),half));
  assert.ok(points.some(v=>Math.abs(v.x-half)<1e-6&&Math.abs(v.y+half)<1e-6));
  let stripWidth=0;
  for(let i=0;i<points.length-2;i+=2)stripWidth+=points[i].distanceTo(points[i+2]);
  close(stripWidth,1.88);
  for(let i=0;i<g.index.count;i+=3){
    const [a,b,c]=[0,1,2].map(j=>points[g.index.getX(i+j)]);
    const normal=b.clone().sub(a).cross(c.clone().sub(a));
    const center=a.clone().add(b).add(c).multiplyScalar(1/3);
    assert.ok(normal.dot(new THREE.Vector3(-center.x,-center.y,0))>0);
  }
  g.dispose();
});

test('spacing stays uniform around the full ring, including the last seam',()=>{
  for(const columns of [3,4,5,8,12,13,16,24,72])for(const amount of [0,.18,.5,1]){
    const ring=Array.from({length:columns},(_,i)=>pose(columns+i,amount,'vertical',columns));
    ring.forEach((p,i)=>{
      const next=ring[(i+1)%columns];
      const nextStart=next.surface.start+(i===columns-1?p.surface.side*4:0);
      close(nextStart-(p.surface.start+p.width),.08);
      const g=createRoomCardGeometry(p);assert.ok(g.attributes.position.array.every(Number.isFinite));g.dispose();
    });
  }
});

test('horizontal stagger alternates perimeter columns in depth without changing wall positions',()=>{
  for(let i=0;i<60;i++){
    const original=pose(i,0,'horizontal'),shifted=pose(i,1,'horizontal');
    close(shifted.surface.start,original.surface.start);
    close(shifted.position.z-original.position.z,i%12%2?1.24:0);
    close(shifted.position.x,original.position.x);close(shifted.position.y,original.position.y);
  }
});
