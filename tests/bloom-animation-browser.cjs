const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/src/main.js*',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+`\n        globalThis.__bloomAudit=()=>({mode:state.mode,playing:bloomAnimation.playing,angle:bloomAnimation.angle,rotation:state.contentRotation,quaternion:wallGroup.quaternion.toArray()});\n      `});
    });
    await page.goto(process.env.WALL_URL||'http://localhost:5173/',{waitUntil:'networkidle'});
    await page.locator('#bloomPreset').click();
    await page.waitForFunction(()=>__bloomAudit?.().mode==='bloom');
    await page.locator('#animationToggleButton').click();
    assert.equal(await page.locator('#animationToggleButton').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('body').evaluate(body=>body.classList.contains('animation-anchors-visible')),true);
    await page.locator('#exportButton').click();
    await page.locator('[data-export-format="webm"]').click();
    assert.equal(await page.locator('#bloomAnimationPlayButton').textContent(),'播放旋转');
    const before=await page.evaluate(()=>__bloomAudit());
    await page.locator('#bloomAnimationPlayButton').click();
    await page.waitForFunction(()=>__bloomAudit().rotation!==0,{timeout:3000});
    const moving=await page.evaluate(()=>__bloomAudit());
    assert.equal(moving.playing,true);assert.notEqual(moving.angle,before.angle);assert.notEqual(moving.rotation,before.rotation);
    await page.locator('#bloomAnimationPlayButton').click();
    const paused=await page.evaluate(()=>__bloomAudit());
    await page.waitForTimeout(180);
    const still=await page.evaluate(()=>__bloomAudit());
    assert.equal(still.playing,false);assert.equal(still.angle,paused.angle);
    await page.locator('[data-export-cancel]').click();
    await page.locator('#ringPreset').click();
    await page.waitForFunction(()=>__bloomAudit().mode==='ring');
    assert.equal(await page.locator('#animationToggleButton').getAttribute('aria-expanded'),'true');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({beforeAngle:before.angle,movingAngle:moving.angle,pausedAngle:paused.angle,beforeRotation:before.rotation,movingRotation:moving.rotation,errors}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
