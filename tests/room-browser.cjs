const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {mkdirSync}=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    mkdirSync('tmp',{recursive:true});
    await page.route('**/src/main.js*',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+`
        globalThis.__roomReady=()=>!isLoadingProject&&cards.length===state.count&&cards.every(c=>c?.mesh.visible);
        globalThis.__roomAudit=()=>({mode:state.mode,count:state.count,stagger:state.stagger,staggerHorizontal:state.staggerHorizontal,staggerVertical:state.staggerVertical,direction:state.staggerDirection,
          version:modeSettings.room.roomDefaultsVersion,photos:state.photos.map(projectPhotoRef),
          cards:cards.map(c=>({position:c.mesh.position.toArray(),vertices:Array.from(c.mesh.geometry.attributes.position.array),
            uv:Array.from(c.mesh.geometry.attributes.uv.array)}))});
        globalThis.__roomView=(angle)=>{state.rotation=angle;syncViewControls();updateTransforms();};
        globalThis.__setRoomCount=count=>setCount(count);
        globalThis.__saveRoom=()=>saveCurrentProject();
        globalThis.__exportRoom=()=>exportImage('png','2K');
      `});
    });
    await page.goto(process.env.WALL_URL||'http://localhost:5173/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>globalThis.__roomReady?.());
    await page.locator('#roomPreset').click();
    await page.waitForFunction(()=>__roomAudit().mode==='room'&&__roomReady());
    const slider=async value=>{await page.locator('#staggerInput').evaluate((input,value)=>{
      input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
    },String(value));await page.waitForTimeout(180)};
    await slider(32);const verticalStagger=await page.evaluate(()=>__roomAudit());
    assert.equal(verticalStagger.direction,'vertical');assert.equal(verticalStagger.stagger,32);assert.equal(verticalStagger.staggerVertical,32);
    await page.locator('[data-curved-stagger-direction="horizontal"]').click();
    const horizontalDefault=await page.evaluate(()=>__roomAudit());
    assert.equal(horizontalDefault.stagger,0);assert.equal(horizontalDefault.staggerVertical,32);
    await slider(68);await page.locator('[data-curved-stagger-direction="vertical"]').click();
    const verticalRestored=await page.evaluate(()=>__roomAudit());
    assert.equal(verticalRestored.stagger,32);assert.equal(verticalRestored.staggerHorizontal,68);
    await slider(0);const aligned=await page.evaluate(()=>__roomAudit());
    assert.equal(aligned.count,60);assert.equal(aligned.direction,'vertical');
    await page.evaluate(()=>__setRoomCount(72));await page.waitForFunction(()=>__roomReady()&&__roomAudit().count===72);
    const expanded=await page.evaluate(()=>__roomAudit());
    assert.equal(expanded.count,72);assert.equal(expanded.cards.length,72);
    const expandedUi=await page.evaluate(()=>({rows:document.querySelector('#rowCountOutput')?.textContent,columns:document.querySelector('#columnCountOutput')?.textContent}));
    assert.equal(expandedUi.rows,'6');assert.equal(expandedUi.columns,'12');
    assert.ok(expanded.cards.every(card=>card.vertices.every(Number.isFinite)));
    await page.locator('#sceneFrame').screenshot({path:'tmp/room-72.png'});
    await page.evaluate(()=>__setRoomCount(60));await page.waitForFunction(()=>__roomReady()&&__roomAudit().count===60);
    await page.locator('#sceneFrame').screenshot({path:'tmp/room-aligned.png'});
    await slider(100);const shifted=await page.evaluate(()=>__roomAudit());
    assert.deepEqual(shifted.photos,aligned.photos);
    let folded=0;
    for(let i=0;i<60;i++){
      const before=aligned.cards[i],after=shifted.cards[i];
      if(Math.floor(i/12)%2===0)assert.deepEqual(after,before);
      else{
        assert.notDeepEqual(after,before);
        assert.equal(after.position[2],before.position[2]);
        if(after.vertices.length===18)folded++;
      }
    }
    assert.equal(folded,8);
    await page.locator('#sceneFrame').screenshot({path:'tmp/room-alternating.png'});
    await page.evaluate(()=>__roomView(22));await page.waitForTimeout(180);
    await page.locator('#sceneFrame').screenshot({path:'tmp/room-oblique.png'});
    await page.evaluate(()=>__roomView(0));await page.waitForTimeout(180);
    const downloadPromise=page.waitForEvent('download',{timeout:60000});
    await page.evaluate(()=>__exportRoom());const download=await downloadPromise;
    assert.equal(await download.failure(),null);
    const bytes=await fs.readFile(await download.path());
    const exported=await page.evaluate(async base64=>{
      const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let visible=0,transparent=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i])visible++;else transparent++}
      return {width:img.width,height:img.height,cornerAlpha:pixels[3],visible,transparent};
    },bytes.toString('base64'));
    assert.equal(exported.width,1920);assert.equal(exported.height,1080);
    assert.ok(exported.transparent>1000);assert.ok(exported.visible>100000);
    await page.locator('[data-curved-stagger-direction="horizontal"]').click();
    const horizontal=await page.evaluate(()=>__roomAudit());
    assert.deepEqual(horizontal.photos,aligned.photos);
    for(let i=0;i<60;i++){
      assert.deepEqual(horizontal.cards[i].position.slice(0,2),aligned.cards[i].position.slice(0,2));
      if(i%2)assert.ok(horizontal.cards[i].position[2]>aligned.cards[i].position[2]);
    }
    await page.locator('[data-curved-stagger-direction="vertical"]').click();await slider(65);
    await page.evaluate(()=>__saveRoom());await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>globalThis.__roomReady?.());
    const restored=await page.evaluate(()=>__roomAudit());
    assert.equal(restored.mode,'room');assert.equal(restored.stagger,65);assert.equal(restored.version,5);
    assert.deepEqual(restored.photos,aligned.photos);assert.deepEqual(errors,[]);
    console.log(JSON.stringify({count:shifted.count,foldedSlots:folded,unchangedRings:[1,3,5],shiftedRings:[2,4],exported,persistedStagger:restored.stagger,errors}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
