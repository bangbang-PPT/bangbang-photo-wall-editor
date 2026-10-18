import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {concentricLayout} from '../src/concentric-layout.js';

test('all supported counts preserve slots, card size and the requested radii',()=>{
  for(let count=3;count<=96;count++)for(let rings=1;rings<=8;rings++){
    const {poses,circles}=concentricLayout(count,{rings});
    assert.equal(poses.length,count);
    assert.equal(circles.reduce((n,c)=>n+c.count,0),count);
    circles.forEach((circle,i)=>{
      assert.ok(circle.count>=3);
      assert.ok(Math.abs(circle.radius-(4.2+i*2.4))<1e-8);
      if(i){assert.ok(circle.radius-circles[i-1].radius>=2.4-1e-8);assert.ok(circle.count>=circles[i-1].count)}
    });
    poses.forEach(p=>{
      assert.equal(p.width,1.88);assert.equal(p.height,1.2);
      assert.ok(p.position.toArray().every(Number.isFinite));
      assert.ok(p.quaternion.toArray().every(Number.isFinite));
      const up=new THREE.Vector3(0,1,0).applyQuaternion(p.quaternion);
      assert.ok(up.distanceTo(new THREE.Vector3(0,0,1))<1e-8);
    });
  }
});

test('compact radii are never expanded to fit photos, even when slots overlap',()=>{
  for(const count of [3,46,54,96]){
    const {poses,circles}=concentricLayout(count,{radius:1.05,ringGap:.4});
    circles.forEach((c,i)=>assert.ok(Math.abs(c.radius-(1.05+i*.4))<1e-8));
    poses.forEach(p=>assert.ok(Math.abs(p.position.length()-circles[p.ring].radius)<1e-8));
    assert.equal(poses.length,count);
    assert.ok(poses.every(p=>p.width===1.88&&p.height===1.2));
  }
});

test('alternating stagger moves every slot of the second ring together',()=>{
  const original=concentricLayout(54),shifted=concentricLayout(54,{stagger:1});
  assert.deepEqual(original.circles,shifted.circles);
  original.poses.forEach((pose,i)=>{
    const next=shifted.poses[i];
    assert.equal(next.ring,pose.ring);assert.equal(next.column,pose.column);
    if(pose.ring%2){
      const step=Math.PI/original.circles[pose.ring].count;
      assert.ok(pose.position.clone().applyAxisAngle(new THREE.Vector3(0,0,1),step).distanceTo(next.position)<1e-8);
    }else assert.deepEqual(next.position,pose.position);
  });
});

test('inner and outer radius independently control the end rings',()=>{
  const first=concentricLayout(54,{radius:1.05,outerRadius:2.85});
  const next=concentricLayout(54,{radius:1.2,outerRadius:2.85});
  assert.equal(first.circles[0].radius,1.05);
  assert.equal(next.circles[0].radius,1.2);
  assert.ok(Math.abs(first.circles.at(-1).radius-2.85)<1e-8);
  assert.ok(Math.abs(next.circles.at(-1).radius-2.85)<1e-8);
});

test('signed layer height moves complete rings along Z without altering their layout',()=>{
  const options={rings:4,radius:2.03,outerRadius:5.75,stagger:.5};
  const flat=concentricLayout(54,options);
  for(const heightStep of [-.6,.6]){
    const shifted=concentricLayout(54,{...options,heightStep});
    assert.deepEqual(shifted.circles,flat.circles);
    shifted.poses.forEach((pose,i)=>{
      const before=flat.poses[i];
      assert.equal(pose.ring,before.ring);assert.equal(pose.column,before.column);
      assert.equal(pose.position.x,before.position.x);assert.equal(pose.position.y,before.position.y);
      assert.equal(pose.position.z,pose.ring*heightStep);
      assert.deepEqual(pose.quaternion,before.quaternion);
      assert.equal(pose.width,before.width);assert.equal(pose.height,before.height);
    });
  }
  assert.ok(concentricLayout(54,{rings:1,heightStep:6}).poses.every(p=>p.position.z===0));
});
