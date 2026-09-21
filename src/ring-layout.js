import * as THREE from 'three';

export const CARD_WIDTH = 1.88;
export const CARD_HEIGHT = 2.4;
export const DESIGN_SCALE = 100;

export function radiusForGap(count, gap, cardWidth=CARD_WIDTH) {
  const halfStep = Math.PI / count;
  return (cardWidth * Math.cos(halfStep) + gap) / (2 * Math.sin(halfStep));
}

export function gapForRadius(count, radius, cardWidth=CARD_WIDTH) {
  const halfStep = Math.PI / count;
  return 2 * radius * Math.sin(halfStep) - cardWidth * Math.cos(halfStep);
}

export function cardWidthForGap(count, radius, gap, cardWidth=CARD_WIDTH) {
  const halfStep = Math.PI / count;
  return Math.max(0.2, (2 * radius * Math.sin(halfStep) - gap) / Math.cos(halfStep));
}

export function cardScaleForGap(count, radius, gap, cardWidth=CARD_WIDTH) {
  return cardWidthForGap(count, radius, gap, cardWidth) / cardWidth;
}

// The ring lies in XY; the cylinder axis and every card's up vector are Z.
// Cards always occupy the complete 360° distribution. Width changes affect
// only each card's own surface, never the ring coverage.
export function ringCardPose(index, count, radius, gap=0, phase=0, cardWidth=CARD_WIDTH) {
  const fullStep = Math.PI * 2 / count;
  const angle = -Math.PI / 2 + index * fullStep + phase;
  const radial = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
  const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
  const axis = new THREE.Vector3(0, 0, 1);
  const basis = new THREE.Matrix4().makeBasis(tangent, axis, radial);
  return {
    position: radial.multiplyScalar(radius),
    quaternion: new THREE.Quaternion().setFromRotationMatrix(basis),
    width: cardWidth,
  };
}

// A flat radial ring. Unlike ringCardPose, the card surface stays planar;
// every card keeps its local Y axis parallel to the world's Y axis, while
// its local X axis points along the radius away from the center. The ring
// therefore stays level until the wall's separate overall tilt is applied.
export function bloomCardPose(index, count, radius, gap=0, phase=0, cardWidth=CARD_WIDTH) {
  const fullStep = Math.PI * 2 / count;
  const angle = -Math.PI / 2 + index * fullStep + phase;
  const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
  const axis = new THREE.Vector3(0, 1, 0);
  const basis = new THREE.Matrix4().makeBasis(radial, axis, tangent);
  return {
    position: radial.multiplyScalar(radius),
    quaternion: new THREE.Quaternion().setFromRotationMatrix(basis),
    width: cardWidth,
  };
}

// An open cylindrical section used by the curved wall presets. The default
// axis keeps the original layout: columns follow a horizontal arc and every
// other row is shifted by half a card step. The vertical axis variant turns
// that same arc through Y, so the top and bottom rows are the fixed ends.
export function curvedCardPose(index, rows, columns, columnGap=0, rowGap=0, bend=72, cardWidth=CARD_WIDTH, cardHeight=CARD_HEIGHT, stagger=0.5, axis='horizontal', staggerDirection='horizontal') {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const horizontal = axis !== 'vertical';
  const step = horizontal ? cardWidth + columnGap : cardHeight + rowGap;
  // Stagger is expressed as a fraction of one card step. It shifts adjacent
  // rows for the horizontal arc and adjacent columns for the vertical arc.
  const staggerOffset = THREE.MathUtils.clamp(stagger, 0, 1);
  const horizontalStagger = staggerDirection !== 'vertical';
  const offset = horizontal
    ? column - (columns - 1) / 2 + (horizontalStagger && row % 2 ? staggerOffset : 0)
    : row - (rows - 1) / 2;
  const verticalStaggerOffset = !horizontalStagger && column % 2 ? staggerOffset : 0;
  const columnStep = cardWidth + columnGap;
  const bendRadians = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(bend, -180, 180));
  let position;
  let tangent;
  let normal;
  let verticalTangent;
  const arcCount = horizontal ? columns : rows;
  if (Math.abs(bendRadians) < 1e-4 || arcCount < 2) {
    position = horizontal
      ? new THREE.Vector3(offset * step, ((rows - 1) / 2 - row + verticalStaggerOffset) * (cardHeight + rowGap), 0)
      : new THREE.Vector3((column - (columns - 1) / 2) * columnStep, -offset * step + verticalStaggerOffset * (cardHeight + rowGap), 0);
    tangent = new THREE.Vector3(1, 0, 0);
    verticalTangent = new THREE.Vector3(0, 1, 0);
    normal = new THREE.Vector3(0, 0, 1);
  } else {
    // Keep the arc length between neighboring cards constant. The sign only
    // controls which side of the wall bends toward the camera.
    const bendSign = Math.sign(bendRadians);
    const angleStep = Math.abs(bendRadians) / Math.max(1, arcCount - 1);
    const radius = step / angleStep;
    const angle = offset * angleStep;
    if (horizontal) {
      position = new THREE.Vector3(
        radius * Math.sin(angle),
        ((rows - 1) / 2 - row) * (cardHeight + rowGap),
        -bendSign * radius * (1 - Math.cos(angle)),
      );
      tangent = new THREE.Vector3(Math.cos(angle), 0, -bendSign * Math.sin(angle)).normalize();
      normal = new THREE.Vector3(bendSign * Math.sin(angle), 0, Math.cos(angle)).normalize();
    } else {
      // The left-right wall bends only through Y. Every row sits on the same
      // continuous vertical arc, while columns stay on straight, even X
      // intervals so the front view keeps a calm, regular rhythm.
      const rowBendRadians = bendRadians * 0.6;
      const rowAngleStep = Math.abs(rowBendRadians) / Math.max(1, rows - 1);
      const rowRadius = step / rowAngleStep;
      const rowAngle = offset * rowAngleStep;
      const rawColumnOffset = column - (columns - 1) / 2 + (horizontalStagger && row % 2 ? staggerOffset : 0);
      position = new THREE.Vector3(
        rawColumnOffset * columnStep,
        -rowRadius * Math.sin(rowAngle) + verticalStaggerOffset * (cardHeight + rowGap),
        -bendSign * rowRadius * (1 - Math.cos(rowAngle)),
      );
      const tangentX = new THREE.Vector3(1, 0, 0);
      const tangentY = new THREE.Vector3(0, Math.cos(rowAngle), bendSign * Math.sin(rowAngle)).normalize();
      tangent = tangentX;
      normal = new THREE.Vector3().crossVectors(tangentX, tangentY).normalize();
      // The local Y basis is supplied below after the shared normal is set.
      verticalTangent = tangentY;
    }
  }
  const basis = horizontal
    ? new THREE.Matrix4().makeBasis(tangent, new THREE.Vector3(0, 1, 0), normal)
    : new THREE.Matrix4().makeBasis(tangent, verticalTangent || new THREE.Vector3(0, 1, 0), normal);
  return {
    position,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(basis),
    width: cardWidth,
    row,
    column,
    // Keep the sign so the card surface reverses with the wall when bend is
    // negative; an absolute radius would leave every card bowed the same way.
    curvatureRadius: horizontal
      ? (Math.abs(bendRadians) >= 1e-4 && columns >= 2 ? Math.sign(bendRadians) * step / (Math.abs(bendRadians) / Math.max(1, columns - 1)) : 0)
      : (Math.abs(bendRadians * 0.6) >= 1e-4 && rows >= 2 ? Math.sign(bendRadians) * step / (Math.abs(bendRadians * 0.6) / Math.max(1, rows - 1)) : 0),
    curvatureAxis: horizontal ? 'x' : 'y',
  };
}

// A flat grid wall. The stagger is intentionally one-dimensional: horizontal
// mode offsets alternating rows, while vertical mode offsets alternating
// columns. This keeps the layout predictable and prevents two independent
// offsets from pushing cards into each other.
export function gridCardPose(index, rows, columns, columnGap=0, rowGap=columnGap, stagger=0, direction='horizontal', cardWidth=CARD_WIDTH, cardHeight=CARD_HEIGHT) {
  const safeColumns=Math.max(1,Math.round(columns));
  const row=Math.floor(index/safeColumns);
  const column=index%safeColumns;
  const amount=THREE.MathUtils.clamp(Number(stagger)||0,0,1);
  const stepX=cardWidth+columnGap;
  const stepY=cardHeight+rowGap;
  const rowOffset=direction==='horizontal'&&row%2?amount*stepX:0;
  const columnOffset=direction==='vertical'&&column%2?amount*stepY:0;
  return {
    position:new THREE.Vector3(
      (column-(safeColumns-1)/2)*stepX+rowOffset,
      ((Math.max(1,Math.round(rows))-1)/2-row)*stepY+columnOffset,
      0,
    ),
    quaternion:new THREE.Quaternion(),
    width:cardWidth,
    row,
    column,
    curvatureRadius:0,
    curvatureAxis:'x',
  };
}
