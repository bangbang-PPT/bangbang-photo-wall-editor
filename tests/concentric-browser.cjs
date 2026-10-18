const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/src/main.js*',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+`
        globalThis.__concentricAudit=()=>({mode:state.mode,count:state.count,rows:state.rows,
          stagger:state.staggerHorizontal,heightStep:state.concentricHeightStep,photos:state.photos.map(projectPhotoRef),fitRadius:state.concentricFitRadius,projection:camera.projectionMatrix.toArray(),
          view:{tilts:[state.tiltX,state.tiltY,state.tiltZ],cameraX:state.tilt,cameraAxis:state.cameraAxis,fov:state.fov,
            zoom:state.zoom,target:cameraTarget.toArray(),direction:state.imageDirection,opacity:state.photoOpacity,
            corner:state.corner,contentRotation:state.contentRotation,backBrightness:state.backBrightness},
          circles:isConcentricMode()?concentricPoses().circles:[],
          cards:cards.map(c=>c?({visible:c.mesh.visible,map:!!c.frontMaterial.map,
            position:c.mesh.position.toArray(),size:c.sizeUniform.value.toArray(),scale:c.mesh.scale.toArray(),sides:[c.frontMaterial.side,c.backMaterial.side],brightness:c.backMaterial.color.r}):null)});
        globalThis.__concentricSave=saveCurrentProject;
        globalThis.__concentricReset=resetCurrentEffect;
        globalThis.__concentricCount=setCount;
        globalThis.__concentricExport=()=>exportImage('png','1K');
        globalThis.__concentricClipping=()=>({near:camera.near,far:camera.far,
          depths:concentricPoses().poses.map(p=>-p.position.clone().applyQuaternion(wallGroup.quaternion).applyMatrix4(camera.matrixWorldInverse).z)});
      `});
    });
    const ready=()=>page.waitForFunction(()=>globalThis.__concentricAudit?.().mode==='concentric'&&
      __concentricAudit().cards.length===__concentricAudit().count&&__concentricAudit().cards.every(c=>c?.visible&&c.map));
    await page.goto(process.env.WALL_URL||'http://localhost:5173/',{waitUntil:'networkidle'});
    await page.locator('#concentricPreset').click();await ready();
    const initial=await page.evaluate(()=>__concentricAudit());
    assert.equal(initial.count,54);assert.equal(initial.rows,4);assert.equal(initial.stagger,0);
    assert.equal(initial.heightStep,66);
    assert.deepEqual(initial.view,{tilts:[0,0,0],cameraX:-30,cameraAxis:'x',fov:47,zoom:250,target:[0,1.6,0],
      direction:'up',opacity:100,corner:15,contentRotation:0,backBrightness:100});
    assert.deepEqual(initial.circles.map(c=>c.count),[7,11,16,20]);
    initial.circles.forEach((circle,i)=>assert.ok(Math.abs(circle.radius-(2.03+i*1.24))<1e-8));
    assert.ok(initial.cards.every(c=>JSON.stringify(c.size)==='[1.88,1.2]'&&JSON.stringify(c.scale)==='[1,1,1]'));
    assert.ok(initial.cards.every(c=>JSON.stringify(c.sides)==='[1,0]'));
    assert.equal(await page.locator('#concentricSummary').count(),0);
    mkdirSync('tmp',{recursive:true});
    await page.locator('#sceneFrame').screenshot({path:'tmp/concentric-default.png'});
    await page.locator('#concentricPreset').screenshot({path:'tmp/concentric-thumbnail.png'});
    const slider=async(name,value)=>page.locator('#concentric'+name+'Input').evaluate((input,value)=>{
      input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
    },String(value));
    for(const heightStep of [60,-60]){
      await slider('HeightStep',heightStep);await ready();
      const elevated=await page.evaluate(()=>__concentricAudit());
      assert.equal(elevated.heightStep,heightStep);
      assert.deepEqual(elevated.photos,initial.photos);assert.deepEqual(elevated.circles,initial.circles);
      let index=0;
      initial.circles.forEach((circle,ring)=>{
        for(let column=0;column<circle.count;column++,index++){
          assert.deepEqual(elevated.cards[index].position.slice(0,2),initial.cards[index].position.slice(0,2));
          assert.ok(Math.abs(elevated.cards[index].position[2]-ring*heightStep/100)<1e-8);
        }
      });
    }
    await page.locator('#sceneFrame').screenshot({path:'tmp/concentric-layer-height.png'});
    await page.evaluate(()=>__concentricSave());await page.reload({waitUntil:'networkidle'});await ready();
    assert.equal((await page.evaluate(()=>__concentricAudit())).heightStep,-60);
    await page.locator('#concentricHeightStepInput').click({button:'right'});await ready();
    assert.equal((await page.evaluate(()=>__concentricAudit())).heightStep,66);
    await slider('Radius',105);await slider('RingGap',40);
    const compact=await page.evaluate(()=>__concentricAudit());
    compact.circles.forEach((circle,i)=>assert.ok(Math.abs(circle.radius-(1.05+i*.4))<1e-8));
    assert.deepEqual(compact.projection,initial.projection);
    assert.deepEqual(compact.photos,initial.photos);
    await slider('OuterRadius',285);
    const outerAdjusted=await page.evaluate(()=>__concentricAudit());
    assert.ok(Math.abs(outerAdjusted.circles.at(-1).radius-2.85)<1e-8);
    assert.ok(Math.abs(outerAdjusted.circles[0].radius-1.05)<1e-8);
    assert.deepEqual(outerAdjusted.photos,initial.photos);
    await page.locator('#backBrightnessInput').evaluate(input=>{input.value='30';input.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.ok((await page.evaluate(()=>__concentricAudit())).cards.every(c=>Math.abs(c.brightness-.3)<1e-8));
    await page.evaluate(()=>__concentricSave());await page.reload({waitUntil:'networkidle'});await ready();
    const compactRestored=await page.evaluate(()=>__concentricAudit());
    assert.deepEqual(compactRestored.circles,outerAdjusted.circles);
    assert.deepEqual(compactRestored.projection,initial.projection);
    await slider('Radius',120);
    const innerAdjusted=await page.evaluate(()=>__concentricAudit());
    assert.ok(Math.abs(innerAdjusted.circles[0].radius-1.2)<1e-8);
    assert.ok(Math.abs(innerAdjusted.circles.at(-1).radius-2.85)<1e-8);
    assert.deepEqual(innerAdjusted.photos,initial.photos);
    await page.evaluate(()=>__concentricReset());await ready();
    assert.deepEqual((await page.evaluate(()=>__concentricAudit())).view,initial.view);
    await slider('Stagger',100);
    const shifted=await page.evaluate(()=>__concentricAudit());
    assert.deepEqual(shifted.photos,initial.photos);
    let changed=0;
    let slot=0;
    initial.circles.forEach((circle,ring)=>{
      for(let column=0;column<circle.count;column++,slot++){
        if(ring%2){assert.notDeepEqual(shifted.cards[slot].position,initial.cards[slot].position);changed++}
        else assert.deepEqual(shifted.cards[slot].position,initial.cards[slot].position);
      }
    });
    assert.equal(changed,31);
    // A real uploaded image must survive re-layout, mode changes, reload and reset.
    const buffer=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="red"/></svg>');
    await page.locator('#fileInput').setInputFiles({name:'concentric-upload.svg',mimeType:'image/svg+xml',buffer});
    await page.waitForFunction(()=>__concentricAudit().photos.some(p=>p?.name==='concentric-upload.svg'));
    await ready();
    const withPhoto=await page.evaluate(()=>__concentricAudit());
    await slider('Rings',4);await slider('RingGap',280);await slider('HeightStep',45);await ready();
    assert.deepEqual((await page.evaluate(()=>__concentricAudit())).photos,withPhoto.photos);
    await page.locator('#roomPreset').click();await page.locator('#concentricPreset').click();await ready();
    assert.deepEqual((await page.evaluate(()=>__concentricAudit())).photos,withPhoto.photos);
    assert.equal((await page.evaluate(()=>__concentricAudit())).heightStep,45);
    await page.evaluate(()=>__concentricSave());await page.reload({waitUntil:'networkidle'});await ready();
    const restored=await page.evaluate(()=>__concentricAudit());
    assert.equal(restored.rows,4);assert.equal(restored.stagger,100);assert.deepEqual(restored.photos,withPhoto.photos);
    assert.equal(restored.heightStep,45);
    await page.evaluate(()=>__concentricReset());await ready();
    assert.equal((await page.evaluate(()=>__concentricAudit())).stagger,0);
    assert.equal((await page.evaluate(()=>__concentricAudit())).heightStep,66);
    assert.deepEqual((await page.evaluate(()=>__concentricAudit())).photos,withPhoto.photos);
    await page.evaluate(()=>__concentricCount(96));await ready();
    assert.equal((await page.evaluate(()=>__concentricAudit())).count,96);
    await page.locator('#cardWidthInput').evaluate(input=>{input.value='600';input.dispatchEvent(new Event('input',{bubbles:true}))});
    await slider('Rings',8);await slider('HeightStep',600);await ready();
    await page.locator('#fovInput').evaluate(input=>{input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}))});
    await page.waitForTimeout(150);
    const clipping=await page.evaluate(()=>__concentricClipping());
    assert.ok(clipping.depths.every(z=>z>clipping.near&&z<clipping.far));
    await slider('Rings',1);await ready();
    assert.ok((await page.evaluate(()=>__concentricAudit())).cards.every(c=>c.position[2]===0));
    await page.evaluate(()=>__concentricReset());await ready();
    assert.deepEqual((await page.evaluate(()=>__concentricAudit())).view,initial.view);
    await slider('HeightStep',60);await ready();
    const downloadPromise=page.waitForEvent('download',{timeout:60000});
    await page.evaluate(()=>__concentricExport());const download=await downloadPromise;
    assert.equal(await download.failure(),null);
    const bytes=await fs.readFile(await download.path());
    const exported=await page.evaluate(async base64=>{
      const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,c.width,c.height).data;let visible=0,transparent=0;
      for(let i=3;i<pixels.length;i+=4){if(pixels[i])visible++;else transparent++}
      return {width:c.width,height:c.height,visible,transparent};
    },bytes.toString('base64'));
    assert.equal(exported.width,1024);assert.equal(exported.height,576);
    assert.ok(exported.visible>10000);assert.ok(exported.transparent>10000);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({defaultSlots:initial.count,circles:initial.circles.map(c=>c.count),shiftedSlots:changed,exported,errors}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
