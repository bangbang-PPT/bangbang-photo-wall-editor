import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { gridCardPose, curvedCardPose, DESIGN_SCALE } from '../src/ring-layout.js';

// Exercise the actual editor camera functions without WebGL or project storage.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function section(from, to) {
  const start = source.indexOf(from), end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}
function editorCamera() {
  const context = vm.createContext({ THREE, gridCardPose, curvedCardPose, DESIGN_SCALE });
  vm.runInContext(`
    const state={mode:'isometric',count:24,rows:5,columns:5,cardWidth:240,cardHeight:240,
      columnGap:39,rowGap:39,gridStagger:0,gridStaggerDirection:'horizontal',
      tiltX:0,tiltY:0,tiltZ:45,tilt:45,rotation:0,zoom:220,fov:38,radius:4.2};
    const isRingMode=()=>false,isGridMode=()=>true,isIsometricMode=()=>true;
    const WORLD_X_AXIS=new THREE.Vector3(1,0,0),WORLD_Y_AXIS=new THREE.Vector3(0,1,0),WORLD_Z_AXIS=new THREE.Vector3(0,0,1);
    const worldTiltQuaternion=new THREE.Quaternion(),cameraTarget=new THREE.Vector3();
    const host={getBoundingClientRect:()=>({width:960,height:540})};
    const renderer={setSize(){}};
    let camera=new THREE.PerspectiveCamera(38,16/9,.1,80),isOrthographicCamera=false;
    let cameraHalfSpan=7,cameraDistance=20,lastCanvasSize={width:0,height:0};
    function updateTransforms(){fitCamera(true)}
    ${section('function setCameraProjection(', 'const renderer =')}
    ${section('function cardWidthWorld()', 'function activeTiltValue()')}
    ${section('const orbitYAxis=', 'function releaseCard(')}
    function signature(){camera.updateMatrixWorld(true);return [...camera.projectionMatrix.elements,...camera.matrixWorld.elements]}
    function pixelScale(){return {x:960/(camera.right-camera.left),y:540/(camera.top-camera.bottom)}}
  `, context);
  return code => vm.runInContext(code, context);
}
function equalMatrix(a,b) {
  assert.equal(a.length,b.length);
  a.forEach((value,index)=>assert.ok(Math.abs(value-b[index])<1e-10,`matrix entry ${index}: ${value} vs ${b[index]}`));
}
test('new orthographic camera preserves equal horizontal and vertical pixel scale',()=>{
  const run=editorCamera();
  const scale=run('setCameraProjection(true);fitCamera(true);pixelScale()');
  assert.ok(Math.abs(scale.x-scale.y)<1e-10,`unequal pixel scale: ${scale.x}, ${scale.y}`);
});
test('switching projection with an unchanged canvas size preserves the image',()=>{
  const run=editorCamera();
  const before=run('setCameraProjection(true);resize();signature()');
  const after=run('setCameraProjection(false);resize();setCameraProjection(true);resize();signature()');
  equalMatrix(before,after);
});
test('camera fit is independent of the previous angle and cached framing',()=>{
  const run=editorCamera();
  const expected=run('setCameraProjection(true);resize();signature()');
  const actual=run('state.tilt=0;fitCamera(true);state.tilt=45;fitCamera();signature()');
  equalMatrix(expected,actual);
  equalMatrix(expected,run('cameraHalfSpan=100;cameraDistance=200;fitCamera();signature()'));
});
test('0 and 45 degrees remain distinct and a round trip restores 45 exactly',()=>{
  const run=editorCamera();
  const start=run('setCameraProjection(true);resize();signature()');
  const flat=run('state.tilt=0;fitCamera();signature()');
  assert.ok(start.some((value,index)=>Math.abs(value-flat[index])>1e-6));
  equalMatrix(start,run('state.tilt=45;fitCamera();signature()'));
});
