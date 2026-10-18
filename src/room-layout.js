import * as THREE from 'three';

// Treat all four walls as one strip, then fold it at the room corners.
export function roomPerimeterPoint(distance, side) {
  const s=THREE.MathUtils.euclideanModulo(distance,side*4),half=side/2;
  if(s<side)return new THREE.Vector3(-half+s,-half,0);
  if(s<side*2)return new THREE.Vector3(half,-half+s-side,0);
  if(s<side*3)return new THREE.Vector3(half-(s-side*2),half,0);
  return new THREE.Vector3(-half,half-(s-side*3),0);
}

export function roomCardPose(index, rows, columns, gapX=0, gapY=0, cardWidth=1.88, cardHeight=2.4, stagger=0, _legacyWallStagger=0, direction='vertical') {
  const safeColumns=Math.max(1,Math.round(Number(columns)||1));
  const row=Math.floor(index/safeColumns),column=index%safeColumns;
  const amount=THREE.MathUtils.clamp(Number(stagger)||0,0,1);
  const crossStep=cardWidth+gapX,depthStep=cardHeight+gapY;
  const side=safeColumns*crossStep/4;
  // Only rings 2, 4, ... slide around the perimeter, by at most half a slot.
  // The other direction staggers alternate perimeter columns along depth.
  const ringShift=direction==='vertical'&&row%2?amount*crossStep*.5:0;
  const depthShift=direction==='horizontal'&&column%2?amount*depthStep*.5:0;
  const center=(column+.5)*crossStep+ringShift;
  const position=roomPerimeterPoint(center,side);
  position.z=((Math.max(1,Math.round(rows))-1)/2-row)*depthStep+depthShift;
  const surface={start:center-cardWidth/2,side,width:cardWidth,height:cardHeight};
  return {position,quaternion:new THREE.Quaternion(),width:cardWidth,height:cardHeight,
    row,column,face:Math.floor(THREE.MathUtils.euclideanModulo(center,side*4)/side),
    surface,curvatureRadius:0,curvatureAxis:'x'};
}

export function createRoomCardGeometry(pose) {
  const {start,side,width,height}=pose.surface;
  const end=start+width,cuts=[start];
  // Split exactly at corners to fold the same slot and image onto both faces.
  for(let corner=Math.floor(start/side)+1;corner*side<end-1e-9;corner++){
    if(corner*side>start+1e-9)cuts.push(corner*side);
  }
  cuts.push(end);
  const positions=[],uvs=[],indices=[];
  cuts.forEach((distance,index)=>{
    const point=roomPerimeterPoint(distance,side).sub(pose.position);
    for(const v of [0,1]){
      positions.push(point.x,point.y,(.5-v)*height);
      uvs.push((distance-start)/width,v);
    }
    if(index<cuts.length-1){const a=index*2;indices.push(a,a+2,a+1,a+2,a+3,a+1)}
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return geometry;
}
