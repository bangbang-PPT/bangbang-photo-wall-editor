// Run against the Vite preview; set PLAYWRIGHT_MODULE if Playwright is bundled elsewhere.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/src/main.js*',async route=>{
      const response=await route.fetch();
      await route.fulfill({response,body:await response.text()+`
        globalThis.__exportForTest=(format,resolution)=>exportImage(format,resolution);
        globalThis.__previewForTest=()=>({image:renderer.domElement.toDataURL('image/png'),
          camera:camera.projectionMatrix.elements.slice(),position:camera.position.toArray(),
          quaternion:camera.quaternion.toArray(),target:cameraTarget.toArray()});
      `});
    });
    await page.goto(process.env.WALL_URL||'http://localhost:5173/',{waitUntil:'domcontentloaded'});
    await page.locator('#curvedPreset').click();
    await page.locator('.ratio-button[data-ratio="3:4"]').click();
    await page.locator('#viewZoomInput').evaluate(input=>{input.value='180';input.dispatchEvent(new Event('input',{bubbles:true}))});
    const box=await page.locator('#renderHost canvas').boundingBox();
    await page.keyboard.down('Alt');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width/2+55,box.y+box.height/2-35,{steps:5});
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await page.waitForTimeout(150);
    const preview=await page.evaluate(()=>__previewForTest());
    assert.notDeepEqual(preview.target,[0,0,0]);
    for(const [format,resolution,width,height] of [['png','2K',1440,1920],['jpeg','2K',1440,1920],['png','4K',2880,3840]]){
      const downloadPromise=page.waitForEvent('download',{timeout:90000});
      await page.evaluate(([f,r])=>__exportForTest(f,r),[format,resolution]);
      const download=await downloadPromise;
      assert.equal(await download.failure(),null);
      const bytes=await fs.readFile(await download.path());
      const result=await page.evaluate(async({previewData,exportData,mime})=>{
        const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src});
        const original=await load(previewData),output=await load(`data:${mime};base64,${exportData}`);
        const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
        const context=canvas.getContext('2d',{willReadFrequently:true});
        context.drawImage(original,0,0);const expected=context.getImageData(0,0,canvas.width,canvas.height).data;
        context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(output,0,0,canvas.width,canvas.height);
        const corner=[...context.getImageData(0,0,1,1).data];
        if(mime==='image/png'){
          context.globalCompositeOperation='destination-over';context.fillStyle='#101014';
          context.fillRect(0,0,canvas.width,canvas.height);context.globalCompositeOperation='source-over';
        }
        const actual=context.getImageData(0,0,canvas.width,canvas.height).data;
        let difference=0;
        for(let i=0;i<expected.length;i+=4)for(let c=0;c<3;c++)difference+=Math.abs(expected[i+c]-actual[i+c]);
        return {width:output.width,height:output.height,meanDifference:difference/(expected.length/4*3),corner};
      },{previewData:preview.image,exportData:bytes.toString('base64'),mime:format==='png'?'image/png':'image/jpeg'});
      assert.equal(result.width,width);assert.equal(result.height,height);
      assert.ok(result.meanDifference<6,`${format} ${resolution} changed the canvas framing: ${result.meanDifference}`);
      if(format==='png')assert.equal(result.corner[3],0);
      const after=await page.evaluate(()=>__previewForTest());
      for(const key of ['camera','position','quaternion','target'])assert.deepEqual(after[key],preview[key]);
      console.log(`${format.toUpperCase()} ${resolution}: ${width}x${height}, mean pixel difference ${result.meanDifference.toFixed(2)}/255`);
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
