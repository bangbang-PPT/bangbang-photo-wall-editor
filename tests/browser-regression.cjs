// Run against pnpm dev with Playwright installed, or set PLAYWRIGHT_MODULE to its package path.
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {layoutStructureDistance}=await import('../src/free-grid-layout.js');
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Expose diagnostics only in the intercepted test response; production is untouched.
  await page.route('**/src/main.js*',async route=>{
   const response=await route.fetch();
   await route.fulfill({response,body:await response.text()+`
    globalThis.__audit=()=>({count:state.count,mode:state.mode,loading:isLoadingProject,
     meshes:wallGroup.children.length,orphans:wallGroup.children.filter(m=>!cards.some(c=>c&&(c.mesh===m||c.backMesh===m))).length,
     untextured:wallGroup.children.filter(m=>!m.material.map).length,
     angles:[state.tilt,state.rotation,state.tiltX,state.tiltY,state.tiltZ,state.fov],ortho:isOrthographicCamera,
     quaternion:camera.quaternion.toArray(),target:cameraTarget.toArray(),zoom:state.zoom,seed:state.freeSeed,
     canvasRatio:state.width/state.height,corner:state.corner,gap:state.freeGap,gapLimit:Number(document.querySelector('#freeGapInput').max),frames:isPlanarMode()?freeGridPoses().map(p=>({x:p.position.x,y:p.position.y,width:p.width,height:p.height})):[]});
    globalThis.__setCount=setCount;globalThis.__save=saveCurrentProject;
    globalThis.__dimensions=setDimensions;
    globalThis.__legacyPlanarPreset=()=>restorePreset({mode:state.mode,name:'Legacy grid',settings:{...modeSettings[state.mode],corner:0,freeMain:7,planarDefaultsVersion:undefined}});
    globalThis.__restoreLegacyAngles=()=>{Object.assign(modeSettings[state.mode],{tilt:35,rotation:120,tiltX:50,tiltY:60,tiltZ:75,fov:38});applyModeSettings(state.mode);updateModeUI()};
    globalThis.__export=()=>exportImage('png','1080p');
   `});
  });
  const ready=()=>page.waitForFunction(()=>globalThis.__audit&&!__audit().loading&&__audit().untextured===0&&__audit().meshes===__audit().count*2);
  const audit=async()=>{await ready();const a=await page.evaluate(()=>__audit());assert.equal(a.orphans,0);assert.equal(a.untextured,0);return a};
  await page.goto(process.env.WALL_URL||'http://localhost:5173/',{waitUntil:'domcontentloaded'});await ready();
  // The original bug: temporary count=12 followed by saved count=8 left four orphan cards.
  await page.evaluate(()=>{__setCount(8);__save()});await ready();
  await page.reload({waitUntil:'domcontentloaded'});assert.equal((await audit()).count,8);
  for(const mode of ['bloom','curved','curvedHorizontal','single','grid','isometric','ring','regularGrid','freeGrid','room','concentric']){
   await page.locator('#'+mode+'Preset').click();const a=await audit();
   console.log(`reload/switch ${a.mode}: ${a.count} cards, ${a.orphans} orphans, ${a.untextured} untextured`);
  }
  mkdirSync('tmp',{recursive:true});
  await page.locator('#regularGridPreset').click();await ready();
  await page.evaluate(()=>__setCount(13));
  for(const [width,height] of [[1920,1080],[1080,1920],[1080,1080]]){
   await page.evaluate(([w,h])=>__dimensions(w,h),[width,height]);
   await page.waitForFunction(({width,height})=>__audit().canvasRatio===width/height,{width,height});
   const a=await audit(),frames=a.frames;
   const wallWidth=Math.max(...frames.map(r=>r.x+r.width/2))-Math.min(...frames.map(r=>r.x-r.width/2));
   const wallHeight=Math.max(...frames.map(r=>r.y+r.height/2))-Math.min(...frames.map(r=>r.y-r.height/2));
   assert.ok(Math.abs(wallWidth/wallHeight-width/height)<1e-8);
   await page.locator('#fitButton').click();
   await page.locator('#sceneFrame').screenshot({path:`tmp/regularGrid-ratio-${width}-${height}.png`});
  }
  await page.evaluate(()=>__dimensions(1920,1080));await ready();
  for(let version=0;version<3;version++){
   if(version)await page.locator('#shuffleFreeGrid').click();await audit();
   await page.locator('#fitButton').click();await page.locator('#sceneFrame').screenshot({path:`tmp/regularGrid-shuffle-${version}.png`});
  }
  await page.evaluate(()=>__dimensions(1080,1080));await ready();
  let previousSquare=(await audit()).frames;
  for(let version=0;version<4;version++){
   await page.locator('#shuffleFreeGrid').click();const current=(await audit()).frames;
   assert.ok(layoutStructureDistance(previousSquare,current)>=.18);
   await page.locator('#fitButton').click();await page.locator('#sceneFrame').screenshot({path:`tmp/regularGrid-square-shuffle-${version}.png`});
   previousSquare=current;
  }
  await page.evaluate(()=>__dimensions(1920,1080));await ready();
  for(const mode of ['regularGrid','freeGrid']){
   await page.locator('#'+mode+'Preset').click();await audit();
   assert.equal((await audit()).corner,15);
   assert.equal(await page.locator('#cardWidthInput').isVisible(),false);
   assert.equal(await page.locator('#freeStaggerInput').count(),0);
   assert.equal(await page.locator('#freeLanesInput').count(),0);
   await page.evaluate(()=>__setCount(13));await page.locator('#fitButton').click();
   const setGap=async value=>{await page.locator('#freeGapInput').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))},String(value));return audit()};
   const zero=await setGap(0),maximum=await setGap(zero.gapLimit);
   const extent=frames=>[Math.max(...frames.map(r=>r.x+r.width/2))-Math.min(...frames.map(r=>r.x-r.width/2)),Math.max(...frames.map(r=>r.y+r.height/2))-Math.min(...frames.map(r=>r.y-r.height/2))];
   extent(zero.frames).forEach((v,i)=>assert.ok(Math.abs(v-extent(maximum.frames)[i])<1e-8));
   assert.equal(maximum.gap,maximum.gapLimit);
   assert.ok(maximum.frames.some((r,i)=>r.width<zero.frames[i].width));
   await page.locator('#sceneFrame').screenshot({path:'tmp/'+mode+'-maximum-gap.png'});
   await page.evaluate(()=>__dimensions(3840,2160));await page.waitForFunction(limit=>__audit().gapLimit>limit,maximum.gapLimit);const large=await audit();
   assert.ok(large.gapLimit>maximum.gapLimit);
   await setGap(large.gapLimit);
   await page.evaluate(()=>{__dimensions(1920,1080);__setCount(72)});const many=await audit();
   assert.ok(many.gap<=many.gapLimit);
   assert.ok(many.gapLimit<large.gapLimit);
   await setGap(16);await page.evaluate(()=>__setCount(13));

   assert.equal(await page.locator('[data-free-main]').count(),0);
   assert.equal(await page.locator('#freeMainInput').count(),0);
   await page.evaluate(()=>__legacyPlanarPreset());assert.equal((await audit()).corner,15);
   await page.evaluate(()=>__restoreLegacyAngles());
   const before=await audit();assert.equal(before.ortho,true);assert.deepEqual(before.angles,[0,0,0,0,0,0]);
   assert.equal(await page.locator('#wallTiltControl').isVisible(),false);
   assert.equal(await page.locator('#cameraRotationControl').isVisible(),false);
   assert.ok(!(await page.locator('#previewTip').innerText()).includes('360'));
   const canvas=page.locator('#sceneFrame canvas').first(),box=await canvas.boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+40,{steps:6});await page.mouse.up();
   const after=await audit();assert.deepEqual(after.angles,before.angles);
   after.quaternion.forEach((v,i)=>assert.ok(Math.abs(v-before.quaternion[i])<1e-8));
   assert.notDeepEqual(after.target,before.target);
   await page.mouse.wheel(0,-80);await page.waitForTimeout(150);assert.notEqual((await audit()).zoom,after.zoom);
   for(const count of [4,8,12,24,72]){
    await page.evaluate(count=>__setCount(count),count);await audit();
    await page.locator('#fitButton').click();
    if(count<=12)await page.locator('#sceneFrame').screenshot({path:`tmp/${mode}-${count}.png`});
   }
   await page.evaluate(()=>{__setCount(12);__save()});await ready();
   const oldSeed=(await audit()).seed;
   await page.locator('#shuffleFreeGrid').click();await audit();const newSeed=(await audit()).seed;assert.notEqual(newSeed,oldSeed);
   await page.evaluate(()=>__save());await page.reload({waitUntil:'domcontentloaded'});
   const saved=await audit();assert.equal(saved.mode,mode);assert.equal(saved.count,12);assert.equal(saved.seed,newSeed);
   const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>__export());
   const download=await downloadPromise;await download.saveAs(`tmp/${mode}-export.png`);assert.equal(await download.failure(),null);
   await page.locator('#cornerInput').evaluate(input=>{input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}))});
   await page.evaluate(()=>__save());await page.reload({waitUntil:'domcontentloaded'});assert.equal((await audit()).corner,0);
  }
  assert.deepEqual(errors,[]);console.log('PASS: startup, mode switches, fixed view, pan/zoom, counts, persistence and PNG exports');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
