import * as THREE from 'three';
import { ringCardPose, bloomCardPose, curvedCardPose, gridCardPose, CARD_WIDTH, CARD_HEIGHT, DESIGN_SCALE } from './ring-layout.js';
import './style.css';

const DEFAULT_WALL_TILT = -55;
const DEFAULT_CARD_WIDTH = CARD_WIDTH * DESIGN_SCALE;
const DEFAULT_CARD_HEIGHT = CARD_HEIGHT * DESIGN_SCALE;
const WORLD_X_AXIS = new THREE.Vector3(1,0,0);
const WORLD_Y_AXIS = new THREE.Vector3(0,1,0);
const WORLD_Z_AXIS = new THREE.Vector3(0,0,1);
const worldTiltQuaternion=new THREE.Quaternion();
// Keep the default model heading neutral. Any horizontal viewing offset is
// controlled explicitly by the camera's "观察方位" value or canvas drag.
const WALL_ROTATION = 0;
const RESET_ICON_PATH = 'M632 14.464a32 32 0 0 1 43.328 13.12l26.368 49.28c7.872 14.72 15.04 28.096 19.264 38.656 2.24 5.44 4.672 12.544 5.376 20.16a40.96 40.96 0 0 1-8.896 30.336 41.216 41.216 0 0 1-28.672 14.4 77.76 77.76 0 0 1-21.056-1.536 515.008 515.008 0 0 1-44.416-11.904L621.632 166.4A384.64 384.64 0 0 0 512 150.656C304.896 150.656 138.688 313.344 138.688 512a350.72 350.72 0 0 0 49.664 180.288 32 32 0 1 1-54.976 32.768 414.72 414.72 0 0 1-58.688-213.12C74.688 276.224 271.36 86.72 512 86.72a448.704 448.704 0 0 1 133.056 20.032l-0.64-1.28L618.88 57.792a32 32 0 0 1 13.12-43.264z m214.72 273.344a32 32 0 0 1 43.84 11.136A414.72 414.72 0 0 1 949.312 512c0 235.776-196.672 425.344-437.312 425.344-44.416 0-87.36-6.464-127.872-18.496l-5.184-1.536 0.64 1.28 25.536 47.616a32 32 0 1 1-56.448 30.208l-26.368-49.28c-7.872-14.72-15.04-28.16-19.328-38.656a72.384 72.384 0 0 1-5.312-20.16 41.024 41.024 0 0 1 8.896-30.336 41.216 41.216 0 0 1 28.672-14.464c7.552-0.64 15.04 0.384 21.056 1.536 11.712 2.24 27.072 6.784 44.416 11.968l1.664 0.512c34.56 10.24 71.424 15.808 109.632 15.808 207.104 0 373.312-162.688 373.312-361.344a350.72 350.72 0 0 0-49.664-180.288 32 32 0 0 1 11.072-43.904z';
const TILT_GIZMO_ICON_PATH = 'M512 121.1392a42.8032 42.8032 0 0 1 31.744 14.1824l165.2224 183.7056a42.752 42.752 0 0 1-63.5392 57.1904l-90.7264-100.9664v187.2384l408.9344 192.3072a42.752 42.752 0 0 1 0 77.312l-433.408 203.776a42.752 42.752 0 0 1-36.4544 0l-433.408-203.776a42.7008 42.7008 0 0 1 0-77.312l408.9344-192.3072V275.2512L378.5728 376.2176a42.8032 42.8032 0 0 1-66.2016-53.9648l2.6624-3.2768L480.256 135.3216l3.1744-3.1744a42.7008 42.7008 0 0 1 21.76-10.24v-0.768H512zM178.8928 693.4528L512 850.0224l333.056-156.5696-290.304-136.6016v129.1264a42.752 42.752 0 0 1-85.504 0v-129.1264l-290.304 136.6016z';
const EFFECT_RESET_ICON_PATH = 'M958.72 225.856l-82.688 211.136-13.76 35.2c-3.776 9.728-14.784 14.528-24.512 10.688l-35.2-13.76L591.36 386.368C581.632 382.528 576.832 371.584 580.672 361.856l13.76-35.2c3.776-9.728 14.784-14.528 24.512-10.688l174.912 68.544c-50.56-124.416-171.584-212.672-314.112-212.672-187.84 0-340.16 152.32-340.16 340.16s152.256 340.16 340.16 340.16c148.032 0 273.6-94.72 320.384-226.752l79.296 0c-49.408 174.4-209.408 302.336-399.68 302.336C250.112 927.744 64 741.632 64 512s186.112-415.744 415.744-415.744c157.056 0 293.376 87.296 363.968 215.872l44.608-113.856c3.776-9.728 14.784-14.528 24.512-10.688l35.2 13.76C957.696 205.184 962.496 216.128 958.72 225.856z';
const PREVIEW_QUALITY_KEY = 'photo-wall-preview-quality-v1';
// Standard keeps uploaded images light enough for smooth dragging while
// staying large enough for the canvas preview. Original keeps the stored blob.
const PREVIEW_QUALITY_LEVELS = {standard:{label:'标准',maxDimension:400},original:{label:'原图',maxDimension:null}};
let previewQuality = (()=>{try{const value=localStorage.getItem(PREVIEW_QUALITY_KEY);return PREVIEW_QUALITY_LEVELS[value]?value:'standard'}catch{return 'standard'}})();

const ratios = [
  ['16:9', 1920, 1080], ['4:3', 1440, 1080], ['1:1', 1080, 1080],
  ['4:5', 1080, 1350], ['3:4', 1080, 1440], ['9:16', 1080, 1920],
];
const RESOLUTION_PRESETS={'1K':1024,'2K':1920,'4K':3840};
const DEFAULT_RESOLUTION_PRESET='2K';
const RATIO_MIN=1;
const RATIO_MAX=100;
const state = {
  mode: 'ring', width: 1920, height: 1080, cardWidth: DEFAULT_CARD_WIDTH, cardHeight: DEFAULT_CARD_HEIGHT, count: 12, ringCount: 12, rows: 3, columns: 10, radius: 4.2, spacing: 36, rowGap: 28, columnGap: 28, stagger: 50, curveBend: -120, corner: 20, contentRotation: 0, backBrightness: 30, wallTilt: DEFAULT_WALL_TILT, tilt: 0, rotation: 50, fov: 18, viewOffsetX: 0, viewOffsetY: 0,
  selected: 0, zoom: 130, photos: [], projectId: null, projectName: '默认项目', resolutionPreset: DEFAULT_RESOLUTION_PRESET, ratioWidth: 16, ratioHeight: 9, staggerDirection: 'horizontal', tiltAxis: 'x', tiltX: 0, tiltY: 0, tiltZ: 0, cameraAxis: 'x', gridStagger: 0, gridStaggerDirection: 'horizontal', gridTiltZ: 0, photoOpacity: 100,
};

const CURVED_MODES = ['curved','curvedHorizontal'];
const RING_MODES = ['ring','bloom'];
const PHOTO_MODES = ['ring','bloom','curved','curvedHorizontal','grid'];
const DEFAULT_PHOTO_COUNTS = {ring:12,bloom:12,curved:24,curvedHorizontal:24,grid:24};
const PHOTO_SETS_VERSION = 4;
const isCurvedMode = (mode=state.mode) => CURVED_MODES.includes(mode);
const isGridMode = (mode=state.mode) => mode==='grid';
const isRingMode = (mode=state.mode) => RING_MODES.includes(mode);
const MODE_SETTING_KEYS = ['ringCount','rows','columns','radius','spacing','rowGap','columnGap','spacingMode','stagger','staggerDirection','curveBend','corner','contentRotation','backBrightness','photoOpacity','wallTilt','tiltAxis','tiltX','tiltY','tiltZ','tilt','rotation','cameraAxis','fov','zoom','viewOffsetX','viewOffsetY','gridStagger','gridStaggerDirection','gridTiltZ'];
const MODE_SETTINGS_VERSION=24;
function createModeSettings(mode){
  if(isGridMode(mode))return {
    ringCount:24,rows:4,columns:6,radius:4.2,spacing:36,rowGap:39,columnGap:39,spacingMode:'all',stagger:0,staggerDirection:'horizontal',curveBend:0,
    gridStagger:50,gridStaggerDirection:'vertical',gridTiltZ:20,
    corner:31,contentRotation:0,backBrightness:30,photoOpacity:100,wallTilt:20,tiltAxis:'z',tiltX:0,tiltY:0,tiltZ:20,tilt:0,rotation:0,cameraAxis:'x',fov:38,zoom:290,viewOffsetX:0,viewOffsetY:0,cameraTarget:[0,0,0],
  };
  if(isCurvedMode(mode)){
    const settings={
    ringCount:12,rows:3,columns:10,radius:4.2,spacing:36,rowGap:28,columnGap:28,spacingMode:'all',stagger:50,staggerDirection:'horizontal',curveBend:-120,
    corner:20,contentRotation:0,backBrightness:30,photoOpacity:100,wallTilt:0,tiltAxis:'x',tiltX:0,tiltY:0,tiltZ:0,tilt:0,rotation:0,cameraAxis:'x',fov:38,zoom:100,viewOffsetX:0,viewOffsetY:0,cameraTarget:[0,0,0],
    };
    if(mode==='curvedHorizontal'){
      // Match the requested default: three rows of eight cards with the
      // same spacing, stagger and camera framing as the reference panel.
      settings.columns=8;
      settings.curveBend=-154;
      settings.rotation=0;
      settings.tilt=0;
      settings.fov=38;
      settings.zoom=140;
    }
    return settings;
  }
  if(mode==='bloom')return {
    ringCount:12,rows:3,columns:10,radius:3,spacing:0,rowGap:28,columnGap:28,spacingMode:'all',stagger:0,staggerDirection:'horizontal',curveBend:0,
    corner:20,contentRotation:0,backBrightness:30,photoOpacity:100,wallTilt:16,tiltAxis:'y',tiltX:20,tiltY:16,tiltZ:0,tilt:17,rotation:50,cameraAxis:'x',fov:38,zoom:130,viewOffsetX:0,viewOffsetY:-62,cameraTarget:[0,-0.62,0],
  };
  const settings={
    ringCount:12,rows:3,columns:10,radius:4.2,spacing:36,rowGap:28,columnGap:28,spacingMode:'all',stagger:50,staggerDirection:'horizontal',curveBend:-120,
    corner:20,contentRotation:0,backBrightness:30,photoOpacity:100,wallTilt:DEFAULT_WALL_TILT,tiltAxis:'x',tiltX:DEFAULT_WALL_TILT,tiltY:0,tiltZ:0,tilt:0,rotation:50,cameraAxis:'x',fov:18,zoom:130,viewOffsetX:0,viewOffsetY:0,spacingMode:'all',cameraTarget:[0,0,0],
  };
  return settings;
}
const modeSettings={ring:createModeSettings('ring'),bloom:createModeSettings('bloom'),curved:createModeSettings('curved'),curvedHorizontal:createModeSettings('curvedHorizontal'),grid:createModeSettings('grid')};

function samplePhoto(index) {
  return `/photos/sample-${String(index % 12 + 1).padStart(2,'0')}.jpg`;
}
state.photos = Array.from({length:state.count}, (_,i)=>({src:samplePhoto(i),name:`示例照片 ${String(i+1).padStart(2,'0')}`,sample:true}));
state.photosByMode = {
  ring:state.photos.map(photo=>({...photo})),
  bloom:sampleProjectPhotos(DEFAULT_PHOTO_COUNTS.bloom),
  curved:sampleProjectPhotos(DEFAULT_PHOTO_COUNTS.curved),
  curvedHorizontal:sampleProjectPhotos(DEFAULT_PHOTO_COUNTS.curvedHorizontal),
  grid:sampleProjectPhotos(DEFAULT_PHOTO_COUNTS.grid),
};

function saveActivePhotoSet(mode=state.mode){
  state.photosByMode[mode]=state.photos;
}
function loadPhotoSet(mode, fallbackCount=DEFAULT_PHOTO_COUNTS[mode]||12){
  const existing=Array.isArray(state.photosByMode?.[mode])?state.photosByMode[mode]:[];
  const count=Math.max(3,Math.min(72,existing.length||fallbackCount||12));
  state.photos=existing.length?existing:sampleProjectPhotos(count);
  state.photosByMode[mode]=state.photos;
  state.count=state.photos.length;
  state.selected=Math.min(state.selected,state.count-1);
}

const app = document.querySelector('#app');
app.innerHTML = `
<header class="topbar">
  <a class="brand" href="#"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><span>图片墙</span></a>
  <span class="top-divider"></span><button class="top-button" id="projectButton"><span class="folder-icon" aria-hidden="true"><svg viewBox="0 0 181.67 164.91"><path d="M25,164.91A13.33,13.33,0,0,1,11.8,153.34L0,62.48a5.13,5.13,0,0,1,4.44-5.73,4.73,4.73,0,0,1,.65,0H20.41V13.29A13.3,13.3,0,0,1,33.69,0h25.2a13.32,13.32,0,0,1,10,4.57l14.73,17a3,3,0,0,0,2.29,1h62A13.3,13.3,0,0,1,161.26,35.9V56.71h15.29a5.14,5.14,0,0,1,5.08,5.78l-11.76,90.86a13.33,13.33,0,0,1-13.16,11.56H25Zm-3-12.9a3,3,0,0,0,2.54,2.6l.4,0H156.71a3.06,3.06,0,0,0,3-2.64l11-85.07H10.94ZM33.69,10.23a3,3,0,0,0-3,3V56.69H151V35.89a3.05,3.05,0,0,0-2.49-3l-.49-.06H86a13.28,13.28,0,0,1-10-4.57l-14.74-17a3,3,0,0,0-2.27-1.06Z" fill="currentColor"></path></svg></span>项目</button><span class="top-divider small"></span>
  <div class="project-menu" id="projectMenu" aria-hidden="true">
    <div class="project-menu-heading"><b>项目</b><button id="closeProjectMenu" type="button" aria-label="关闭">×</button></div>
    <div class="project-create"><input id="projectNameInput" type="text" maxlength="32" placeholder="新项目名称"><button id="createProjectButton" type="button">新建</button></div>
    <div class="project-list" id="projectList"></div>
  </div>
  <button class="icon-button" id="undoButton" title="撤销" disabled>↶</button><button class="icon-button" id="redoButton" title="重做" disabled>↷</button>
  <div class="project-name" id="projectName">环绕弯曲 <span class="saved-dot"></span></div>
  <button class="icon-button theme-button" id="themeButton" title="切换主题">☼</button>
  <div class="export-control" id="exportControl"><button class="primary-button export-trigger" id="exportButton" title="导出" aria-haspopup="listbox" aria-expanded="false"><svg class="export-icon" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M544.256 605.184l244.224-244.224a31.744 31.744 0 0 1 45.056 45.056l-295.424 295.424a36.864 36.864 0 0 1-51.2 0L190.464 406.528a31.744 31.744 0 1 1 45.056-45.056l244.224 244.224V111.104a32.256 32.256 0 1 1 64 0zM153.6 902.656a32.256 32.256 0 0 1 0-64h716.8a32.256 32.256 0 0 1 0 64z" fill="currentColor"></path></svg><span class="export-label">导出</span><i class="export-arrow" aria-hidden="true"></i></button><div class="export-menu" id="exportMenu" role="listbox" aria-label="导出格式"><button type="button" role="option" data-export-format="png"><b>PNG</b></button><button type="button" role="option" data-export-format="jpeg"><b>JPEG</b></button></div></div>
</header>
<main class="workspace">
  <aside class="preset-rail">
    <div class="rail-heading">3D透视 <span class="rail-count">04</span></div>
    <div class="preset-grid">
      <button class="preset-card selected" id="ringPreset"><span class="preset-art" data-preview-mode="ring"></span><span class="preset-title">环绕弯曲</span></button>
      <button class="preset-card" id="bloomPreset"><span class="preset-art" data-preview-mode="bloom"></span><span class="preset-title">环形绽放</span></button>
      <button class="preset-card" id="curvedPreset"><span class="preset-art" data-preview-mode="curved"></span><span class="preset-title">上下弧形墙</span></button>
      <button class="preset-card" id="curvedHorizontalPreset"><span class="preset-art" data-preview-mode="curvedHorizontal"></span><span class="preset-title">左右弧形墙</span></button>
    </div>
    <div class="rail-heading grid-rail-heading">网格 <span class="rail-count">01</span></div>
    <div class="preset-grid">
      <button class="preset-card" id="gridPreset"><span class="preset-art grid-art horizontal-art" data-preview-mode="grid"></span><span class="preset-title">网格墙</span></button>
    </div>
  </aside>
  <section class="stage-column">
    <div class="stage" id="stage">
      <div class="stage-center" id="stageCenter"><div class="scene-frame" id="sceneFrame"><div id="renderHost"></div><svg class="tilt-gizmo" id="tiltGizmo" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true"><line class="tilt-gizmo-axis" data-gizmo-axis="x" x1="500" y1="350" x2="680" y2="350"></line><line class="tilt-gizmo-axis" data-gizmo-axis="y" x1="500" y1="350" x2="500" y2="170"></line><line class="tilt-gizmo-axis" data-gizmo-axis="z" x1="500" y1="350" x2="400" y2="450"></line><text data-gizmo-label="x" x="692" y="350">X</text><text data-gizmo-label="y" x="500" y="155">Y</text><text data-gizmo-label="z" x="386" y="464">Z</text></svg><button class="tilt-gizmo-reset" id="tiltGizmoReset" type="button" aria-label="重置当前效果" title="重置当前效果"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="${EFFECT_RESET_ICON_PATH}" fill="currentColor"></path></svg></button><button class="tilt-gizmo-toggle" id="tiltGizmoToggle" type="button" aria-label="显示三轴辅助线" aria-pressed="false" title="显示三轴辅助线"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="${TILT_GIZMO_ICON_PATH}" fill="currentColor"></path></svg></button></div><div class="stage-label"><span class="live-dot"></span>实时预览</div></div>
      <div class="canvas-drop-hint">松开鼠标，将图片添加到照片墙</div>
      <div class="stage-actions"><div class="preview-quality-control" id="previewQualityControl"><button class="preview-quality-trigger" id="previewQualityTrigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="预览精度"><span id="previewQualityLabel">标准</span><i class="preview-quality-arrow" aria-hidden="true"></i></button><div class="preview-quality-menu" id="previewQualityMenu" role="listbox" aria-label="预览精度选项"><button type="button" role="option" data-preview-quality="standard" aria-selected="true">标准</button><button type="button" role="option" data-preview-quality="original">原图</button></div></div><span class="stage-separator"></span><button id="fitButton">适合画布</button><span class="stage-separator"></span><button id="zoomOutButton">−</button><span id="zoomLabel">130%</span><button id="zoomInButton">＋</button></div>
    </div>
    <footer class="preview-bar"><span class="preview-tip" id="previewTip"><kbd>左键拖动</kbd> 360度查看 · <kbd>Alt + 左键</kbd> 平移视角 · <kbd>滚轮</kbd> 缩放照片 <span>·</span> <kbd>双击</kbd> 选中并替换</span><span class="preview-resolution" id="resolutionLabel">1920 × 1080 px</span></footer>
  </section>
  <aside class="inspector">
    <section class="inspector-section">
      <div class="ratio-grid" id="ratioGrid"></div>
      <div class="custom-size"><div class="custom-size-heading"><label>自定义比例</label><div class="ratio-input-row"><div class="ratio-slot"><input id="ratioWidthInput" type="number" min="1" max="100" step="0.1" value="16" aria-label="比例宽"></div><span class="ratio-separator">:</span><div class="ratio-slot"><input id="ratioHeightInput" type="number" min="1" max="100" step="0.1" value="9" aria-label="比例高"></div><div class="resolution-preset-control" id="resolutionPresetControl"><button class="resolution-preset-trigger" id="resolutionPresetTrigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="基准分辨率"><span id="resolutionPresetLabel">2K</span><i class="preview-quality-arrow" aria-hidden="true"></i></button><div class="resolution-preset-menu" id="resolutionPresetMenu" role="listbox" aria-label="基准分辨率选项"><button type="button" role="option" data-resolution-preset="1K">1K</button><button type="button" role="option" data-resolution-preset="2K" aria-selected="true">2K</button><button type="button" role="option" data-resolution-preset="4K">4K</button></div></div></div></div></div>
      <div class="background-row"><span>背景颜色</span><label class="color-control"><input type="color" id="bgColorInput" value="#101014"><span class="color-swatch"></span><span class="color-code">#101014</span></label></div>
    </section>
    <section class="inspector-section media-section">
      <div class="section-heading"><h2>图片 <span class="muted-dot">·</span> <span id="slotCountLabel">12 个槽位</span></h2></div>
      <div class="media-toolbar"><span>槽位数量</span><div class="stepper"><button id="slotMinus">−</button><output id="slotCountOutput">12</output><button id="slotPlus">＋</button></div></div>
      <div class="upload-row"><button class="upload-button" id="uploadButton"><span class="upload-icon">↑</span><span><b>读取本地图片</b><small>支持多选 · JPG、PNG、WebP</small></span></button><button class="folder-upload clear-images-button" id="clearImagesButton" title="清空所有图片" aria-label="清空所有图片"><svg class="trash-icon" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M227.555556 312.888889m17.066666 0l534.755556 0q17.066667 0 17.066666 17.066667l0 0q0 17.066667-17.066666 17.066666l-534.755556 0q-17.066667 0-17.066666-17.066666l0 0q0-17.066667 17.066666-17.066667Z" fill="currentColor"></path><path d="M420.977778 233.244444m17.066666 0l147.911112 0q17.066667 0 17.066666 17.066667l0 0q0 17.066667-17.066666 17.066667l-147.911112 0q-17.066667 0-17.066666-17.066667l0 0q0-17.066667 17.066666-17.066667Z" fill="currentColor"></path><path d="M472.177778 455.111111m0 17.066667l0 142.222222q0 17.066667-17.066667 17.066667l0 0q-17.066667 0-17.066667-17.066667l0-142.222222q0-17.066667 17.066667-17.066667l0 0q17.066667 0 17.066667 17.066667Z" fill="currentColor"></path><path d="M585.955556 455.111111m0 17.066667l0 142.222222q0 17.066667-17.066667 17.066667l0 0q-17.066667 0-17.066667-17.066667l0-142.222222q0-17.066667 17.066667-17.066667l0 0q17.066667 0 17.066667 17.066667Z" fill="currentColor"></path><path d="M318.577778 335.644444v328.533334c0 49.737956 49.533156 91.517156 112.389689 92.427378l2.0992 0.017066h157.866666c63.146667 0 113.379556-41.233067 114.471823-90.794666l0.017066-1.649778V335.644444h34.133334v328.533334c0 69.961956-65.820444 125.457067-146.181689 126.560711l-2.440534 0.017067h-157.866666c-80.645689 0-147.279644-54.795378-148.599467-124.461512L284.444444 664.177778V335.644444h34.133334z" fill="currentColor"></path></svg></button><input type="file" id="fileInput" accept="image/*" multiple hidden></div>
      <div class="slots-wrap" id="slotsWrap">
        <div class="photo-adjust-panel popup" id="photoAdjustPanel">
          <div class="photo-adjust-heading"><span>图片调整</span><small id="selectedPhotoLabel">槽位 1</small><button id="resetPhotoAdjust" type="button">重置</button><button id="closePhotoAdjust" type="button" title="关闭">×</button></div>
          <label class="range-control"><span>图片缩放 <output id="photoScaleOutput">100%</output></span><input id="photoScaleInput" type="range" min="100" max="300" step="1" data-wheel-step="10" value="100"></label>
          <label class="range-control"><span>水平位置 <output id="photoOffsetXOutput">0%</output></span><input id="photoOffsetXInput" type="range" min="-300" max="300" step="1" data-wheel-step="10" value="0"></label>
          <label class="range-control"><span>垂直位置 <output id="photoOffsetYOutput">0%</output></span><input id="photoOffsetYInput" type="range" min="-300" max="300" step="1" data-wheel-step="10" value="0"></label>
        </div>
        <div class="slots-list" id="slotsList"></div>
      </div>
      <div class="media-note">ⓘ 本地图片保存在当前浏览器，不会上传</div>
    </section>
    <section class="inspector-section settings-section">
      <div class="section-heading"><h2 id="settingsTitle">设置</h2><button class="reset-button" id="resetButton">重置</button></div>
      <div class="card-size-controls">
        <label class="range-control"><span>图片宽度 <output id="cardWidthOutput">188 px</output></span><input id="cardWidthInput" type="range" min="40" max="600" step="1" data-wheel-step="10" value="188"></label>
        <label class="range-control"><span>图片高度 <output id="cardHeightOutput">240 px</output></span><input id="cardHeightInput" type="range" min="40" max="800" step="1" data-wheel-step="10" value="240"></label>
      </div>
      <div id="ringLayoutSettings">
        <label class="range-control"><span>环形半径 <output id="radiusOutput"></output></span><input id="radiusInput" type="range" min="100" max="900" step=".1" data-wheel-step="10" value="420"></label>
        <label class="range-control" id="ringSpacingControl"><span>图片间距 <output id="spacingOutput">36 px</output></span><input id="spacingInput" type="range" min="0" max="300" step=".1" data-wheel-step="5" value="36"></label>
      </div>
      <div id="curvedLayoutSettings" class="mode-hidden">
        <label class="range-control"><span>行数 <output id="rowCountOutput">3</output></span><input id="rowCountInput" type="range" min="1" max="8" step="1" data-wheel-step="1" value="3"></label>
        <label class="range-control"><span>每行数量 <output id="columnCountOutput">10</output></span><input id="columnCountInput" type="range" min="3" max="14" step="1" data-wheel-step="1" value="10"></label>
        <div class="grid-choice-control curved-spacing-mode"><span>间距方式</span><div class="grid-choice" role="group" aria-label="间距方式"><button type="button" data-curved-spacing-mode="all" aria-pressed="true">间距</button><button type="button" data-curved-spacing-mode="column" aria-pressed="false">列间距</button><button type="button" data-curved-spacing-mode="row" aria-pressed="false">行间距</button></div></div>
        <label class="range-control"><span id="curvedSpacingLabel">间距 <output id="curvedSpacingOutput">28 px</output></span><input id="curvedSpacingInput" type="range" min="0" max="160" step="1" data-wheel-step="1" value="28"></label>
        <div class="grid-choice-control curved-stagger-direction"><span>错位方向</span><div class="grid-choice" role="group" aria-label="错位方向"><button type="button" data-curved-stagger-direction="horizontal" aria-pressed="true">横向</button><button type="button" data-curved-stagger-direction="vertical" aria-pressed="false">竖向</button></div></div>
        <label class="range-control" title="控制相邻行或列的错位程度；接近 0% 时自动吸附到边缘对齐"><span>错位程度 <output id="staggerOutput">50%</output></span><input id="staggerInput" type="range" min="0" max="100" step="1" data-wheel-step="5" value="50"></label>
        <label class="range-control angle-toggle" id="curveBendControl" title="正值向前凸，负值向后凹；右键循环切换角度档位"><span>整体弯曲 <output id="curveBendOutput">-120°</output></span><input id="curveBendInput" type="range" min="-180" max="180" step="1" data-wheel-step="10" value="-120"></label>
      </div>
      <div id="gridLayoutSettings" class="mode-hidden">
        <label class="range-control"><span>行数 <output id="gridRowCountOutput">4</output></span><input id="gridRowCountInput" type="range" min="1" max="8" step="1" data-wheel-step="1" value="4"></label>
        <label class="range-control"><span>每行数量 <output id="gridColumnCountOutput">6</output></span><input id="gridColumnCountInput" type="range" min="3" max="14" step="1" data-wheel-step="1" value="6"></label>
        <div class="grid-choice-control grid-spacing-mode"><span>间距方式</span><div class="grid-choice" role="group" aria-label="网格间距方式"><button type="button" data-grid-spacing-mode="all" aria-pressed="true">间距</button><button type="button" data-grid-spacing-mode="column" aria-pressed="false">列间距</button><button type="button" data-grid-spacing-mode="row" aria-pressed="false">行间距</button></div></div>
        <label class="range-control"><span id="gridSpacingLabel">间距 <output id="gridGapOutput">39 px</output></span><input id="gridGapInput" type="range" min="0" max="160" step="1" data-wheel-step="1" value="39"></label>
        <div class="grid-choice-control"><span>错位方向</span><div class="grid-choice" role="group" aria-label="错位方向"><button type="button" data-grid-direction="horizontal" aria-pressed="true">横向</button><button type="button" data-grid-direction="vertical" aria-pressed="false">竖向</button></div></div>
        <label class="range-control"><span>错位程度 <output id="gridStaggerOutput">50%</output></span><input id="gridStaggerInput" type="range" min="0" max="50" step="1" data-wheel-step="5" value="50"></label>
      </div>
      <label class="range-control"><span>卡片圆角 <output id="cornerOutput">31 px</output></span><input id="cornerInput" type="range" min="0" max="94" step="1" data-wheel-step="1" value="31"></label>
      <label class="range-control angle-toggle" id="contentRotationControl" title="右键循环切换角度档位"><span>图片旋转 <output id="contentRotationOutput">0°</output></span><input id="contentRotationInput" type="range" min="0" max="360" step="1" data-wheel-step="10" value="0"></label>
      <label class="range-control"><span>反面亮度 <output id="backBrightnessOutput">30%</output></span><input id="backBrightnessInput" type="range" min="0" max="100" step="1" data-wheel-step="5" value="30"></label>
      <label class="range-control mode-hidden" id="photoOpacityControl"><span>图片透明度 <output id="photoOpacityOutput">100%</output></span><input id="photoOpacityInput" type="range" min="0" max="100" step="1" data-wheel-step="5" value="100"></label>
      <div class="grid-choice-control tilt-axis-control" id="tiltAxisControl"><span>倾斜轴</span><div class="grid-choice" role="group" aria-label="倾斜轴"><button type="button" data-tilt-axis="x" aria-pressed="false">X</button><button type="button" data-tilt-axis="y" aria-pressed="false">Y</button><button type="button" data-tilt-axis="z" aria-pressed="true">Z</button></div></div>
      <label class="range-control angle-toggle" id="wallTiltControl" title="右键循环切换角度档位"><span>整体倾斜 <output id="wallTiltOutput">20°</output></span><input id="wallTiltInput" type="range" min="-180" max="180" step="1" data-wheel-step="10" value="20"></label>
      <div class="grid-choice-control camera-axis-control" id="cameraAxisControl"><span>相机旋转轴</span><div class="grid-choice" role="group" aria-label="相机旋转轴"><button type="button" data-camera-axis="x" aria-pressed="true">X</button><button type="button" data-camera-axis="y" aria-pressed="false">Y</button></div></div>
      <label class="range-control angle-toggle" id="cameraRotationControl" title="右键循环切换角度档位"><span id="cameraRotationLabel">相机X轴旋转 <output id="cameraRotationOutput">0°</output></span><input id="cameraRotationInput" type="range" min="-180" max="180" step="1" data-wheel-step="10" value="0"></label>
      <label class="range-control"><span>透视角度 <output id="fovOutput">18°</output></span><input id="fovInput" type="range" min="5" max="120" step="1" data-wheel-step="5" value="18"></label>
      <label class="range-control"><span>视口缩放 <output id="viewZoomOutput">130%</output></span><input id="viewZoomInput" type="range" min="40" max="400" step="1" data-wheel-step="10" value="130"></label>
      <label class="range-control"><span>视角水平偏移（X） <output id="viewOffsetXOutput">0 px</output></span><input id="viewOffsetXInput" type="range" min="-1200" max="1200" step="1" data-wheel-step="100" value="0"></label>
      <label class="range-control"><span>视角垂直偏移（Y） <output id="viewOffsetYOutput">0 px</output></span><input id="viewOffsetYInput" type="range" min="-1200" max="1200" step="1" data-wheel-step="100" value="0"></label>
      <div class="preset-box">
        <div class="preset-box-heading"><span>照片预设</span><small>仅保存照片墙参数</small></div>
        <div class="preset-save-row"><input id="presetNameInput" type="text" maxlength="32" placeholder="预设名称"><button class="save-preset-button" id="savePresetButton">保存</button></div>
        <div class="saved-presets" id="savedPresets"></div>
      </div>
    </section>
  </aside>
</main>
<div class="toast" id="toast" role="status"></div>`;

const $ = selector => document.querySelector(selector);

// Fixed square snapshots matching the reference compositions. Use the live
// card geometry and rounded material shader; only the image material changes.
function renderPresetPreviews(){
  const size=480;
  const previewRenderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  previewRenderer.setPixelRatio(1);
  previewRenderer.setSize(size,size,false);
  previewRenderer.outputColorSpace=THREE.SRGBColorSpace;
  previewRenderer.toneMapping=THREE.NoToneMapping;
  // Reference framing is deliberately independent of the editable viewport.
  const definitions={
    ring:{count:DEFAULT_PHOTO_COUNTS.ring,distance:36.5},
    bloom:{count:DEFAULT_PHOTO_COUNTS.bloom,distance:16.5},
    curved:{count:24,rows:3,columns:8,distance:15.8},
    // Give the left-right arc a denser five-row thumbnail. This is an
    // independent preview composition; the editable wall keeps its own
    // three-row default.
    curvedHorizontal:{count:24,rows:3,columns:8,distance:15.2},
    // Keep the original card geometry and spacing. The thumbnail is enlarged
    // by moving its preview camera closer, so the whole wall scales together.
    // The grid thumbnail uses a closer preview camera for a 1.5x overall
    // zoom. Card size and spacing stay unchanged; only the viewport framing
    // changes so the wall fills the small preview tile.
    grid:{count:DEFAULT_PHOTO_COUNTS.grid,distance:11.8},
  };
  try{
    document.querySelectorAll('[data-preview-mode]').forEach(host=>{
      const mode=host.dataset.previewMode,definition=definitions[mode];
      if(!definition)return;
      const settings=createModeSettings(mode);
      const width=DEFAULT_CARD_WIDTH/DESIGN_SCALE,height=DEFAULT_CARD_HEIGHT/DESIGN_SCALE;
      const rows=definition.rows||settings.rows;
      const columns=definition.columns||Math.ceil(definition.count/rows);
      const previewScene=new THREE.Scene();
      previewScene.background=new THREE.Color('#101014');
      const group=new THREE.Group();
      if(mode==='grid')group.position.set(-0.4,-0.6,0);
      const previewTiltX=THREE.MathUtils.degToRad(tiltValueFor(settings,'x'));
      const previewTiltY=THREE.MathUtils.degToRad(tiltValueFor(settings,'y'));
      const previewTiltZ=THREE.MathUtils.degToRad(tiltValueFor(settings,'z'));
      group.quaternion.identity();
      group.rotateOnWorldAxis(WORLD_X_AXIS,previewTiltX);
      group.rotateOnWorldAxis(WORLD_Y_AXIS,previewTiltY);
      group.rotateOnWorldAxis(WORLD_Z_AXIS,previewTiltZ);
      previewScene.add(group);
      const previewCamera=new THREE.PerspectiveCamera(settings.fov,1,.1,100);
      const yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(settings.rotation));
      const pitch=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-THREE.MathUtils.degToRad(settings.tilt));
      previewCamera.quaternion.copy(yaw.multiply(pitch));
      previewCamera.position.set(0,0,definition.distance).applyQuaternion(previewCamera.quaternion);
      previewCamera.updateMatrixWorld(true);
      const cardMaterials=[];
      const geometries=new Map();
      try{
        const poses=[];
        for(let index=0;index<definition.count;index++){
          poses.push(mode==='ring'
            ?ringCardPose(index,definition.count,settings.radius,settings.spacing/DESIGN_SCALE,THREE.MathUtils.degToRad(settings.contentRotation),width)
            :mode==='bloom'
              ?bloomCardPose(index,definition.count,settings.radius,settings.spacing/DESIGN_SCALE,THREE.MathUtils.degToRad(settings.contentRotation),width)
            :mode==='grid'
              ?gridCardPose(index,settings.rows,columns,settings.columnGap/DESIGN_SCALE,settings.rowGap/DESIGN_SCALE,settings.gridStagger/100,settings.gridStaggerDirection,width,height)
              :curvedCardPose(index,rows,columns,settings.columnGap/DESIGN_SCALE,settings.rowGap/DESIGN_SCALE,settings.curveBend,width,height,mode==='curved'||mode==='curvedHorizontal'?0:settings.stagger/100,mode==='curvedHorizontal'?'vertical':'horizontal',settings.staggerDirection));
        }
        const depths=poses.map(pose=>Math.max(.1,-pose.position.clone().applyQuaternion(group.quaternion).applyMatrix4(previewCamera.matrixWorldInverse).z));
        const nearest=Math.min(...depths),farthest=Math.max(...depths),depthRange=Math.max(.001,farthest-nearest);
        poses.forEach((pose,index)=>{
          const scale=pose.width/width;
          const radius=mode==='ring'?settings.radius/Math.max(scale,.001):pose.curvatureRadius||0;
          const axis=pose.curvatureAxis||'x',key=`${radius}:${axis}`;
          if(!geometries.has(key))geometries.set(key,createCardGeometry(radius,axis,width,height));
          const toneColor=index%2?'#7d808c':'#4f5159';
          const corner={value:settings.corner/DESIGN_SCALE},cardSize={value:new THREE.Vector2(width,height)};
          const front=createCardMaterial(corner,THREE.FrontSide,1,cardSize);
          const back=createCardMaterial(corner,THREE.BackSide,1,cardSize);
          front.color.set(toneColor);back.color.set(toneColor);
          cardMaterials.push(front,back);
          for(const material of [front,back]){
            const mesh=new THREE.Mesh(geometries.get(key),material);
            mesh.position.copy(pose.position);
            mesh.quaternion.copy(pose.quaternion);
            mesh.scale.set(scale,1,scale);
            group.add(mesh);
          }
        });
        previewRenderer.render(previewScene,previewCamera);
        // Copy the actual WebGL output into a static canvas before disposing
        // GPU resources. This needs no extra live WebGL contexts or updates.
        const canvas=document.createElement('canvas');
        canvas.width=size;canvas.height=size;canvas.className='preset-preview-canvas';
        canvas.setAttribute('aria-hidden','true');
        canvas.getContext('2d').drawImage(previewRenderer.domElement,0,0);
        host.replaceChildren(canvas);
      }finally{
        geometries.forEach(geometry=>geometry.dispose());
        cardMaterials.forEach(material=>material.dispose());
      }
    });
  }finally{
    previewRenderer.dispose();previewRenderer.forceContextLoss();
  }
}
function commitRangeOutput(output){
  const range=output.closest('.range-control')?.querySelector('input[type=range]');
  if(!range)return;
  const parsed=Number.parseFloat(output.textContent);
  if(!Number.isFinite(parsed)){output.textContent=range.value;return}
  const min=Number(range.min),max=Number(range.max),value=Math.min(max,Math.max(min,parsed));
  range.value=String(value);
  range.dispatchEvent(new Event('input',{bubbles:true}));
}
document.querySelectorAll('.range-control output').forEach(output=>{
  output.contentEditable='true';
  output.spellcheck=false;
  output.title='点击输入数值，滚轮微调';
  output.addEventListener('focus',()=>{const range=output.closest('.range-control')?.querySelector('input[type=range]');if(range){output.textContent=range.value;const selection=window.getSelection();const caret=document.createRange();caret.selectNodeContents(output);selection.removeAllRanges();selection.addRange(caret)}});
  output.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();output.blur()}});
  output.addEventListener('wheel',event=>{
    if(document.activeElement!==output)return;
    const range=output.closest('.range-control')?.querySelector('input[type=range]');
    if(!range)return;
    event.preventDefault();
    const step=Math.abs(Number(range.dataset.wheelStep||range.step))||1;
    const min=Number(range.min),max=Number(range.max),current=Number(range.value);
    const direction=event.deltaY<0?1:-1;
    const precision=Math.max(0,(String(step).split('.')[1]||'').length);
    const next=Math.min(max,Math.max(min,Number((current+direction*step).toFixed(precision))));
    range.value=String(next);
    range.dispatchEvent(new Event('input',{bubbles:true}));
  },{passive:false});
  output.addEventListener('blur',()=>commitRangeOutput(output));
});
// Angle controls share a five-step right-click cycle. Controls that use a
// non-negative rotation range use 270° as the equivalent of -90°.
const ANGLE_SNAP_VALUES=[0,90,180,-180,-90];
document.querySelectorAll('.angle-toggle').forEach(control=>{
  control.addEventListener('contextmenu',event=>{
    event.preventDefault();
    const range=control.querySelector('input[type=range]');
    if(!range)return;
    const current=Number(range.value);
    const min=Number(range.min),max=Number(range.max);
    const isUnsigned=min>=0;
    const cycle=isUnsigned?[0,90,180,270]:ANGLE_SNAP_VALUES;
    const index=cycle.findIndex(value=>Math.abs(value-current)<0.001);
    const next=cycle[(index<0?0:index+1)%cycle.length];
    range.value=String(Math.min(max,Math.max(min,next)));
    range.dispatchEvent(new Event('input',{bubbles:true}));
    const label=control.querySelector('span')?.firstChild?.textContent?.trim()||'角度参数';
    notify(`${label}：${next}°`);
  });
});

// A right click on an ordinary range restores that control's default for the
// active wall. Defaults are effect-specific, so perspective, viewport zoom,
// corner radius and layout values return to the useful starting composition
// instead of blindly going to zero. Angle controls keep their snap cycle above.
function defaultRangeValue(input){
  const settings=createModeSettings(state.mode);
  switch(input.id){
    case 'photoScaleInput': return 100;
    case 'photoOffsetXInput':
    case 'photoOffsetYInput': return 0;
    case 'cardWidthInput': return DEFAULT_CARD_WIDTH;
    case 'cardHeightInput': return DEFAULT_CARD_HEIGHT;
    case 'radiusInput': return settings.radius*DESIGN_SCALE;
    case 'spacingInput': return settings.spacing;
    case 'rowCountInput':
    case 'gridRowCountInput': return settings.rows;
    case 'columnCountInput':
    case 'gridColumnCountInput': return settings.columns;
    case 'curvedSpacingInput': return settings.columnGap;
    case 'gridGapInput': return settings.columnGap;
    case 'staggerInput': return settings.stagger;
    case 'gridStaggerInput': return settings.gridStagger;
    case 'curveBendInput': return settings.curveBend;
    case 'cornerInput': return settings.corner;
    case 'backBrightnessInput': return settings.backBrightness;
    case 'photoOpacityInput': return settings.photoOpacity;
    case 'wallTiltInput': return tiltValueFor(settings,state.tiltAxis||settings.tiltAxis||'x');
    case 'cameraRotationInput': return state.cameraAxis==='y'?settings.rotation:settings.tilt;
    case 'fovInput': return settings.fov;
    case 'viewZoomInput': return settings.zoom;
    case 'viewOffsetXInput': return settings.viewOffsetX;
    case 'viewOffsetYInput': return settings.viewOffsetY;
    default: return null;
  }
}
document.querySelectorAll('.range-control:not(.angle-toggle)').forEach(control=>{
  control.addEventListener('contextmenu',event=>{
    event.preventDefault();
    const range=control.querySelector('input[type=range]');
    if(!range)return;
    const value=defaultRangeValue(range);
    if(value===null||!Number.isFinite(Number(value)))return;
    range.value=String(value);
    range.dispatchEvent(new Event('input',{bubbles:true}));
    const label=control.querySelector('span')?.firstChild?.textContent?.trim()||'参数';
    notify(`${label}：已恢复默认`);
  });
});
const host = $('#renderHost');
const frame = $('#sceneFrame');
const tiltGizmo = $('#tiltGizmo');
const tiltGizmoReset = $('#tiltGizmoReset');
const tiltGizmoToggle = $('#tiltGizmoToggle');
const stage = $('#stage');
stage.classList.add('project-loading');
const inspector = $('.inspector');
const slotsList = $('#slotsList');
const slotsWrap = $('#slotsWrap');
const toast = $('#toast');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101014');
const wallGroup = new THREE.Group();
scene.add(wallGroup);
const camera = new THREE.PerspectiveCamera(state.fov,16/9,.1,80);
camera.position.set(0,.2,12.6);
const cameraTarget = new THREE.Vector3();
const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1;
host.appendChild(renderer.domElement);
let cards=Array(state.count).fill(null);
let exportRenderer=null;
let dragFrom=null;
let orbitDrag=null;
let pickerSlot=0;
let photoAdjustOpen=false;
let toastTimer;
let renderQueued=false;
let previewQualityJob=0;
let interactivePreviewQuality=null;
let interactivePreviewTimer=null;
let interactivePreviewJob=0;
let modeSwitchJob=0;
let lastCanvasSize={width:0,height:0};
let cameraHalfSpan=(state.radius+cardHeightWorld()/2)*1.1;
let cameraDistance=12.6;
let tiltGizmoVisible=false;

function notify(message){toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2200)}
function gcd(a,b){while(b){const next=a%b;a=b;b=next}return a||1}
function parseAspectRatio(value){
  const parts=String(value??'').trim().replace(/[×xX：]/g,':').replace(/\s+/g,'').split(/[:*\/]/).map(Number);
  if(parts.length!==2||!Number.isFinite(parts[0])||!Number.isFinite(parts[1])||parts[0]<=0||parts[1]<=0)return null;
  return {width:parts[0],height:parts[1]};
}
function clampRatioValue(value,fallback=1){
  const number=Number(value);return Number.isFinite(number)?THREE.MathUtils.clamp(Math.round(number*10)/10,RATIO_MIN,RATIO_MAX):fallback;
}
function ratioPartsForDimensions(width,height){
  const [ratioWidth,ratioHeight]=aspectRatioLabel(width,height).split(':').map(Number);
  return {width:clampRatioValue(ratioWidth,16),height:clampRatioValue(ratioHeight,9)};
}
function dimensionsForAspectRatio(value,longEdge=RESOLUTION_PRESETS[state.resolutionPreset]||RESOLUTION_PRESETS[DEFAULT_RESOLUTION_PRESET]){
  const ratio=parseAspectRatio(value);if(!ratio)return null;
  let width,height;
  if(ratio.width>=ratio.height){width=longEdge;height=Math.round(longEdge*ratio.height/ratio.width)}
  else{height=longEdge;width=Math.round(longEdge*ratio.width/ratio.height)}
  const scale=Math.min(1,8000/width,8000/height);
  width=Math.max(200,Math.round(width*scale));height=Math.max(200,Math.round(height*scale));
  return {width,height};
}
function aspectRatioLabel(w,h){
  const width=Math.max(1,Math.round(Number(w)||1)),height=Math.max(1,Math.round(Number(h)||1));
  const found=ratios.find(([,rw,rh])=>Math.abs(rw/rh-width/height)<.012);
  if(found)return found[0];
  const value=width/height;
  const format=value=>Number(value.toFixed(1)).toString();
  return value>=1?`${format(value)}:1`:`1:${format(1/value)}`;
}
function ratioName(w,h){return aspectRatioLabel(w,h)}
function draw(){renderQueued=false;renderer.render(scene,camera);updateTiltGizmo();if(!stage?.classList.contains('project-loading'))scheduleProjectSave()}
function render(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(draw)}
function wrapDegrees(value){return THREE.MathUtils.euclideanModulo(value+180,360)-180}
function cardWidthWorld(){return state.cardWidth/DESIGN_SCALE}
function cardHeightWorld(){return state.cardHeight/DESIGN_SCALE}
function ringRequiredRadius(){
  return (cardWidthWorld()+state.spacing/DESIGN_SCALE)*state.count/(2*Math.PI);
}
function ringLayoutRadius(){
  if(!isRingMode())return state.radius;
  return state.radius;
}
function curvedPoseFor(index){
  if(isGridMode())return gridCardPose(index,state.rows,state.columns,state.columnGap/DESIGN_SCALE,state.rowGap/DESIGN_SCALE,state.gridStagger/100,state.gridStaggerDirection,cardWidthWorld(),cardHeightWorld());
  const axis=state.mode==='curvedHorizontal'?'vertical':'horizontal';
  return curvedCardPose(index,state.rows,state.columns,state.columnGap/DESIGN_SCALE,state.rowGap/DESIGN_SCALE,state.curveBend,cardWidthWorld(),cardHeightWorld(),state.stagger/100,axis,state.staggerDirection);
}
function tiltKey(axis){return axis==='y'?'tiltY':axis==='z'?'tiltZ':'tiltX'}
function tiltValueFor(source,axis){
  const key=tiltKey(axis),value=Number(source?.[key]);
  if(Number.isFinite(value))return value;
  const legacy=Number(source?.wallTilt);
  return Number.isFinite(legacy)?legacy:0;
}
function makeWorldTiltQuaternion(tiltX=0,tiltY=0,tiltZ=0){
  worldTiltQuaternion.identity();
  worldTiltQuaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(WORLD_X_AXIS,THREE.MathUtils.degToRad(tiltX)));
  worldTiltQuaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(WORLD_Y_AXIS,THREE.MathUtils.degToRad(tiltY)));
  worldTiltQuaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(WORLD_Z_AXIS,THREE.MathUtils.degToRad(tiltZ)));
  return worldTiltQuaternion;
}
function activeTiltValue(){
  const value=tiltValueFor(state,state.tiltAxis||'x');
  state.wallTilt=value;
  return value;
}
function updateTiltGizmoStyle(){
  if(!tiltGizmo)return;
  const activeAxis=state.tiltAxis||'x';
  tiltGizmo.querySelectorAll('[data-gizmo-axis],[data-gizmo-label]').forEach(element=>{
    const axis=(element.dataset.gizmoAxis||element.dataset.gizmoLabel||'').toLowerCase();
    element.classList.toggle('selected',axis===activeAxis);
  });
}
function updateTiltGizmo(){
  if(!tiltGizmoVisible||!tiltGizmo)return;
  const rect=renderer.domElement.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  camera.updateMatrixWorld(true);wallGroup.updateMatrixWorld(true);
  const axisLength=Math.max(1.2,Math.min(2.2,cameraDistance*.16));
  const wallCenter=wallGroup.getWorldPosition(new THREE.Vector3());
  const projectPoint=worldPoint=>{
    const point=worldPoint.clone().project(camera);
    return {x:(point.x*.5+.5)*1000,y:(-.5*point.y+.5)*700};
  };
  const center=projectPoint(wallCenter);
  const endpoints={
    x:projectPoint(wallCenter.clone().addScaledVector(WORLD_X_AXIS,axisLength)),
    y:projectPoint(wallCenter.clone().addScaledVector(WORLD_Y_AXIS,axisLength)),
    z:projectPoint(wallCenter.clone().addScaledVector(WORLD_Z_AXIS,axisLength)),
  };
  tiltGizmo.querySelectorAll('[data-gizmo-axis]').forEach(line=>{
    const end=endpoints[line.dataset.gizmoAxis];if(!end)return;
    line.setAttribute('x1',String(center.x));line.setAttribute('y1',String(center.y));line.setAttribute('x2',String(end.x));line.setAttribute('y2',String(end.y));
  });
  tiltGizmo.querySelectorAll('[data-gizmo-label]').forEach(label=>{
    const end=endpoints[label.dataset.gizmoLabel];if(!end)return;
    const dx=end.x-center.x,dy=end.y-center.y,length=Math.max(1,Math.hypot(dx,dy));
    label.setAttribute('x',String(end.x+dx/length*14));label.setAttribute('y',String(end.y+dy/length*14));
  });
}
function setTiltGizmoVisible(visible){
  tiltGizmoVisible=Boolean(visible);
  tiltGizmo?.classList.toggle('visible',tiltGizmoVisible);
  tiltGizmoToggle?.classList.toggle('active',tiltGizmoVisible);
  tiltGizmoToggle?.setAttribute('aria-pressed',String(tiltGizmoVisible));
  tiltGizmoToggle?.setAttribute('aria-label',tiltGizmoVisible?'隐藏三轴辅助线':'显示三轴辅助线');
  tiltGizmoToggle?.setAttribute('title',tiltGizmoVisible?'隐藏三轴辅助线':'显示三轴辅助线');
  updateTiltGizmoStyle();
  if(tiltGizmoVisible){updateTiltGizmo();render()}
}
// Orbit the camera with a quaternion so position and orientation stay continuous
// when the pointer passes over the top or bottom of the model.
const orbitYAxis=new THREE.Vector3(0,1,0),orbitXAxis=new THREE.Vector3(1,0,0),orbitQuaternion=new THREE.Quaternion(),orbitYaw=new THREE.Quaternion(),orbitPitch=new THREE.Quaternion(),orbitOffset=new THREE.Vector3(0,0,1);
function updateCameraOrbit(){const az=THREE.MathUtils.degToRad(state.rotation),el=THREE.MathUtils.degToRad(state.tilt);orbitYaw.setFromAxisAngle(orbitYAxis,az);orbitPitch.setFromAxisAngle(orbitXAxis,-el);orbitQuaternion.copy(orbitYaw).multiply(orbitPitch);orbitOffset.set(0,0,cameraDistance).applyQuaternion(orbitQuaternion);camera.position.copy(cameraTarget).add(orbitOffset);camera.quaternion.copy(orbitQuaternion)}
function layoutFitSize(){
  if(isRingMode()){
    const ringRadius=ringLayoutRadius();
    const span=(ringRadius+Math.max(cardWidthWorld(),cardHeightWorld())/2)*1.1;
    return {halfWidth:span,halfHeight:span};
  }
  let maxX=0,maxY=0,maxZ=0;
  for(let i=0;i<state.count;i++){
    const pose=curvedPoseFor(i);
    maxX=Math.max(maxX,Math.abs(pose.position.x)+pose.width/2);
    maxY=Math.max(maxY,Math.abs(pose.position.y)+cardHeightWorld()/2);
    maxZ=Math.max(maxZ,Math.abs(pose.position.z)+cardHeightWorld()/2);
  }
  if(isGridMode()){
    const q=makeWorldTiltQuaternion(tiltValueFor(state,'x'),tiltValueFor(state,'y'),tiltValueFor(state,'z'));
    const m=new THREE.Matrix4().makeRotationFromQuaternion(q),e=m.elements;
    const halfWidth=Math.abs(e[0])*maxX+Math.abs(e[4])*maxY+Math.abs(e[8])*maxZ;
    const halfHeight=Math.abs(e[1])*maxX+Math.abs(e[5])*maxY+Math.abs(e[9])*maxZ;
    return {halfWidth:halfWidth*1.08,halfHeight:halfHeight*1.08};
  }
  return {halfWidth:maxX*1.08,halfHeight:maxY*1.08};
}
function fitCamera(fitWall=false){
  const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),aspect=Math.max(.025,camera.aspect);
  if(fitWall){const fit=layoutFitSize();cameraHalfSpan=fit.halfHeight;const fitDistance=Math.max(fit.halfHeight/halfFov,fit.halfWidth/(halfFov*aspect));cameraDistance=fitDistance*100/state.zoom}
  else {const fitDistance=cameraHalfSpan/(halfFov*Math.min(1,aspect));cameraDistance=fitDistance*100/state.zoom}
  camera.far=Math.max(80,cameraDistance+state.radius+20);updateCameraOrbit();camera.updateProjectionMatrix();
}
function resize(){const b=host.getBoundingClientRect();if(!b.width||!b.height)return;const width=Math.round(b.width),height=Math.round(b.height);if(width!==lastCanvasSize.width||height!==lastCanvasSize.height){lastCanvasSize={width,height};renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}fitCamera();updateTransforms()}
function releaseCard(card){
  if(!card)return;
  wallGroup.remove(card.mesh,card.backMesh);
  card.loadId++;
  const old=card.frontMaterial.map||card.backMaterial.map;
  if(old)old.dispose();
  card.frontMaterial.dispose();card.backMaterial.dispose();card.mesh.geometry.dispose();
}
function createCardMaterial(cornerUniform,side,brightness,sizeUniform){
  const material=new THREE.MeshBasicMaterial({side,transparent:true,opacity:1,color:0xffffff,depthWrite:true,alphaTest:.01});
  // A numeric value such as 0.3 is parsed by THREE.Color as a hex color
  // (0x000000), so set the grayscale brightness explicitly after creation.
  material.color.setScalar(THREE.MathUtils.clamp(Number(brightness)||0,0,1));
  material.onBeforeCompile=shader=>{
    shader.uniforms.cardCornerRadius=cornerUniform;
    shader.uniforms.cardSize=sizeUniform;
    shader.vertexShader='varying vec2 vCardUv;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvCardUv = uv;');
    shader.fragmentShader='varying vec2 vCardUv;\nuniform float cardCornerRadius;\nuniform vec2 cardSize;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
      vec2 cornerQ = abs((vCardUv - 0.5) * cardSize) - (cardSize * 0.5 - cardCornerRadius);
      float cornerDistance = length(max(cornerQ, 0.0)) + min(max(cornerQ.x, cornerQ.y), 0.0) - cardCornerRadius;
      float cornerAA = max(fwidth(cornerDistance), 0.00001);
      diffuseColor.a *= 1.0 - smoothstep(-cornerAA, cornerAA, cornerDistance);
      #include <alphatest_fragment>
    `);
  };
  return material;
}
function createCardGeometry(curvatureRadius=0,curvatureAxis='x',width=cardWidthWorld(),height=cardHeightWorld()){
  if(!curvatureRadius||Math.abs(curvatureRadius)<0.01)return new THREE.PlaneGeometry(width,height);
  // Subdivide along the direction that is actually being curved. Without
  // segments on the Y axis, a vertical curve collapses into one tilted quad.
  const geometry=curvatureAxis==='y'
    ?new THREE.PlaneGeometry(width,height,1,16)
    :new THREE.PlaneGeometry(width,height,16,1);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const distance=curvatureAxis==='y'?positions.getY(i):positions.getX(i),angle=distance/curvatureRadius;
    if(curvatureAxis==='y')positions.setXYZ(i,positions.getX(i),curvatureRadius*Math.sin(angle),-curvatureRadius*(1-Math.cos(angle)));
    else positions.setXYZ(i,curvatureRadius*Math.sin(angle),positions.getY(i),-curvatureRadius*(1-Math.cos(angle)));
  }
  positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
function ensureCardGeometry(card,curvatureRadius,curvatureAxis='x'){
  const key=`${cardWidthWorld().toFixed(5)}:${cardHeightWorld().toFixed(5)}:${curvatureRadius?`${curvatureAxis}:${curvatureRadius.toFixed(5)}`:'flat'}`;
  if(card.geometryKey===key)return;
  const geometry=createCardGeometry(curvatureRadius,curvatureAxis);card.mesh.geometry.dispose();card.mesh.geometry=geometry;card.backMesh.geometry=geometry;card.geometryKey=key;
}
function createCard(index){
  const cornerUniform={value:state.corner/DESIGN_SCALE};
  const sizeUniform={value:new THREE.Vector2(cardWidthWorld(),cardHeightWorld())};
  const frontMaterial=createCardMaterial(cornerUniform,THREE.FrontSide,0xffffff,sizeUniform);
  const backMaterial=createCardMaterial(cornerUniform,THREE.BackSide,state.mode==='bloom'?1:state.backBrightness/100,sizeUniform);
  const geometry=createCardGeometry();
  const mesh=new THREE.Mesh(geometry,frontMaterial);
  const backMesh=new THREE.Mesh(geometry,backMaterial);
  mesh.userData.slot=index;backMesh.userData.slot=index;
  const opacity=THREE.MathUtils.clamp(Number(state.photoOpacity)||0,0,100)/100;
  frontMaterial.opacity=opacity;backMaterial.opacity=opacity;
  frontMaterial.depthWrite=opacity>=.999;backMaterial.depthWrite=opacity>=.999;
  wallGroup.add(mesh,backMesh);
  const card={mesh,backMesh,frontMaterial,backMaterial,cornerUniform,sizeUniform,photo:null,loadId:0};
  cards[index]=card;return card;
}
// Render the static effect thumbnails only after the shared card geometry and
// material helpers have been defined.
renderPresetPreviews();
function photoAdjustValue(photo,key,fallback){
  const value=Number(photo?.[key]);return Number.isFinite(value)?value:fallback;
}
function applyCardTextureTransform(card){
  const texture=card?.frontMaterial.map||card?.backMaterial.map;if(!texture)return;
  const photo=card.photo||{};const scale=THREE.MathUtils.clamp(photoAdjustValue(photo,'imageScale',1),1,3);
  const offsetX=THREE.MathUtils.clamp(photoAdjustValue(photo,'imageOffsetX',0),-300,300)/100;
  const offsetY=THREE.MathUtils.clamp(photoAdjustValue(photo,'imageOffsetY',0),-300,300)/100;
  const base=card.baseTextureRepeat||{x:1,y:1};
  const repeatX=Math.min(1,base.x/scale),repeatY=Math.min(1,base.y/scale);
  texture.repeat.set(repeatX,repeatY);
  texture.offset.set((1-repeatX)/2+offsetX*(1-repeatX)/2,(1-repeatY)/2+offsetY*(1-repeatY)/2);
  texture.needsUpdate=true;
}
function syncCardTextureAspect(card){
  const texture=card?.frontMaterial.map;if(!texture?.image)return;
  const imageAspect=texture.image.width/texture.image.height,cardAspect=cardWidthWorld()/cardHeightWorld();
  const baseTextureRepeat={x:1,y:1};if(imageAspect>cardAspect)baseTextureRepeat.x=cardAspect/imageAspect;else baseTextureRepeat.y=imageAspect/cardAspect;
  card.baseTextureRepeat=baseTextureRepeat;applyCardTextureTransform(card);
}
function setCardPhoto(index,sourceOverride=null){
  const photo=state.photos[index];let card=cards[index];
  if(!photo?.src){if(card)releaseCard(card);cards[index]=null;return Promise.resolve()}
  if(!card)card=createCard(index);
  // Uploaded images use ImageBitmap for both preview modes. This keeps the
  // browser's color conversion identical while allowing the standard mode to
  // use a genuinely smaller bitmap. TextureLoader is kept for sample images
  // and browsers without ImageBitmap support.
  const textureQuality=interactivePreviewQuality||previewQuality;
  const bitmapKey=sourceOverride?'original':textureQuality;
  const previewCanvas=!sourceOverride&&photo.previewCanvases?.[bitmapKey]
    ?photo.previewCanvases[bitmapKey]
    :(sourceOverride===photo.fullSrc?photo.previewCanvases?.original:null);
  const bitmap=!previewCanvas&&!sourceOverride&&photo.previewBitmaps?.[bitmapKey]
    ?photo.previewBitmaps[bitmapKey]
    :(sourceOverride===photo.fullSrc?photo.previewBitmaps?.original:null);
  const previewUrl=!sourceOverride&&bitmapKey==='standard'?photo.previewUrls?.standard:null;
  const source=sourceOverride||previewUrl||photo.src;
  const sourceKey=previewCanvas?`canvas:${bitmapKey}`:bitmap?`bitmap:${bitmapKey}`:source;
  if(card.photo===photo&&card.photoSource===sourceKey)return Promise.resolve();
  card.photo=photo;card.photoSource=sourceKey;const loadId=++card.loadId;
  return new Promise((resolve,reject)=>{
    const applyTexture=texture=>{
      texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
      if(cards[index]!==card||card.loadId!==loadId){texture.dispose();resolve();return}
      const imageAspect=texture.image.width/texture.image.height,cardAspect=cardWidthWorld()/cardHeightWorld();
      const baseTextureRepeat={x:1,y:1};if(imageAspect>cardAspect)baseTextureRepeat.x=cardAspect/imageAspect;else baseTextureRepeat.y=imageAspect/cardAspect;
      card.baseTextureRepeat=baseTextureRepeat;
      texture.repeat.set(baseTextureRepeat.x,baseTextureRepeat.y);texture.offset.set((1-texture.repeat.x)/2,(1-texture.repeat.y)/2);
      const old=card.frontMaterial.map||card.backMaterial.map;card.frontMaterial.map=texture;card.backMaterial.map=texture;card.frontMaterial.needsUpdate=true;card.backMaterial.needsUpdate=true;if(old)old.dispose();render();
      applyCardTextureTransform(card);resolve();
    };
    if(previewCanvas){
      const texture=new THREE.CanvasTexture(previewCanvas);texture.needsUpdate=true;applyTexture(texture);return;
    }
    if(bitmap){
      const texture=new THREE.Texture(bitmap);texture.needsUpdate=true;applyTexture(texture);return;
    }
    new THREE.TextureLoader().load(source,applyTexture,undefined,error=>{notify(`无法读取图片：${photo.name||'文件'}`);reject(error||new Error('图片读取失败'))});
  });
}
function updateTransforms(fitWall=true){
  if(isRingMode())syncRingControls();else if(isGridMode())syncGridControls();else syncCurvedControls();
  // Layout controls can change the wall's bounds (especially the ring gap),
  // so recalculate the camera fit. Camera-only gestures keep their current
  // distance and only refresh the orbit orientation.
  if(fitWall)fitCamera(true);else updateCameraOrbit();
  const count=state.count;
  const ringRadius=isRingMode()?ringLayoutRadius():state.radius;
  const tiltX=THREE.MathUtils.degToRad(tiltValueFor(state,'x'));
  const tiltY=THREE.MathUtils.degToRad(tiltValueFor(state,'y'));
  const tiltZ=THREE.MathUtils.degToRad(tiltValueFor(state,'z'));
  // Apply each tilt around the fixed scene axes. The selected axis only
  // chooses which value the slider edits; it must not turn the other axes off.
  wallGroup.quaternion.identity();
  wallGroup.rotateOnWorldAxis(WORLD_X_AXIS,tiltX);
  wallGroup.rotateOnWorldAxis(WORLD_Y_AXIS,tiltY);
  wallGroup.rotateOnWorldAxis(WORLD_Z_AXIS,tiltZ);
  for(let i=0;i<count;i++){
    if(cards[i]?.photo!==state.photos[i])setCardPhoto(i).catch(()=>{});
    const card=cards[i];if(!card)continue;
    const mesh=card.mesh,pose=state.mode==='ring'
      ? ringCardPose(i,count,ringRadius,state.spacing/DESIGN_SCALE,THREE.MathUtils.degToRad(state.contentRotation),cardWidthWorld())
      : state.mode==='bloom'
        ? bloomCardPose(i,count,ringRadius,state.spacing/DESIGN_SCALE,THREE.MathUtils.degToRad(state.contentRotation),cardWidthWorld())
      : curvedPoseFor(i);
    mesh.position.copy(pose.position);
    mesh.quaternion.copy(pose.quaternion);
    const cardScale=pose.width/cardWidthWorld();
    // A ring card is a small cylindrical section, so the image surface bends
    // with the wall instead of remaining a flat panel merely rotated around it.
    const curvatureRadius=state.mode==='ring'
      ?ringRadius/Math.max(cardScale,.001)
      :pose.curvatureRadius||0;
    ensureCardGeometry(card,curvatureRadius,pose.curvatureAxis||'x');
    mesh.scale.set(cardScale,1,cardScale);mesh.userData.slot=i;
    card.sizeUniform.value.set(cardWidthWorld(),cardHeightWorld());
    syncCardTextureAspect(card);
    mesh.userData.slot=i;
    card.backMesh.position.copy(mesh.position);card.backMesh.quaternion.copy(mesh.quaternion);card.backMesh.scale.copy(mesh.scale);card.backMesh.userData.slot=i;
    card.cornerUniform.value=state.corner/DESIGN_SCALE;
  }
  wallGroup.updateMatrixWorld(true);
  render();
}
function syncRingControls(){
  state.spacing=THREE.MathUtils.clamp(state.spacing,0,300);
  const requiredRadius=ringRequiredRadius();
  // The curved ring must keep cards apart, but bloom intentionally allows
  // cards to overlap so its radius can control a compact burst.
  const minRadius=state.mode==='bloom'?0.05:Math.max(0.05,requiredRadius);
  // Keep the input range stable so changing another control cannot move the
  // radius thumb while its value stays the same. The value itself is clamped
  // only when it would violate the requested minimum spacing.
  const radiusUiMin=0.05;
  // Large walls can legitimately need more than the original 20 world-unit
  // radius. Keep the slider usable instead of letting its value exceed max
  // and leaving the thumb stuck at the end of the track.
  const radiusUiMax=Math.max(20,minRadius);
  state.radius=THREE.MathUtils.clamp(state.radius,minRadius,radiusUiMax);
  const radiusInput=$('#radiusInput');
  radiusInput.min=Math.ceil(radiusUiMin*DESIGN_SCALE*10)/10;
  radiusInput.max=Math.ceil(radiusUiMax*DESIGN_SCALE*10)/10;
  radiusInput.value=(state.radius*DESIGN_SCALE).toFixed(1);
  $('#radiusOutput').textContent=`${(state.radius*DESIGN_SCALE).toFixed(1)} px`;
  $('#spacingInput').value=state.spacing;$('#spacingOutput').textContent=`${Number(state.spacing.toFixed(1))} px`;
  syncCardSizeControls();
}
function syncCurvedControls(){
  const count=Math.max(3,Math.min(72,Math.round(Number(state.count)||12)));
  const maxRows=Math.min(8,Math.max(1,Math.ceil(count/3)));
  state.rows=THREE.MathUtils.clamp(Math.round(state.rows),1,maxRows);
  state.columns=THREE.MathUtils.clamp(Math.round(state.columns),3,Math.max(3,count));
  state.columnGap=THREE.MathUtils.clamp(state.columnGap,0,160);
  state.rowGap=THREE.MathUtils.clamp(state.rowGap,0,160);
  state.columnGap=THREE.MathUtils.clamp(state.columnGap,0,160);
  state.spacingMode=state.spacingMode==='column'||state.spacingMode==='row'?state.spacingMode:'all';
  const staggerValue=Number(state.stagger);
  state.stagger=THREE.MathUtils.clamp(Math.round(Number.isFinite(staggerValue)?staggerValue:50),0,100);
  if(state.stagger>0&&state.stagger<=5)state.stagger=0;
  state.staggerDirection=state.staggerDirection==='vertical'?'vertical':'horizontal';
  state.curveBend=THREE.MathUtils.clamp(state.curveBend,-180,180);
  $('#rowCountInput').max=maxRows;
  $('#columnCountInput').max=Math.max(3,count);
  $('#rowCountInput').value=state.rows;$('#rowCountOutput').textContent=state.rows;
  $('#columnCountInput').value=state.columns;$('#columnCountOutput').textContent=state.columns;
  $('#staggerInput').value=state.stagger;$('#staggerOutput').textContent=`${state.stagger}%`;
  const spacingValue=state.spacingMode==='row'?state.rowGap:state.columnGap;
  const spacingLabel=state.spacingMode==='row'?'行间距':state.spacingMode==='column'?'列间距':'间距';
  $('#curvedSpacingInput').value=spacingValue;$('#curvedSpacingLabel').firstChild.textContent=spacingLabel+' ';$('#curvedSpacingOutput').textContent=`${spacingValue} px`;
  document.querySelectorAll('[data-curved-spacing-mode]').forEach(button=>{const active=button.dataset.curvedSpacingMode===state.spacingMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  $('#curveBendInput').value=state.curveBend;$('#curveBendOutput').textContent=`${state.curveBend}°`;
  document.querySelectorAll('[data-curved-stagger-direction]').forEach(button=>{const active=button.dataset.curvedStaggerDirection===state.staggerDirection;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
}
function syncGridControls(){
  const count=Math.max(3,Math.min(72,Math.round(Number(state.count)||24)));
  const maxRows=Math.min(8,Math.max(1,Math.ceil(count/3)));
  state.rows=THREE.MathUtils.clamp(Math.round(state.rows||3),1,maxRows);
  state.columns=THREE.MathUtils.clamp(Math.round(state.columns||8),3,Math.max(3,count));
  const gridGap=Number(state.columnGap);
  state.columnGap=THREE.MathUtils.clamp(Number.isFinite(gridGap)?gridGap:39,0,160);
  const gridRowGap=Number(state.rowGap);
  state.rowGap=THREE.MathUtils.clamp(Number.isFinite(gridRowGap)?gridRowGap:39,0,160);
  state.spacingMode=state.spacingMode==='column'||state.spacingMode==='row'?state.spacingMode:'all';
  const gridStagger=Number(state.gridStagger);
  state.gridStagger=THREE.MathUtils.clamp(Math.round(Number.isFinite(gridStagger)?gridStagger:50),0,50);
  state.gridStaggerDirection=state.gridStaggerDirection==='vertical'?'vertical':'horizontal';
  state.tiltAxis=state.tiltAxis==='x'||state.tiltAxis==='y'||state.tiltAxis==='z'?state.tiltAxis:'z';
  state.tiltX=THREE.MathUtils.clamp(Number.isFinite(Number(state.tiltX))?Number(state.tiltX):0,-180,180);
  state.tiltY=THREE.MathUtils.clamp(Number.isFinite(Number(state.tiltY))?Number(state.tiltY):0,-180,180);
  state.tiltZ=THREE.MathUtils.clamp(Number.isFinite(Number(state.tiltZ))?Number(state.tiltZ):20,-180,180);
  state.gridTiltZ=state.tiltZ;
  $('#gridRowCountInput').max=maxRows;$('#gridColumnCountInput').max=Math.max(3,count);
  $('#gridRowCountInput').value=state.rows;$('#gridRowCountOutput').textContent=state.rows;
  $('#gridColumnCountInput').value=state.columns;$('#gridColumnCountOutput').textContent=state.columns;
  const spacingValue=state.spacingMode==='row'?state.rowGap:state.columnGap;
  const spacingLabel=state.spacingMode==='row'?'行间距':state.spacingMode==='column'?'列间距':'间距';
  $('#gridGapInput').value=spacingValue;$('#gridSpacingLabel').firstChild.textContent=spacingLabel+' ';$('#gridGapOutput').textContent=`${spacingValue} px`;
  document.querySelectorAll('[data-grid-spacing-mode]').forEach(button=>{const active=button.dataset.gridSpacingMode===state.spacingMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  $('#gridStaggerInput').value=state.gridStagger;$('#gridStaggerOutput').textContent=`${state.gridStagger}%`;
  document.querySelectorAll('[data-grid-direction]').forEach(button=>{const active=button.dataset.gridDirection===state.gridStaggerDirection;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
}
function syncPhotoSlots(){
  const jobs=[];
  for(let i=0;i<state.count;i++)if(cards[i]?.photo!==state.photos[i])jobs.push(setCardPhoto(i).catch(()=>{}));
  updateTransforms(false);
  return Promise.allSettled(jobs);
}
// Preview quality only changes the image source. Keep the current wall pose
// and camera framing intact instead of routing through updateTransforms(),
// which refits the whole scene and makes the canvas appear to zoom.
function refreshPhotoTextures(){
  cards.forEach(card=>{if(card){card.photo=null;card.photoSource=null}});
  const jobs=[];
  for(let i=0;i<state.count;i++)jobs.push(setCardPhoto(i).catch(()=>{}));
  render();
  return Promise.all(jobs);
}
function updateDimensionUI(){
  const ratioWidth=clampRatioValue(state.ratioWidth,ratioPartsForDimensions(state.width,state.height).width);
  const ratioHeight=clampRatioValue(state.ratioHeight,ratioPartsForDimensions(state.width,state.height).height);
  state.ratioWidth=ratioWidth;state.ratioHeight=ratioHeight;
  const ratioWidthInput=$('#ratioWidthInput'),ratioHeightInput=$('#ratioHeightInput');
  if(ratioWidthInput)ratioWidthInput.value=ratioWidth;
  if(ratioHeightInput)ratioHeightInput.value=ratioHeight;
  $('#resolutionLabel').textContent=`${state.width} × ${state.height} px`;
  const resolutionPreset=state.resolutionPreset||DEFAULT_RESOLUTION_PRESET;
  const resolutionPresetLabel=$('#resolutionPresetLabel');if(resolutionPresetLabel)resolutionPresetLabel.textContent=resolutionPreset;
  document.querySelectorAll('[data-resolution-preset]').forEach(option=>option.setAttribute('aria-selected',String(option.dataset.resolutionPreset===resolutionPreset)));
  const name=ratioName(state.width,state.height);
  document.querySelectorAll('.ratio-button').forEach(button=>button.classList.toggle('active',button.dataset.ratio===name));
  frame.style.setProperty('--frame-ratio',`${state.width} / ${state.height}`);
  frame.dataset.orientation=state.width>=state.height?'landscape':'portrait';requestAnimationFrame(()=>{resize();updateTransforms()});
}
function setDimensions(w,h){state.width=Math.max(200,Math.min(8000,Math.round(w)));state.height=Math.max(200,Math.min(8000,Math.round(h)));updateDimensionUI()}
function fillSampleSlots(from,to){
  for(let i=from;i<to;i++)if(!state.photos[i])state.photos[i]={src:samplePhoto(i),name:`示例照片 ${String(i+1).padStart(2,'0')}`,sample:true};
}
function updateSlots(){
  $('#slotCountOutput').textContent=state.count;$('#slotCountLabel').textContent=`${state.count} 个槽位`;
  const countFor=mode=>mode===state.mode?state.count:(state.photosByMode?.[mode]?.length||0);
  const ringPresetCount=$('#ringPresetCount'),curvedPresetCount=$('#curvedPresetCount'),curvedHorizontalPresetCount=$('#curvedHorizontalPresetCount'),gridPresetCount=$('#gridPresetCount');
  if(ringPresetCount)ringPresetCount.textContent=countFor('ring');
  if(curvedPresetCount)curvedPresetCount.textContent=countFor('curved');
  if(curvedHorizontalPresetCount)curvedHorizontalPresetCount.textContent=countFor('curvedHorizontal');
  if(gridPresetCount)gridPresetCount.textContent=countFor('grid');
  if(slotsList.children.length!==state.count)slotsList.innerHTML=state.photos.map((_,i)=>`<div class="slot-row" draggable="true" data-slot="${i}"><span class="drag-grip">⠿</span><button class="slot-thumb" data-pick="${i}" title="点击添加或替换图片"><span class="plus-mark">＋</span></button><button class="slot-copy" data-select="${i}"><b>槽位 ${i+1}</b><small>点击选择图片</small></button><button class="slot-adjust" data-adjust="${i}" title="调整图片">⌗</button><button class="slot-replace" data-pick="${i}" title="替换图片">↻</button></div>`).join('');
  [...slotsList.children].forEach((row,i)=>{
    const photo=state.photos[i],thumb=row.querySelector('.slot-thumb'),existing=thumb.querySelector('img');
    row.dataset.slot=i;row.classList.toggle('selected',i===state.selected);
    row.querySelector('.slot-copy b').textContent=`槽位 ${i+1}`;row.querySelector('.slot-copy small').textContent=photo?.name||'点击选择图片';
    row.querySelectorAll('[data-pick]').forEach(button=>button.dataset.pick=i);row.querySelector('[data-select]').dataset.select=i;
    thumb.classList.toggle('has-image',Boolean(photo?.src));
    if(photo?.src){if(existing){if(existing.getAttribute('src')!==photo.src)existing.src=photo.src}else thumb.innerHTML=`<img src="${photo.src}" alt="槽位 ${i+1}">`}
    else if(existing||!thumb.querySelector('.plus-mark'))thumb.innerHTML='<span class="plus-mark">＋</span>';
  });
  syncPhotoAdjustControls();
}
function syncPhotoAdjustControls(){
  const photo=state.photos[state.selected]||{};
  $('#selectedPhotoLabel').textContent=`槽位 ${state.selected+1}${photo.name?` · ${photo.name}`:''}`;
  const scale=Math.round(photoAdjustValue(photo,'imageScale',1)*100),offsetX=Math.round(photoAdjustValue(photo,'imageOffsetX',0)),offsetY=Math.round(photoAdjustValue(photo,'imageOffsetY',0));
  $('#photoScaleInput').value=scale;$('#photoScaleOutput').textContent=`${scale}%`;
  $('#photoOffsetXInput').value=offsetX;$('#photoOffsetXOutput').textContent=`${offsetX}%`;
  $('#photoOffsetYInput').value=offsetY;$('#photoOffsetYOutput').textContent=`${offsetY}%`;
  positionPhotoAdjustPanel();
}
function positionPhotoAdjustPanel(){
  const panel=$('#photoAdjustPanel');if(!panel)return;
  panel.classList.toggle('open',photoAdjustOpen);if(!photoAdjustOpen)return;
  const row=slotsList.children[state.selected];if(!row)return;
  const wrapRect=slotsWrap.getBoundingClientRect(),rowRect=row.getBoundingClientRect();
  // Keep the popup above the selected row. Negative values intentionally let
  // it overlap the upload area when the selected row is near the list top.
  const top=rowRect.top-wrapRect.top-panel.offsetHeight-8;
  panel.style.top=`${top}px`;
}
slotsList.addEventListener('click',event=>{
  const row=event.target.closest('.slot-row');if(!row)return;const index=Number(row.dataset.slot);
  if(event.target.closest('[data-pick]')){pickerSlot=index;$('#fileInput').click();return}
  if(event.target.closest('[data-adjust]')){photoAdjustOpen=state.selected!==index||!photoAdjustOpen;state.selected=index;updateSlots();return}
  if(event.target.closest('[data-select]')){state.selected=index;updateSlots()}
});
function closePhotoAdjustOnScroll(){if(!photoAdjustOpen)return;photoAdjustOpen=false;positionPhotoAdjustPanel()}
slotsList.addEventListener('scroll',closePhotoAdjustOnScroll);
inspector.addEventListener('scroll',closePhotoAdjustOnScroll);
document.addEventListener('scroll',closePhotoAdjustOnScroll,true);
document.addEventListener('wheel',closePhotoAdjustOnScroll,{capture:true,passive:true});
slotsList.addEventListener('dragstart',event=>{const row=event.target.closest('.slot-row');if(!row)return;dragFrom=Number(row.dataset.slot);row.classList.add('dragging');event.dataTransfer.effectAllowed='move'});
slotsList.addEventListener('dragend',event=>event.target.closest('.slot-row')?.classList.remove('dragging'));
slotsList.addEventListener('dragover',event=>{const row=event.target.closest('.slot-row');if(!row)return;event.preventDefault();row.classList.add('drag-over')});
slotsList.addEventListener('dragleave',event=>event.target.closest('.slot-row')?.classList.remove('drag-over'));
slotsList.addEventListener('drop',event=>{const row=event.target.closest('.slot-row');if(!row)return;event.preventDefault();row.classList.remove('drag-over');const to=Number(row.dataset.slot);if(dragFrom!==null&&dragFrom!==to){[state.photos[dragFrom],state.photos[to]]=[state.photos[to],state.photos[dragFrom]];[cards[dragFrom],cards[to]]=[cards[to],cards[dragFrom]];state.selected=to;dragFrom=null;updateSlots();updateTransforms();scheduleProjectSave()}});
function normalizeCurvedGrid(rows=state.rows,columns=state.columns,source='rows'){
  const count=Math.max(3,Math.min(72,Math.round(Number(state.count)||12)));
  const maxRows=Math.min(8,Math.max(1,Math.ceil(count/3)));
  if(source==='columns'){
    state.columns=THREE.MathUtils.clamp(Math.round(columns),3,Math.max(3,count));
    state.rows=THREE.MathUtils.clamp(Math.ceil(count/state.columns),1,maxRows);
    state.columns=Math.max(3,Math.ceil(count/state.rows));
  }else{
    state.rows=THREE.MathUtils.clamp(Math.round(rows),1,maxRows);
    state.columns=Math.max(3,Math.ceil(count/state.rows));
  }
}
function setCount(value){const previous=state.count,count=Math.max(3,Math.min(72,Math.round(value)));if(count<previous){state.photos.slice(count).forEach(p=>{if(p?.objectUrl)URL.revokeObjectURL(p.objectUrl)});cards.slice(count).forEach(releaseCard);state.photos.length=count;cards.length=count}else{state.photos.length=count;cards.length=count;fillSampleSlots(previous,count)}state.count=count;if(isRingMode())state.ringCount=count;state.selected=Math.min(state.selected,count-1);if(isCurvedMode()||isGridMode())normalizeCurvedGrid(state.rows,state.columns,'rows');updateSlots();if(isCurvedMode())syncCurvedControls();if(isGridMode())syncGridControls();updateTransforms();scheduleProjectSave();if(count>previous){fitCamera(true);updateTransforms();requestAnimationFrame(()=>slotsList.lastElementChild?.scrollIntoView({block:'nearest'}))}}
function setCurvedGrid(rows=state.rows,columns=state.columns,source='rows'){
  normalizeCurvedGrid(rows,columns,source);
  syncCurvedControls();
  updateTransforms();
  scheduleProjectSave();
}
function adjustSlotCount(delta){
  setCount(state.count+delta);
}
function saveModeSettings(mode=state.mode){
  const settings=modeSettings[mode];
  state.wallTilt=activeTiltValue();
  MODE_SETTING_KEYS.forEach(key=>{settings[key]=state[key]});
  settings.viewOffsetX=cameraTarget.x*DESIGN_SCALE;settings.viewOffsetY=cameraTarget.y*DESIGN_SCALE;
  settings.cameraTarget=cameraTarget.toArray();
  if(isRingMode(mode))settings.ringCount=state.count;
}
function applyModeSettings(mode){
  const settings=modeSettings[mode];
  MODE_SETTING_KEYS.forEach(key=>{state[key]=settings[key]??(key==='stagger'?50:key==='staggerDirection'?'horizontal':key==='spacingMode'?'all':key==='tiltAxis'?(isGridMode(mode)?'z':'x'):(key==='cameraAxis'?'x':state[key]))});
  const legacyTilt=Number(settings.wallTilt);
  if(!Number.isFinite(Number(settings.tiltX)))state.tiltX=Number.isFinite(legacyTilt)?legacyTilt:0;
  if(!Number.isFinite(Number(settings.tiltY)))state.tiltY=0;
  if(!Number.isFinite(Number(settings.tiltZ)))state.tiltZ=0;
  state.tiltAxis=state.tiltAxis==='y'||state.tiltAxis==='z'?state.tiltAxis:(isGridMode(mode)?'z':'x');
  state.wallTilt=tiltValueFor(state,state.tiltAxis);
  if(Array.isArray(settings.cameraTarget))cameraTarget.fromArray(settings.cameraTarget);
  else cameraTarget.set((settings.viewOffsetX||0)/DESIGN_SCALE,(settings.viewOffsetY||0)/DESIGN_SCALE,0);
  camera.fov=state.fov;
}
function syncViewControls(){
  state.tiltAxis=state.tiltAxis==='y'||state.tiltAxis==='z'?state.tiltAxis:'x';
  state.cameraAxis=state.cameraAxis==='y'?'y':'x';
  const activeTilt=activeTiltValue();
  $('#wallTiltInput').value=activeTilt;$('#wallTiltOutput').textContent=`${Math.round(activeTilt)}°`;
  document.querySelectorAll('[data-tilt-axis]').forEach(button=>{const active=button.dataset.tiltAxis===state.tiltAxis;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  const cameraRotation=state.cameraAxis==='y'?state.rotation:state.tilt;
  document.querySelectorAll('[data-camera-axis]').forEach(button=>{const active=button.dataset.cameraAxis===state.cameraAxis;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  $('#cameraRotationLabel').firstChild.textContent=`相机${state.cameraAxis.toUpperCase()}轴旋转 `;
  $('#cameraRotationInput').value=cameraRotation;$('#cameraRotationOutput').textContent=`${Math.round(cameraRotation)}°`;
  updateTiltGizmoStyle();
  state.fov=THREE.MathUtils.clamp(Number(state.fov)||38,5,120);camera.fov=state.fov;
  $('#fovInput').value=state.fov;$('#fovOutput').textContent=`${state.fov}°`;
  $('#viewZoomInput').value=state.zoom;$('#viewZoomOutput').textContent=`${state.zoom}%`;$('#zoomLabel').textContent=`${state.zoom}%`;
  syncPanControls();
}
function syncPanControls(){
  state.viewOffsetX=cameraTarget.x*DESIGN_SCALE;state.viewOffsetY=cameraTarget.y*DESIGN_SCALE;
  $('#viewOffsetXInput').value=Math.round(state.viewOffsetX);$('#viewOffsetXOutput').textContent=`${Math.round(state.viewOffsetX)} px`;
  $('#viewOffsetYInput').value=Math.round(state.viewOffsetY);$('#viewOffsetYOutput').textContent=`${Math.round(state.viewOffsetY)} px`;
}
function syncCardSizeControls(){
  // Do not clamp the stored width when another control changes. In
  // particular, changing the ring radius must never rewrite the card size.
  // The layout radius expands when a larger card needs more room.
  state.cardWidth=THREE.MathUtils.clamp(Number(state.cardWidth)||DEFAULT_CARD_WIDTH,40,600);
  state.cardHeight=THREE.MathUtils.clamp(Number(state.cardHeight)||DEFAULT_CARD_HEIGHT,40,800);
  const widthValue=Math.round(state.cardWidth);
  // Width has a stable range. Ring fitting is handled by the radius minimum,
  // so changing spacing or radius never moves this slider's thumb.
  $('#cardWidthInput').min=40;$('#cardWidthInput').max=600;
  $('#cardWidthInput').value=widthValue;$('#cardWidthOutput').textContent=`${widthValue} px`;
  $('#cardHeightInput').value=Math.round(state.cardHeight);$('#cardHeightOutput').textContent=`${Math.round(state.cardHeight)} px`;
  const maxCorner=Math.floor(Math.min(state.cardWidth,state.cardHeight)/2);$('#cornerInput').max=maxCorner;
  if(state.corner>maxCorner){state.corner=maxCorner;$('#cornerOutput').textContent=`${state.corner} px`}
}
function syncVisualControls(){
  state.photoOpacity=THREE.MathUtils.clamp(Number.isFinite(Number(state.photoOpacity))?Number(state.photoOpacity):100,0,100);
  $('#cornerInput').value=state.corner;$('#cornerOutput').textContent=`${state.corner} px`;
  $('#contentRotationInput').value=state.contentRotation;$('#contentRotationOutput').textContent=`${state.contentRotation}°`;
  $('#backBrightnessInput').value=state.backBrightness;$('#backBrightnessOutput').textContent=`${state.backBrightness}%`;
  $('#photoOpacityInput').value=state.photoOpacity;$('#photoOpacityOutput').textContent=`${state.photoOpacity}%`;
  syncCardOpacity();
  const backBrightness=state.mode==='bloom'?100:state.backBrightness;
  for(const card of cards)if(card)card.backMaterial.color.setScalar(backBrightness/100);
}
function syncCardOpacity(){
  const opacity=THREE.MathUtils.clamp(Number(state.photoOpacity)||0,0,100)/100;
  for(const card of cards)if(card){
    card.frontMaterial.opacity=opacity;card.backMaterial.opacity=opacity;
    card.frontMaterial.depthWrite=opacity>=.999;card.backMaterial.depthWrite=opacity>=.999;
    card.frontMaterial.needsUpdate=true;card.backMaterial.needsUpdate=true;
  }
}
function updateModeUI(){
  const curved=isCurvedMode();
  const grid=isGridMode();
  const ring=isRingMode();
  $('#ringPreset').classList.toggle('selected',state.mode==='ring');
  $('#bloomPreset').classList.toggle('selected',state.mode==='bloom');
  $('#curvedPreset').classList.toggle('selected',state.mode==='curved');
  $('#curvedHorizontalPreset').classList.toggle('selected',state.mode==='curvedHorizontal');
  $('#gridPreset').classList.toggle('selected',grid);
  // Grid walls use the same camera controls as the other walls. Their
  // default view remains isometric, but the user can orbit and pan it.
  frame.classList.toggle('grid-locked',false);
  $('#ringLayoutSettings').classList.toggle('mode-hidden',!ring);
  $('#ringSpacingControl').classList.toggle('mode-hidden',state.mode==='bloom');
  $('#curvedLayoutSettings').classList.toggle('mode-hidden',!curved);
  $('#gridLayoutSettings').classList.toggle('mode-hidden',!grid);
  $('#photoOpacityControl').classList.toggle('mode-hidden',!ring);
  $('#contentRotationControl').classList.toggle('mode-hidden',curved||grid);
  $('#backBrightnessInput').closest('.range-control').classList.toggle('mode-hidden',grid||state.mode==='bloom');
  $('#wallTiltControl').classList.toggle('mode-hidden',false);
  $('#tiltAxisControl').classList.toggle('mode-hidden',false);
  $('#cameraAxisControl').classList.toggle('mode-hidden',false);
  $('#cameraRotationControl').classList.toggle('mode-hidden',false);
  $('#fovInput').closest('.range-control').classList.toggle('mode-hidden',false);
  $('#viewOffsetXInput').closest('.range-control').classList.toggle('mode-hidden',false);
  $('#viewOffsetYInput').closest('.range-control').classList.toggle('mode-hidden',false);
  $('#viewZoomInput').closest('.range-control').classList.toggle('mode-hidden',false);
  $('#settingsTitle').textContent='设置';
  const modeLabel=state.mode==='curvedHorizontal'?'左右弧形':state.mode==='curved'?'上下弧形':state.mode==='bloom'?'环形绽放':grid?'网格':'环绕弯曲';
  $('#projectName').firstChild.textContent=`${state.projectName||'未命名项目'} · ${modeLabel} `;
  const previewTip=$('#previewTip');
  if(previewTip)previewTip.innerHTML='<kbd>左键拖动</kbd> 360度查看 · <kbd>Alt + 左键</kbd> 平移视角 · <kbd>滚轮</kbd> 缩放照片 <span>·</span> <kbd>双击</kbd> 选中并替换';
  $('#slotMinus').disabled=false;$('#slotPlus').disabled=false;
  syncCardSizeControls();syncViewControls();syncVisualControls();
  if(curved){normalizeCurvedGrid(state.rows,state.columns,'rows');syncCurvedControls();fitCamera(true)}else if(grid){normalizeCurvedGrid(state.rows,state.columns,'rows');syncGridControls();fitCamera(true)}else{syncRingControls();fitCamera(true)}
  updateTransforms();
}
async function setMode(mode){
  if(mode===state.mode)return;
  const job=++modeSwitchJob;stage.classList.add('project-loading');
  // A render may already have queued a debounced project save. Cancel it
  // while the async photo set is switching so an older mode cannot overwrite
  // the final mode selected by a fast sequence of clicks.
  clearTimeout(projectSaveTimer);projectSaveTimer=null;
  saveActivePhotoSet(state.mode);
  saveModeSettings(state.mode);
  state.mode=mode;
  loadPhotoSet(mode,state.count);
  cards.forEach((card,index)=>{if(card)releaseCard(card);cards[index]=null});
  cards.length=state.count;
  applyModeSettings(mode);
  if(isCurvedMode(mode)){normalizeCurvedGrid(state.rows,state.columns,'rows');syncCurvedControls()}
  if(isGridMode(mode)){normalizeCurvedGrid(state.rows,state.columns,'rows');syncGridControls()}
  updateSlots();await syncPhotoSlots();
  if(job!==modeSwitchJob)return;
  updateModeUI();stage.classList.remove('project-loading');render();scheduleProjectSave();
}
const PRESETS_STORAGE_KEY='photo-wall-presets-v1';
const PROJECTS_STORAGE_KEY='photo-wall-projects-v1';
const CURRENT_PROJECT_KEY='photo-wall-current-project-v1';
const PROJECT_ISOLATION_MIGRATION_KEY='photo-wall-projects-isolated-v10';
const PHOTO_DB_NAME='photo-wall-assets-v1',PHOTO_DB_VERSION=1,PHOTO_STORE='images';
let photoDbPromise=null;
const pendingAssetWrites=new Map();
let projects=[];
let projectSaveTimer=null;
let isLoadingProject=true;
let renameEditingId=null;
function makeId(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function openPhotoDb(){
  if(photoDbPromise)return photoDbPromise;
  photoDbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(PHOTO_DB_NAME,PHOTO_DB_VERSION);
    request.onupgradeneeded=()=>request.result.createObjectStore(PHOTO_STORE);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB unavailable'));
  });
  return photoDbPromise;
}
function savePhotoAsset(assetId,file){
  const write=openPhotoDb().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put({blob:file,name:file.name,type:file.type},assetId);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('图片保存失败'));
  }));
  pendingAssetWrites.set(assetId,write.finally(()=>pendingAssetWrites.delete(assetId)));return write;
}
function readPhotoAsset(assetId){
  return openPhotoDb().then(db=>new Promise((resolve,reject)=>{
    const request=db.transaction(PHOTO_STORE,'readonly').objectStore(PHOTO_STORE).get(assetId);
    request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error||new Error('图片读取失败'));
  }));
}
function readProjects(){
  try{const value=JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return []}
}
function writeProjects(){
  try{localStorage.setItem(PROJECTS_STORAGE_KEY,JSON.stringify(projects));return true}catch{notify('浏览器存储空间不足，项目未保存');return false}
}
function deletePhotoAssets(assetIds){
  const ids=[...new Set(assetIds.filter(Boolean))];if(!ids.length)return Promise.resolve();
  return openPhotoDb().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(PHOTO_STORE,'readwrite'),store=tx.objectStore(PHOTO_STORE);ids.forEach(id=>store.delete(id));
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('图片缓存删除失败'));
  }));
}
function decodeImageBlob(blob){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(blob),image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('图片解码失败'))};
    image.src=url;
  });
}
async function createPreviewObjectUrl(blob,maxDimension){
  if(!blob||!maxDimension)return null;
  let source=null;
  try{
    source=typeof createImageBitmap==='function'?await createImageBitmap(blob):await decodeImageBlob(blob);
    const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight,longest=Math.max(width,height);
    if(!width||!height||longest<=maxDimension)return null;
    const scale=maxDimension/longest,canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,0,0,canvas.width,canvas.height);
    // Use lossless PNG for the downsampled preview so the quality switch does
    // not introduce the color shift that lossy WebP encoding can cause.
    const previewBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    return previewBlob?URL.createObjectURL(previewBlob):null;
  }catch{return null}
  finally{source?.close?.()}
}
async function createPreviewBitmap(blob,maxDimension=null){
  if(!blob||typeof createImageBitmap!=='function')return null;
  let source=null;
  try{
    source=await createImageBitmap(blob);
    const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
    if(!width||!height)return null;
    if(!maxDimension||Math.max(width,height)<=maxDimension)return source;
    const scale=maxDimension/Math.max(width,height);
    const resized=await createImageBitmap(blob,{resizeWidth:Math.max(1,Math.round(width*scale)),resizeHeight:Math.max(1,Math.round(height*scale)),resizeQuality:'high'});
    source.close?.();source=null;return resized;
  }catch{return null}
  finally{source?.close?.()}
}
async function createPreviewCanvas(blob,maxDimension=null){
  if(!blob)return null;
  let source=null;
  try{
    source=typeof createImageBitmap==='function'?await createImageBitmap(blob):await decodeImageBlob(blob);
    const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
    if(!width||!height)return null;
    const scale=maxDimension&&Math.max(width,height)>maxDimension?maxDimension/Math.max(width,height):1;
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,0,0,canvas.width,canvas.height);
    return canvas;
  }catch{return null}
  finally{source?.close?.()}
}
async function setPhotoPreviewSource(photo,quality=previewQuality){
  if(!photo?.fullSrc||!photo.blob)return;
  photo.previewUrls??={};
  photo.previewBitmaps??={};
  photo.previewCanvases??={};
  const maxDimension=PREVIEW_QUALITY_LEVELS[quality]?.maxDimension||null;
  if(!photo.previewCanvases[quality]&&!photo.previewBitmaps[quality]&&!photo.previewUrls[quality]){
    photo.previewCanvases[quality]=await createPreviewCanvas(photo.blob,maxDimension);
    if(!photo.previewCanvases[quality])photo.previewBitmaps[quality]=await createPreviewBitmap(photo.blob,maxDimension);
    if(!photo.previewCanvases[quality]&&!photo.previewBitmaps[quality]&&quality!=='original'){
      photo.previewUrls[quality]=await createPreviewObjectUrl(photo.blob,maxDimension)||photo.fullSrc;
    }
  }
  // Keep src as the full object URL for thumbnails, persistence and export.
  // The active canvas texture is selected by setCardPhoto instead.
  photo.src=photo.fullSrc;
}
function captureProjectThumbnail(){
  try{
    const source=renderer.domElement;if(!source.width||!source.height)return null;
    const maxWidth=180,scale=Math.min(1,maxWidth/source.width),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
    const context=canvas.getContext('2d');context.drawImage(source,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',.72);
  }catch{return null}
}
function projectPhotoRef(photo){
  if(!photo)return null;
  return {src:photo.assetId?null:photo.src||'',assetId:photo.assetId||null,name:photo.name||'',sample:Boolean(photo.sample),imageScale:photo.imageScale,imageOffsetX:photo.imageOffsetX,imageOffsetY:photo.imageOffsetY};
}
function clonePhotoRef(photo){return photo?{...photo}:null}
function fillPhotoRefs(existing,count){
  const photos=Array.isArray(existing)?existing.map(clonePhotoRef):[];
  const target=Math.max(3,Math.min(72,Math.max(photos.length,count||0)));
  for(let index=photos.length;index<target;index++)photos.push({src:samplePhoto(index),name:`示例照片 ${String(index+1).padStart(2,'0')}`,sample:true});
  return photos;
}
function projectPhotoSets(project){
  const legacy=Array.isArray(project?.photos)?project.photos:[];
  const saved=project?.photosByMode&&typeof project.photosByMode==='object'?project.photosByMode:{};
  const fallback=legacy.map(clonePhotoRef);
  const sets={};
  PHOTO_MODES.forEach(mode=>{
    const source=Array.isArray(saved[mode])?saved[mode]:fallback;
    sets[mode]=source.map(clonePhotoRef);
  });
  return sets;
}
function persistPhotoSets(project){
  saveActivePhotoSet(state.mode);
  const sets={};
  PHOTO_MODES.forEach(mode=>{sets[mode]=(state.photosByMode[mode]||[]).map(projectPhotoRef)});
  project.photosByMode=sets;project.photoSetsVersion=PHOTO_SETS_VERSION;
  // Keep the legacy field populated for older projects and project list UI.
  project.photos=sets[state.mode]||sets.ring||[];
  return sets;
}
function sampleProjectPhotos(count){
  return Array.from({length:Math.max(0,count)},(_,index)=>({src:samplePhoto(index),name:`示例照片 ${String(index+1).padStart(2,'0')}`,sample:true}));
}
function hasProjectPhotos(refs){return Array.isArray(refs)&&refs.some(Boolean)}
function ensureProjectDefaults(){
  let changed=false;
  projects.forEach(project=>{
    const photoSets=projectPhotoSets(project);
    const existing=photoSets.ring.length?photoSets.ring:(Array.isArray(project.photos)?project.photos:[]);
    const count=Math.max(3,Math.min(72,existing.length||DEFAULT_PHOTO_COUNTS.ring));
    const photos=fillPhotoRefs(existing,count);
    const needsCurvedDefault=(project.photoSetsVersion||0)<PHOTO_SETS_VERSION;
    PHOTO_MODES.forEach(mode=>{
      const modePhotos=photoSets[mode];
      const target=(mode!=='ring'&&needsCurvedDefault)?DEFAULT_PHOTO_COUNTS[mode]:mode==='ring'?count:DEFAULT_PHOTO_COUNTS[mode];
      if(!modePhotos.length){photoSets[mode]=fillPhotoRefs(photos,target);changed=true}
      else if(mode!=='ring'&&needsCurvedDefault&&modePhotos.length<target){photoSets[mode]=fillPhotoRefs(modePhotos,target);changed=true}
      else if(modePhotos.length<3){photoSets[mode]=fillPhotoRefs(modePhotos,target);changed=true}
    });
    const ringPhotos=photoSets.ring;
    if(!hasProjectPhotos(ringPhotos)){photoSets.ring=photos.map(clonePhotoRef);changed=true}
    if(!project.photosByMode||project.photoSetsVersion!==PHOTO_SETS_VERSION){changed=true}
    if(changed){
      project.photosByMode=photoSets;project.photoSetsVersion=PHOTO_SETS_VERSION;project.photos=photoSets.ring;project.thumbnail=project.thumbnail||samplePhoto(0);project.updatedAt=Date.now();
    }
  });
  if(changed)writeProjects();
}
function photoKeys(item){
  if(!item)return [];
  const name=String(item.name||'');
  // Sample placeholders are safe to recreate in every project. Uploaded
  // files can come from older records that were incorrectly marked sample,
  // so only the generated placeholder names are ignored here.
  if(item.sample&&!item.assetId&&/^(示例照片|示例图片|sample\s*photo)/i.test(name))return [];
  const keys=[];if(item.assetId)keys.push(`asset:${item.assetId}`);if(name)keys.push(`name:${name}`);
  const src=String(item.src||'');if(src&&!src.startsWith('blob:'))keys.push(`src:${src}`);return keys;
}
function projectImageKeys(items){
  return new Set((items||[]).flatMap(item=>{
    return photoKeys(item);
  }).filter(Boolean));
}
function removeSharedPhotos(targetPhotos,sourcePhotos){
  const sourceKeys=projectImageKeys(sourcePhotos);if(sourceKeys.size<3)return {photos:targetPhotos,changed:false};
  let changed=false;const photos=(targetPhotos||[]).map(photo=>{
    if(!photo)return null;
    const duplicate=photoKeys(photo).some(key=>sourceKeys.has(key));
    if(duplicate){changed=true;return null}
    return photo;
  });
  return {photos,changed};
}
function photosOverlap(first,second){
  const a=projectImageKeys(first),b=projectImageKeys(second);if(a.size<3||b.size<3)return false;
  let overlap=0;a.forEach(id=>{if(b.has(id))overlap++});return overlap>=3;
}
function sharedProjectImages(first,second){
  if(photosOverlap(first,second))return true;
  const a=projectImageKeys(first),b=projectImageKeys(second);
  return a.size>=3&&b.size>=3&&first?.thumbnail&&second?.thumbnail&&first.thumbnail===second.thumbnail;
}
function migrateSharedProjectImages(){
  if(localStorage.getItem(PROJECT_ISOLATION_MIGRATION_KEY))return;
  const currentId=localStorage.getItem(CURRENT_PROJECT_KEY);
  const ordered=projects.slice().sort((a,b)=>{
    if(a.id===currentId)return -1;if(b.id===currentId)return 1;return (a.createdAt||0)-(b.createdAt||0);
  });
  const kept=[];let changed=false;
  ordered.forEach(project=>{
    if(!project.photos?.length||projectImageKeys(project.photos).size<3)return;
    const previous=kept.filter(item=>sharedProjectImages(item.photos,project.photos));
    if(previous.length){
      const sourcePhotos=previous.flatMap(item=>item.photos||[]),result=removeSharedPhotos(project.photos,sourcePhotos);
      if(result.changed){project.photos=result.photos;project.thumbnail=null;project.updatedAt=Date.now();changed=true}
    }
    kept.push(project);
  });
  if(changed)writeProjects();localStorage.setItem(PROJECT_ISOLATION_MIGRATION_KEY,'1');
}
function cloneModeSettings(settings){return {...settings,cameraTarget:Array.isArray(settings?.cameraTarget)?[...settings.cameraTarget]:[0,0,0]}}
function captureProjectSettings(){
  saveModeSettings(state.mode);
  return {
    mode:state.mode,width:state.width,height:state.height,resolutionPreset:state.resolutionPreset||DEFAULT_RESOLUTION_PRESET,ratioWidth:state.ratioWidth,ratioHeight:state.ratioHeight,cardSizeVersion:1,cardWidth:state.cardWidth,cardHeight:state.cardHeight,modeSettingsVersion:MODE_SETTINGS_VERSION,
    background:`#${scene.background?.getHexString?.()||'101014'}`,
    modeSettings:{ring:cloneModeSettings(modeSettings.ring),bloom:cloneModeSettings(modeSettings.bloom),curved:cloneModeSettings(modeSettings.curved),curvedHorizontal:cloneModeSettings(modeSettings.curvedHorizontal),grid:cloneModeSettings(modeSettings.grid)},
  };
}
function defaultProjectSettings(){
  const ring=createModeSettings('ring'),curved=createModeSettings('curved'),curvedHorizontal=createModeSettings('curvedHorizontal'),grid=createModeSettings('grid');
  const bloom=createModeSettings('bloom');
  return {mode:'ring',width:1920,height:1080,resolutionPreset:DEFAULT_RESOLUTION_PRESET,ratioWidth:16,ratioHeight:9,cardWidth:DEFAULT_CARD_WIDTH,cardHeight:DEFAULT_CARD_HEIGHT,background:'#101014',modeSettingsVersion:MODE_SETTINGS_VERSION,modeSettings:{ring:cloneModeSettings(ring),bloom:cloneModeSettings(bloom),curved:cloneModeSettings(curved),curvedHorizontal:cloneModeSettings(curvedHorizontal),grid:cloneModeSettings(grid)}};
}
function applyProjectSettings(settings){
  const defaults=defaultProjectSettings(),source=settings||defaults;
  state.width=Number.isFinite(source.width)?source.width:defaults.width;state.height=Number.isFinite(source.height)?source.height:defaults.height;
  state.resolutionPreset=RESOLUTION_PRESETS[source.resolutionPreset]?source.resolutionPreset:DEFAULT_RESOLUTION_PRESET;
  const sourceRatio=Number.isFinite(Number(source.ratioWidth))&&Number.isFinite(Number(source.ratioHeight))?{width:source.ratioWidth,height:source.ratioHeight}:ratioPartsForDimensions(state.width,state.height);
  state.ratioWidth=clampRatioValue(sourceRatio.width,16);state.ratioHeight=clampRatioValue(sourceRatio.height,9);
  const hasCardSize=source.cardSizeVersion===1&&Number.isFinite(Number(source.cardWidth))&&Number.isFinite(Number(source.cardHeight));
  state.cardWidth=hasCardSize?THREE.MathUtils.clamp(Number(source.cardWidth),40,600):defaults.cardWidth;
  state.cardHeight=hasCardSize?THREE.MathUtils.clamp(Number(source.cardHeight),40,800):defaults.cardHeight;
  if(typeof source.background==='string')scene.background.set(source.background);
  const background=`#${scene.background?.getHexString?.()||'101014'}`;if($('#bgColorInput')){$('#bgColorInput').value=background;$('.color-code').textContent=background.toUpperCase();$('.color-swatch').style.background=background}
  const saved=source.modeSettings||{};
  PHOTO_MODES.forEach(mode=>{
    const base=createModeSettings(mode),savedSettings=saved[mode]||saved[mode==='curvedHorizontal'?'curved':mode]||{};
    const merged={...base,...savedSettings,cameraTarget:Array.isArray(savedSettings.cameraTarget)?[...savedSettings.cameraTarget]:[...base.cameraTarget]};
    if(mode==='grid'&&(source.modeSettingsVersion||0)<17){
      const oldGridDefaults={rows:3,columns:8,columnGap:28,gridStagger:0,gridStaggerDirection:'horizontal',corner:20,zoom:100,tiltZ:0,gridTiltZ:0};
      const untouched=Object.entries(oldGridDefaults).every(([key,value])=>{
        const actual=savedSettings[key];
        return typeof value==='number'?Number(actual)===value:actual===value;
      });
      if(untouched)Object.assign(merged,base,{cameraTarget:[...base.cameraTarget]});
    }
    // The grid wall used a dedicated Z-only value before the three-axis
    // control was introduced. Carry that value into the new Z memory once,
    // while leaving newer per-axis settings untouched.
    if(mode==='grid'&&Object.prototype.hasOwnProperty.call(savedSettings,'gridTiltZ')&&
      ((source.modeSettingsVersion||0)<16||!Object.prototype.hasOwnProperty.call(savedSettings,'tiltZ'))){
      const legacyGridTilt=Number(savedSettings.gridTiltZ);
      if(Number.isFinite(legacyGridTilt))merged.tiltZ=legacyGridTilt;
    }
    // Projects from before per-axis tilt stored only wallTilt. Carry that
    // value into X once, while leaving the new Y/Z memories independent.
    if(!Object.prototype.hasOwnProperty.call(savedSettings,'tiltX')){
      const legacyTilt=Number(savedSettings.wallTilt);
      if(Number.isFinite(legacyTilt))merged.tiltX=legacyTilt;
    }
    if(!Object.prototype.hasOwnProperty.call(savedSettings,'tiltY'))merged.tiltY=0;
    if(!Object.prototype.hasOwnProperty.call(savedSettings,'tiltZ'))merged.tiltZ=0;
    modeSettings[mode]=merged;
  });
  // Projects created before the stagger control existed should retain the
  // original half-step look instead of inheriting an undefined or migrated value.
  if(source.modeSettingsVersion!==MODE_SETTINGS_VERSION){modeSettings.curved.stagger=50;modeSettings.curvedHorizontal.stagger=50}
  if((source.modeSettingsVersion||0)<11)modeSettings.curvedHorizontal=createModeSettings('curvedHorizontal');
  if((source.modeSettingsVersion||0)<12)modeSettings.curvedHorizontal=createModeSettings('curvedHorizontal');
  // The first bloom implementation inherited the curved ring's plane and
  // tilt defaults. Reset only those newly introduced bloom settings so old
  // projects adopt the stable level, Y-aligned layout.
  if((source.modeSettingsVersion||0)<21)modeSettings.bloom=createModeSettings('bloom');
  if((source.modeSettingsVersion||0)<22){
    const bloomDefaults=createModeSettings('bloom');
    ['tilt','fov','zoom','viewOffsetX','viewOffsetY','cameraTarget'].forEach(key=>{
      modeSettings.bloom[key]=Array.isArray(bloomDefaults[key])?[...bloomDefaults[key]]:bloomDefaults[key];
    });
  }
  if((source.modeSettingsVersion||0)<23){
    const bloomDefaults=createModeSettings('bloom');
    ['radius','wallTilt','tiltAxis','tiltX','tiltY','tiltZ'].forEach(key=>{modeSettings.bloom[key]=bloomDefaults[key]});
  }
  if((source.modeSettingsVersion||0)<24)modeSettings.bloom.tiltX=createModeSettings('bloom').tiltX;
  state.mode=source.mode==='curvedHorizontal'?'curvedHorizontal':source.mode==='curved'?'curved':source.mode==='grid'?'grid':source.mode==='bloom'?'bloom':'ring';applyModeSettings(state.mode);
}
function saveCurrentProject(){
  if(!state.projectId||isLoadingProject)return;
  const project=projects.find(item=>item.id===state.projectId);if(!project)return;
  project.name=state.projectName||project.name||'未命名项目';project.updatedAt=Date.now();persistPhotoSets(project);project.settings=captureProjectSettings();project.thumbnail=captureProjectThumbnail()||project.thumbnail||null;writeProjects();renderProjectList();
}
function scheduleProjectSave(){
  if(!state.projectId||isLoadingProject||renameEditingId)return;
  clearTimeout(projectSaveTimer);projectSaveTimer=setTimeout(saveCurrentProject,180);
}
function beginInteractivePreview(){
  if(previewQuality!=='original')return;
  clearTimeout(interactivePreviewTimer);interactivePreviewTimer=null;
  if(interactivePreviewQuality==='standard')return;
  interactivePreviewQuality='standard';
  const job=++interactivePreviewJob,photos=state.photos.filter(photo=>photo?.fullSrc&&photo?.blob);
  Promise.all(photos.map(photo=>setPhotoPreviewSource(photo,'standard'))).then(()=>{
    if(job!==interactivePreviewJob||previewQuality!=='original'||interactivePreviewQuality!=='standard')return;
    refreshPhotoTextures();
  }).catch(()=>{});
}
function endInteractivePreview(){
  if(previewQuality!=='original'||interactivePreviewQuality!=='standard')return;
  clearTimeout(interactivePreviewTimer);
  interactivePreviewTimer=setTimeout(()=>{
    interactivePreviewTimer=null;
    interactivePreviewQuality=null;
    const job=++interactivePreviewJob,photos=state.photos.filter(photo=>photo?.fullSrc&&photo?.blob);
    Promise.all(photos.map(photo=>setPhotoPreviewSource(photo,'original'))).then(()=>{
      if(job!==interactivePreviewJob||previewQuality!=='original'||interactivePreviewQuality)return;
      refreshPhotoTextures();
    }).catch(()=>{});
  },220);
}
async function applyPreviewQuality(value){
  if(!PREVIEW_QUALITY_LEVELS[value])return;
  previewQuality=value;try{localStorage.setItem(PREVIEW_QUALITY_KEY,value)}catch{}
  syncPreviewQualityControl(value);
  const job=++previewQualityJob,photos=state.photos.filter(photo=>photo?.fullSrc&&photo?.blob);
  if(!photos.length){notify(`预览精度：${PREVIEW_QUALITY_LEVELS[value].label}`);return}
  notify(`正在切换预览精度：${PREVIEW_QUALITY_LEVELS[value].label}`);
  await Promise.all(photos.map(photo=>setPhotoPreviewSource(photo,value)));
  if(job!==previewQualityJob)return;
  refreshPhotoTextures();
  // Warm the lightweight texture in the background so the first drag after
  // choosing original quality can switch immediately.
  if(value==='original')Promise.all(photos.map(photo=>setPhotoPreviewSource(photo,'standard'))).catch(()=>{});
  notify(`预览精度：${PREVIEW_QUALITY_LEVELS[value].label}`);
}
function syncPreviewQualityControl(value=previewQuality){
  const label=$('#previewQualityLabel');if(label)label.textContent=PREVIEW_QUALITY_LEVELS[value]?.label||PREVIEW_QUALITY_LEVELS.standard.label;
  document.querySelectorAll('[data-preview-quality]').forEach(option=>option.setAttribute('aria-selected',String(option.dataset.previewQuality===value)));
}
async function switchToFullResolutionTextures(){
  const jobs=[];
  state.photos.forEach((photo,index)=>{
    if(!photo?.fullSrc||!photo?.blob)return;
    jobs.push(setPhotoPreviewSource(photo,'original').then(()=>setCardPhoto(index,photo.fullSrc)));
  });
  await Promise.all(jobs);
}
async function restorePreviewTextures(){
  const jobs=[];
  state.photos.forEach((photo,index)=>{if(photo?.src)jobs.push(setPhotoPreviewSource(photo,previewQuality).then(()=>setCardPhoto(index)))});
  await Promise.all(jobs);
}
function revokePhotoUrlsFor(photo){
  const urls=new Set([photo?.objectUrl,photo?.fullObjectUrl,...Object.values(photo?.previewUrls||{})]);
  urls.forEach(url=>{if(typeof url==='string'&&url.startsWith('blob:'))URL.revokeObjectURL(url)});
  Object.values(photo?.previewBitmaps||{}).forEach(bitmap=>bitmap?.close?.());
}
function revokePhotoUrls(){
  const seen=new Set();
  PHOTO_MODES.forEach(mode=>(state.photosByMode?.[mode]||[]).forEach(photo=>{if(photo&&!seen.has(photo)){seen.add(photo);revokePhotoUrlsFor(photo)}}));
  state.photos.forEach(photo=>{if(photo&&!seen.has(photo)){seen.add(photo);revokePhotoUrlsFor(photo)}});
}
async function hydrateProjectPhotos(photoRefs,count=state.count){
  const sampleFallback=index=>({src:samplePhoto(index),name:`示例照片 ${String(index+1).padStart(2,'0')}`,sample:true});
  return Promise.all(Array.from({length:count},async(_,index)=>{
    const photo=photoRefs?.[index];if(!photo)return sampleFallback(index);
    if(photo.assetId){
      const stored=await readPhotoAsset(photo.assetId).catch(()=>null);
      if(!stored)return sampleFallback(index);
      const url=URL.createObjectURL(stored.blob),hydrated={src:url,objectUrl:url,fullSrc:url,fullObjectUrl:url,blob:stored.blob,previewUrls:{},previewBitmaps:{},previewCanvases:{},assetId:photo.assetId,name:photo.name||stored.name||`槽位 ${index+1}`,imageScale:photo.imageScale,imageOffsetX:photo.imageOffsetX,imageOffsetY:photo.imageOffsetY};
      await setPhotoPreviewSource(hydrated);if(previewQuality==='original')setPhotoPreviewSource(hydrated,'standard').catch(()=>{});return hydrated;
    }
    return photo.src?{src:photo.src,name:photo.name||`槽位 ${index+1}`,sample:Boolean(photo.sample),imageScale:photo.imageScale,imageOffsetX:photo.imageOffsetX,imageOffsetY:photo.imageOffsetY}:sampleFallback(index);
  }));
}
function createProjectResetButton(project){
  const reset=document.createElement('button');reset.type='button';reset.className='project-row-reset';reset.dataset.projectReset=project.id;reset.title=`重置项目：${project.name||'未命名项目'}`;reset.setAttribute('aria-label',reset.title);
  reset.innerHTML=`<svg class="reset-icon" viewBox="0 0 1024 1024" aria-hidden="true"><path d="${RESET_ICON_PATH}" fill="currentColor"></path></svg>`;
  return reset;
}
function renderProjectList(){
  const list=$('#projectList');if(!list)return;list.replaceChildren();
  if(!projects.length){const empty=document.createElement('div');empty.className='project-empty';empty.textContent='还没有项目';list.appendChild(empty);return}
  projects.forEach(project=>{
    const row=document.createElement('div');row.className=`project-row${project.id===state.projectId?' active':''}`;row.dataset.projectId=project.id;row.tabIndex=0;row.setAttribute('role','button');
    const icon=document.createElement('span');icon.className='project-row-icon';
    const image=document.createElement('img');image.src=project.thumbnail||samplePhoto(0);image.alt='';icon.appendChild(image);
    const copy=document.createElement('span');copy.className='project-row-copy';const name=document.createElement('b');name.dataset.projectName=project.id;name.title='点击重命名';name.textContent=project.name||'未命名项目';const meta=document.createElement('small');const projectMode=project.settings?.mode||'ring';const projectPhotos=project.photosByMode?.[projectMode]||project.photos||[];meta.textContent=`${projectPhotos.filter(Boolean).length} 张图片`;copy.append(name,meta);
    const reset=createProjectResetButton(project);
    const remove=document.createElement('button');remove.type='button';remove.className='project-row-delete';remove.dataset.projectDelete=project.id;remove.title=`删除项目：${project.name||'未命名项目'}`;remove.setAttribute('aria-label',remove.title);remove.innerHTML='<svg class="trash-icon" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M227.555556 312.888889m17.066666 0l534.755556 0q17.066667 0 17.066666 17.066667l0 0q0 17.066667-17.066666 17.066666l-534.755556 0q-17.066667 0-17.066666-17.066666l0 0q0-17.066667 17.066666-17.066667Z" fill="currentColor"></path><path d="M420.977778 233.244444m17.066666 0l147.911112 0q17.066667 0 17.066666 17.066667l0 0q0 17.066667-17.066666 17.066667l-147.911112 0q-17.066667 0-17.066666-17.066667l0 0q0-17.066667 17.066666-17.066667Z" fill="currentColor"></path><path d="M472.177778 455.111111m0 17.066667l0 142.222222q0 17.066667-17.066667 17.066667l0 0q-17.066667 0-17.066667-17.066667l0-142.222222q0-17.066667 17.066667-17.066667l0 0q17.066667 0 17.066667 17.066667Z" fill="currentColor"></path><path d="M585.955556 455.111111m0 17.066667l0 142.222222q0 17.066667-17.066667 17.066667l0 0q-17.066667 0-17.066667-17.066667l0-142.222222q0-17.066667 17.066667-17.066667l0 0q17.066667 0 17.066667 17.066667Z" fill="currentColor"></path><path d="M318.577778 335.644444v328.533334c0 49.737956 49.533156 91.517156 112.389689 92.427378l2.0992 0.017066h157.866666c63.146667 0 113.379556-41.233067 114.471823-90.794666l0.017066-1.649778V335.644444h34.133334v328.533334c0 69.961956-65.820444 125.457067-146.181689 126.560711l-2.440534 0.017067h-157.866666c-80.645689 0-147.279644-54.795378-148.599467-124.461512L284.444444 664.177778V335.644444h34.133334z" fill="currentColor"></path></svg>';
    row.append(icon,copy,reset,remove);list.appendChild(row);
  });
}
function beginProjectRename(projectId){
  if(renameEditingId)return;
  const project=projects.find(item=>item.id===projectId),nameNode=document.querySelector(`[data-project-name="${CSS.escape(projectId)}"]`);if(!project||!nameNode)return;
  renameEditingId=projectId;const input=document.createElement('input');input.className='project-name-edit';input.value=project.name||'';input.maxLength=32;input.setAttribute('aria-label','项目名称');nameNode.replaceWith(input);input.focus();input.select();
  let finished=false;const finish=save=>{if(finished)return;finished=true;renameEditingId=null;const next=input.value.trim();if(save&&next){project.name=next;project.updatedAt=Date.now();if(state.projectId===project.id){state.projectName=next;updateModeUI()}writeProjects()}renderProjectList()};
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();finish(true)}else if(event.key==='Escape'){event.preventDefault();finish(false)}});input.addEventListener('blur',()=>finish(true));
}
function closeProjectMenu(){const menu=$('#projectMenu');menu?.classList.remove('open');menu?.setAttribute('aria-hidden','true')}
async function initProjects(){
  projects=readProjects();
  migrateSharedProjectImages();
  if(!projects.length){const now=Date.now();const photoRefs=state.photos.map(projectPhotoRef);const photoSets={ring:photoRefs,bloom:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.bloom),curved:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.curved),curvedHorizontal:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.curvedHorizontal),grid:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.grid)};projects=[{id:makeId(),name:'默认项目',createdAt:now,updatedAt:now,photos:photoRefs,photosByMode:photoSets,photoSetsVersion:PHOTO_SETS_VERSION,settings:captureProjectSettings()}];writeProjects()}
  ensureProjectDefaults();
  let renamedDefault=false;
  projects.forEach(project=>{if(project.name==='示例项目'||project.name==='默认'||project.name==='隔离验证'){project.name='默认项目';project.updatedAt=Date.now();renamedDefault=true}});
  if(renamedDefault)writeProjects();
  const savedId=localStorage.getItem(CURRENT_PROJECT_KEY);const preferred=projects.find(item=>item.name==='默认项目');const first=preferred||projects.find(item=>item.id===savedId)||projects[0];state.projectId=first.id;state.projectName=first.name||'默认项目';localStorage.setItem(CURRENT_PROJECT_KEY,first.id);renderProjectList();
  const photoSets=projectPhotoSets(first);isLoadingProject=true;applyProjectSettings(first.settings||defaultProjectSettings());
  const desired=Math.max(3,Math.min(72,(photoSets[state.mode]||[]).length||first.photos?.length||state.count||12));
  PHOTO_MODES.forEach(mode=>{if(!photoSets[mode]?.length)photoSets[mode]=sampleProjectPhotos(desired).map(projectPhotoRef)});
  state.photosByMode={};
  for(const mode of PHOTO_MODES){const refs=photoSets[mode];state.photosByMode[mode]=await hydrateProjectPhotos(refs,Math.max(3,Math.min(72,refs.length||desired)))}
  loadPhotoSet(state.mode,desired);state.count=state.photos.length;cards.length=state.count;state.selected=0;updateDimensionUI();updateSlots();await syncPhotoSlots();isLoadingProject=false;stage.classList.remove('project-loading');updateModeUI();renderProjectList();render();
}
async function switchProject(projectId){
  const project=projects.find(item=>item.id===projectId);if(!project||project.id===state.projectId){closeProjectMenu();return}
  stage.classList.add('project-loading');
  // Keep legacy records isolated too: a project that still points at the
  // current project's uploaded images starts with empty slots on first switch.
  if(project.photos?.length&&sharedProjectImages(project.photos,state.photos.map(projectPhotoRef))){
    const result=removeSharedPhotos(project.photos,state.photos.map(projectPhotoRef));
    if(result.changed){project.photos=result.photos;project.photosByMode?.ring&&(project.photosByMode.ring=result.photos);project.thumbnail=null;project.updatedAt=Date.now();writeProjects()}
  }
  clearTimeout(projectSaveTimer);projectSaveTimer=null;saveCurrentProject();await Promise.allSettled([...pendingAssetWrites.values()]);revokePhotoUrls();cards.forEach(card=>{if(card)releaseCard(card)});cards.length=0;isLoadingProject=true;state.projectId=project.id;state.projectName=project.name||'未命名项目';applyProjectSettings(project.settings||defaultProjectSettings());
  const photoSets=projectPhotoSets(project);const desired=Math.max(3,Math.min(72,(photoSets[state.mode]||[]).length||project.photos?.length||state.count||12));
  PHOTO_MODES.forEach(mode=>{if(!photoSets[mode]?.length)photoSets[mode]=sampleProjectPhotos(desired).map(projectPhotoRef)});
  state.photosByMode={};
  for(const mode of PHOTO_MODES){const refs=photoSets[mode];state.photosByMode[mode]=await hydrateProjectPhotos(refs,Math.max(3,Math.min(72,refs.length||desired)))}
  loadPhotoSet(state.mode,desired);state.count=state.photos.length;cards.length=state.count;localStorage.setItem(CURRENT_PROJECT_KEY,state.projectId);state.selected=0;updateDimensionUI();updateSlots();await syncPhotoSlots();isLoadingProject=false;stage.classList.remove('project-loading');updateModeUI();renderProjectList();render();closeProjectMenu();notify(`已切换项目：${state.projectName}`)
}
function createProject(name){
  saveCurrentProject();const trimmed=name.trim();const now=Date.now();const photoRefs=sampleProjectPhotos(state.count).map(projectPhotoRef);const photoSets={ring:photoRefs,bloom:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.bloom),curved:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.curved),curvedHorizontal:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.curvedHorizontal),grid:fillPhotoRefs(photoRefs,DEFAULT_PHOTO_COUNTS.grid)};const project={id:makeId(),name:trimmed||`未命名项目 ${projects.length+1}`,createdAt:now,updatedAt:now,photos:photoRefs,photosByMode:photoSets,photoSetsVersion:PHOTO_SETS_VERSION,settings:captureProjectSettings()};projects.unshift(project);writeProjects();switchProject(project.id)
}
async function resetProject(projectId){
  const project=projects.find(item=>item.id===projectId);if(!project)return;
  const defaults=defaultProjectSettings(),oldPhotoSets=projectPhotoSets(project),assetIds=PHOTO_MODES.flatMap(mode=>(oldPhotoSets[mode]||[]).map(photo=>photo?.assetId).filter(Boolean));
  const otherAssetIds=new Set(projects.filter(item=>item.id!==projectId).flatMap(item=>PHOTO_MODES.flatMap(mode=>(projectPhotoSets(item)[mode]||[]).map(photo=>photo?.assetId).filter(Boolean))));
  await Promise.allSettled(assetIds.map(id=>pendingAssetWrites.get(id)).filter(Boolean));
  await deletePhotoAssets(assetIds.filter(id=>!otherAssetIds.has(id))).catch(()=>notify('项目已重置，但部分图片缓存清理失败'));
  const resetRefs=sampleProjectPhotos(12).map(projectPhotoRef),resetSets={ring:resetRefs,bloom:fillPhotoRefs(resetRefs,DEFAULT_PHOTO_COUNTS.bloom),curved:fillPhotoRefs(resetRefs,DEFAULT_PHOTO_COUNTS.curved),curvedHorizontal:fillPhotoRefs(resetRefs,DEFAULT_PHOTO_COUNTS.curvedHorizontal),grid:fillPhotoRefs(resetRefs,DEFAULT_PHOTO_COUNTS.grid)};project.settings=defaults;project.photos=resetRefs;project.photosByMode=resetSets;project.photoSetsVersion=PHOTO_SETS_VERSION;project.thumbnail=samplePhoto(0);project.updatedAt=Date.now();writeProjects();
  if(state.projectId===projectId){
    clearTimeout(projectSaveTimer);projectSaveTimer=null;revokePhotoUrls();cards.forEach(card=>{if(card)releaseCard(card)});cards.length=0;
    isLoadingProject=true;applyProjectSettings(defaults);state.mode='ring';state.count=12;state.ringCount=12;state.photos=sampleProjectPhotos(12);state.photosByMode={ring:state.photos,bloom:fillPhotoRefs(state.photos,DEFAULT_PHOTO_COUNTS.bloom),curved:fillPhotoRefs(state.photos,DEFAULT_PHOTO_COUNTS.curved),curvedHorizontal:fillPhotoRefs(state.photos,DEFAULT_PHOTO_COUNTS.curvedHorizontal),grid:fillPhotoRefs(state.photos,DEFAULT_PHOTO_COUNTS.grid)};state.selected=0;isLoadingProject=false;
    updateDimensionUI();updateSlots();syncPhotoSlots();updateModeUI();project.thumbnail=captureProjectThumbnail();writeProjects();
  }
  renderProjectList();notify(`已重置项目：${project.name||'未命名项目'}`);
}
async function deleteProject(projectId){
  const project=projects.find(item=>item.id===projectId);if(!project)return;
  if(projects.length<=1){notify('至少保留一个项目');return}
  if(!window.confirm(`确定删除项目“${project.name||'未命名项目'}”及其缓存图片吗？`))return;
  // A legacy project can still reference an asset that another project uses.
  // Keep shared assets alive and only remove files that become unreachable.
  const otherAssetIds=new Set(projects.filter(item=>item.id!==projectId).flatMap(item=>PHOTO_MODES.flatMap(mode=>(projectPhotoSets(item)[mode]||[]).map(photo=>photo?.assetId).filter(Boolean))));
  const assetIds=PHOTO_MODES.flatMap(mode=>(projectPhotoSets(project)[mode]||[]).map(photo=>photo?.assetId).filter(id=>id&&!otherAssetIds.has(id)));
  await Promise.allSettled(assetIds.map(id=>pendingAssetWrites.get(id)).filter(Boolean));
  try{await deletePhotoAssets(assetIds)}catch{notify('项目已删除，但部分图片缓存清理失败')}
  projects=projects.filter(item=>item.id!==projectId);writeProjects();
  if(state.projectId===projectId){const next=projects.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];state.projectId=null;await switchProject(next.id)}else{renderProjectList();notify(`已删除项目：${project.name||'未命名项目'}`)}
}
initProjects().catch(()=>{isLoadingProject=false;stage.classList.remove('project-loading');notify('项目图片读取失败，请重新打开项目')});
function readSavedPresets(){
  try{const value=JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return []}
}
function writeSavedPresets(presets){try{localStorage.setItem(PRESETS_STORAGE_KEY,JSON.stringify(presets));return true}catch{notify('浏览器存储空间不足，预设未保存');return false}}
function presetModeLabel(mode){return mode==='grid'?'网格墙':mode==='bloom'?'环形绽放':mode==='curvedHorizontal'?'左右弧形墙':mode==='curved'?'上下弧形墙':'环绕弯曲'}
function renderSavedPresets(){
  const list=$('#savedPresets');if(!list)return;list.replaceChildren();
  const presets=readSavedPresets();
  if(!presets.length){const empty=document.createElement('div');empty.className='saved-presets-empty';empty.textContent='还没有保存的预设';list.appendChild(empty);return}
  presets.forEach(preset=>{
    const row=document.createElement('div');row.className='saved-preset-row';row.dataset.presetId=preset.id;
    const copy=document.createElement('div');copy.className='saved-preset-copy';
    const name=document.createElement('b');name.textContent=preset.name||'未命名预设';
    const meta=document.createElement('small');meta.textContent=presetModeLabel(preset.mode);
    copy.append(name,meta);
    const load=document.createElement('button');load.type='button';load.dataset.presetAction='load';load.textContent='恢复';
    const reset=createProjectResetButton(project);
    const remove=document.createElement('button');remove.type='button';remove.dataset.presetAction='delete';remove.textContent='删除';
    row.append(copy,load,remove);list.appendChild(row);
  });
}
function createPreset(name){
  saveModeSettings(state.mode);
  return {
    id:makeId(),
    name:name.trim(),createdAt:Date.now(),mode:state.mode,width:state.width,height:state.height,resolutionPreset:state.resolutionPreset,ratioWidth:state.ratioWidth,ratioHeight:state.ratioHeight,cardSizeVersion:1,cardWidth:state.cardWidth,cardHeight:state.cardHeight,
    background:`#${scene.background?.getHexString?.()||'101014'}`,
    settings:{...modeSettings[state.mode],cameraTarget:[...modeSettings[state.mode].cameraTarget]},
  };
}
function restorePreset(preset){
  if(!preset||!['ring','curved','curvedHorizontal','grid'].includes(preset.mode)||!preset.settings)return;
  const defaults=createModeSettings(preset.mode);
  modeSettings[preset.mode]={...defaults,...preset.settings,cameraTarget:Array.isArray(preset.settings.cameraTarget)?preset.settings.cameraTarget:[0,0,0]};
  if(Number.isFinite(preset.width)&&Number.isFinite(preset.height)){state.width=preset.width;state.height=preset.height;const ratio=Number.isFinite(preset.ratioWidth)&&Number.isFinite(preset.ratioHeight)?{width:preset.ratioWidth,height:preset.ratioHeight}:ratioPartsForDimensions(state.width,state.height);state.ratioWidth=clampRatioValue(ratio.width,16);state.ratioHeight=clampRatioValue(ratio.height,9)}
  if(preset.cardSizeVersion===1&&Number.isFinite(preset.cardWidth))state.cardWidth=THREE.MathUtils.clamp(preset.cardWidth,40,600);
  if(preset.cardSizeVersion===1&&Number.isFinite(preset.cardHeight))state.cardHeight=THREE.MathUtils.clamp(preset.cardHeight,40,800);
  if(typeof preset.background==='string')scene.background.set(preset.background);
  if(preset.mode!==state.mode)setMode(preset.mode);else applyModeSettings(preset.mode);
  if(isCurvedMode(preset.mode)){normalizeCurvedGrid(state.rows,state.columns,'rows');syncCurvedControls()}
  if(isGridMode(preset.mode)){normalizeCurvedGrid(state.rows,state.columns,'rows');syncGridControls()}
  state.selected=0;updateDimensionUI();updateSlots();syncPhotoSlots();updateModeUI();notify(`已恢复预设：${preset.name||'未命名预设'}`);
}
$('#savePresetButton').addEventListener('click',async()=>{
  const defaultName=state.mode==='grid'?'网格墙预设':state.mode==='bloom'?'环形绽放预设':state.mode==='ring'?'环绕弯曲预设':state.mode==='curvedHorizontal'?'左右弧形墙预设':'上下弧形墙预设';
  const input=$('#presetNameInput');const name=input.value.trim()||defaultName;
  const button=$('#savePresetButton');button.disabled=true;
  try{
    await Promise.all(state.photos.map(photo=>photo?.assetId?pendingAssetWrites.get(photo.assetId):null).filter(Boolean));
    const presets=[createPreset(name),...readSavedPresets()].slice(0,20);if(!writeSavedPresets(presets))return;input.value='';renderSavedPresets();notify(`已保存预设：${name}`)
  }catch{notify('本地图片保存失败，请重试')}finally{button.disabled=false}
});
$('#savedPresets').addEventListener('click',event=>{
  const button=event.target.closest('button[data-preset-action]');if(!button)return;
  const row=button.closest('[data-preset-id]');const id=row?.dataset.presetId;const presets=readSavedPresets();const preset=presets.find(item=>item.id===id);if(!preset)return;
  if(button.dataset.presetAction==='load'){restorePreset(preset);return}
  writeSavedPresets(presets.filter(item=>item.id!==id));renderSavedPresets();notify('已删除预设')
});
renderSavedPresets();
async function loadFiles(fileList,start=pickerSlot){
  const files=[...fileList].filter(f=>f.type.startsWith('image/'));if(!files.length)return;
  if(files.length>state.count-start){
    const count=Math.min(72,start+files.length);if(count>state.count)setCount(count);
  }
  const selectedFiles=files.slice(0,state.count-start);notify(`正在生成预览（${PREVIEW_QUALITY_LEVELS[previewQuality].label}）`);
  for(let offset=0;offset<selectedFiles.length;offset++){
    const file=selectedFiles[offset],i=start+offset,old=state.photos[i];
    if(old)revokePhotoUrlsFor(old);
    const url=URL.createObjectURL(file),assetId=makeId(),photo={src:url,objectUrl:url,fullSrc:url,fullObjectUrl:url,blob:file,previewUrls:{},previewBitmaps:{},previewCanvases:{},assetId,file,name:file.name};
    await setPhotoPreviewSource(photo);if(previewQuality==='original')setPhotoPreviewSource(photo,'standard').catch(()=>{});state.photos[i]=photo;
    savePhotoAsset(assetId,file).catch(()=>notify('图片已加载，但浏览器保存失败'));
  }
  state.selected=start;updateSlots();syncPhotoSlots();scheduleProjectSave();notify(files.length===1?'图片已替换':`已读取 ${files.length} 张图片`)
}
async function clearAllImages(){
  const assetIds=state.photos.map(photo=>photo?.assetId).filter(Boolean);
  await Promise.allSettled(assetIds.map(id=>pendingAssetWrites.get(id)).filter(Boolean));
  await deletePhotoAssets(assetIds).catch(()=>notify('图片已清空，但部分缓存清理失败'));
  revokePhotoUrls();
  state.photos=sampleProjectPhotos(state.count);
  state.photosByMode[state.mode]=state.photos;
  state.selected=0;
  updateSlots();syncPhotoSlots();scheduleProjectSave();
  notify('已清空图片，已恢复示例图片占位');
}
function hitCard(event){const rect=renderer.domElement.getBoundingClientRect();const p=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(p,camera);return ray.intersectObjects(cards.filter(Boolean).map(c=>c.mesh))[0]?.object||null}

const ratioGrid=$('#ratioGrid');
ratioGrid.innerHTML=ratios.map(([name,w,h])=>`<button class="ratio-button" data-ratio="${name}" data-width="${w}" data-height="${h}" title="${w} × ${h}"><span class="ratio-icon ratio-${name.replace(':','-')}"></span><small>${name}</small></button>`).join('');
ratioGrid.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  const ratio=parseAspectRatio(b.dataset.ratio);if(ratio){state.ratioWidth=clampRatioValue(ratio.width,16);state.ratioHeight=clampRatioValue(ratio.height,9)}
  setDimensions(Number(b.dataset.width),Number(b.dataset.height));
}));
function applyCustomAspectRatioInputs(){
  const ratioWidth=clampRatioValue($('#ratioWidthInput').value,NaN),ratioHeight=clampRatioValue($('#ratioHeightInput').value,NaN);
  if(!Number.isFinite(ratioWidth)||!Number.isFinite(ratioHeight)){notify(`比例范围为 ${RATIO_MIN}–${RATIO_MAX}`);updateDimensionUI();return}
  state.ratioWidth=ratioWidth;state.ratioHeight=ratioHeight;
  const dimensions=dimensionsForAspectRatio(`${ratioWidth}:${ratioHeight}`);
  if(!dimensions){notify('请输入大于 0 的比例');updateDimensionUI();return}
  setDimensions(dimensions.width,dimensions.height);
}
const ratioInputs=[$('#ratioWidthInput'),$('#ratioHeightInput')];
let ratioCommitTimer;
function commitCustomAspectRatio(){
  clearTimeout(ratioCommitTimer);ratioCommitTimer=null;applyCustomAspectRatioInputs();
}
ratioInputs.forEach(input=>{
  input.addEventListener('blur',()=>{
    clearTimeout(ratioCommitTimer);
    ratioCommitTimer=setTimeout(()=>{
      if(ratioInputs.some(item=>item===document.activeElement))return;
      commitCustomAspectRatio();
    },0);
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitCustomAspectRatio();e.target.blur()}});
  input.addEventListener('wheel',e=>{
    e.preventDefault();
    const current=clampRatioValue(input.value,1),next=THREE.MathUtils.clamp(current+(e.deltaY<0?1:-1),RATIO_MIN,RATIO_MAX);
    input.value=next;commitCustomAspectRatio();
  },{passive:false});
});
const resolutionPresetControl=$('#resolutionPresetControl'),resolutionPresetTrigger=$('#resolutionPresetTrigger'),resolutionPresetMenu=$('#resolutionPresetMenu');
function closeResolutionPresetMenu(){resolutionPresetMenu?.classList.remove('open');resolutionPresetTrigger?.setAttribute('aria-expanded','false')}
resolutionPresetTrigger?.addEventListener('click',event=>{event.stopPropagation();const open=!resolutionPresetMenu.classList.contains('open');resolutionPresetMenu.classList.toggle('open',open);resolutionPresetTrigger.setAttribute('aria-expanded',String(open))});
resolutionPresetMenu?.addEventListener('click',event=>{
  const option=event.target.closest('[data-resolution-preset]');if(!option)return;
  state.resolutionPreset=RESOLUTION_PRESETS[option.dataset.resolutionPreset]?option.dataset.resolutionPreset:DEFAULT_RESOLUTION_PRESET;
  closeResolutionPresetMenu();applyCustomAspectRatioInputs();
});
$('#bgColorInput').addEventListener('input',e=>{scene.background.set(e.target.value);$('.color-code').textContent=e.target.value.toUpperCase();$('.color-swatch').style.background=e.target.value;render()});
$('#ringPreset').addEventListener('click',()=>setMode('ring'));
$('#bloomPreset').addEventListener('click',()=>setMode('bloom'));
$('#curvedPreset').addEventListener('click',()=>setMode('curved'));
$('#curvedHorizontalPreset').addEventListener('click',()=>setMode('curvedHorizontal'));
$('#gridPreset').addEventListener('click',()=>setMode('grid'));
$('#cardWidthInput').addEventListener('input',e=>{state.cardWidth=Number(e.target.value);syncCardSizeControls();updateTransforms()});
$('#cardHeightInput').addEventListener('input',e=>{state.cardHeight=Number(e.target.value);syncCardSizeControls();updateTransforms()});
$('#slotMinus').addEventListener('click',()=>adjustSlotCount(-1));$('#slotPlus').addEventListener('click',()=>adjustSlotCount(1));
$('#uploadButton').addEventListener('click',()=>{pickerSlot=0;$('#fileInput').click()});$('#clearImagesButton').addEventListener('click',clearAllImages);
$('#fileInput').addEventListener('change',e=>{loadFiles(e.target.files);e.target.value=''});
stage.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();stage.classList.add('file-dragging')}});
stage.addEventListener('dragleave',e=>{if(!stage.contains(e.relatedTarget))stage.classList.remove('file-dragging')});
stage.addEventListener('drop',e=>{if(!e.dataTransfer.files.length)return;e.preventDefault();stage.classList.remove('file-dragging');loadFiles(e.dataTransfer.files,hitCard(e)?.userData.slot??state.selected)});
renderer.domElement.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.button!==1)return;
  const mesh=hitCard(e);
  orbitDrag={x:e.clientX,y:e.clientY,startTilt:state.tilt,startRotation:state.rotation,startTarget:cameraTarget.clone(),moved:false,mesh,mode:e.button===1||e.altKey?'pan':'orbit'};
  renderer.domElement.setPointerCapture?.(e.pointerId);
  renderer.domElement.classList.add('orbiting');
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!orbitDrag)return;
  const dx=e.clientX-orbitDrag.x,dy=e.clientY-orbitDrag.y;
  if(Math.abs(dx)+Math.abs(dy)>3)orbitDrag.moved=true;
  if(!orbitDrag.moved)return;
  beginInteractivePreview();
  if(orbitDrag.mode==='pan'){
    const rect=renderer.domElement.getBoundingClientRect();
    const worldPerPixel=2*cameraDistance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,rect.height);
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
    const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    const delta=right.multiplyScalar(-dx*worldPerPixel).add(up.multiplyScalar(dy*worldPerPixel));
    cameraTarget.copy(orbitDrag.startTarget).add(delta);
    syncPanControls();
    updateCameraOrbit();
    render();
    return;
  }
  // Keep both axes continuous; quaternion camera orientation prevents pole flips.
  state.rotation=wrapDegrees(orbitDrag.startRotation-dx*.45);
  state.tilt=wrapDegrees(orbitDrag.startTilt+dy*.35);
  const cameraRotation=state.cameraAxis==='y'?state.rotation:state.tilt;
  $('#cameraRotationInput').value=cameraRotation;$('#cameraRotationOutput').textContent=`${Math.round(cameraRotation)}°`;
  updateTransforms(false);
});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!orbitDrag)return;
  const drag=orbitDrag;orbitDrag=null;renderer.domElement.releasePointerCapture?.(e.pointerId);renderer.domElement.classList.remove('orbiting');
  endInteractivePreview();
  if(!drag.moved&&drag.mode==='orbit'&&drag.mesh){state.selected=drag.mesh.userData.slot;updateSlots()}
});
renderer.domElement.addEventListener('pointercancel',()=>{orbitDrag=null;renderer.domElement.classList.remove('orbiting');endInteractivePreview()});
renderer.domElement.addEventListener('dblclick',e=>{const mesh=hitCard(e);if(mesh){pickerSlot=mesh.userData.slot;$('#fileInput').click()}});

$('#radiusInput').addEventListener('input',e=>{state.radius=Number(e.target.value)/DESIGN_SCALE;updateTransforms()});
$('#spacingInput').addEventListener('input',e=>{
  state.spacing=Number(e.target.value);
  // Spacing is the priority control: move the ring to the exact minimum
  // radius needed for the requested gap. Radius can be increased afterward
  // to add extra space, but never reduces the guaranteed minimum gap.
  state.radius=ringRequiredRadius();
  updateTransforms();
});
$('#rowCountInput').addEventListener('input',e=>{if(isCurvedMode())setCurvedGrid(Number(e.target.value),state.columns,'rows')});
$('#columnCountInput').addEventListener('input',e=>{if(isCurvedMode())setCurvedGrid(state.rows,Number(e.target.value),'columns')});
$('#staggerInput').addEventListener('input',e=>{const value=Math.round(Number(e.target.value));state.stagger=value>0&&value<=5?0:value;$('#staggerInput').value=state.stagger;$('#staggerOutput').textContent=`${state.stagger}%`;if(isCurvedMode())updateTransforms()});
$('#curvedSpacingInput').addEventListener('input',e=>{if(!isCurvedMode())return;const value=THREE.MathUtils.clamp(Number(e.target.value),0,160);if(state.spacingMode==='row')state.rowGap=value;else if(state.spacingMode==='column')state.columnGap=value;else{state.columnGap=value;state.rowGap=value}syncCurvedControls();updateTransforms();scheduleProjectSave()});
document.querySelectorAll('[data-curved-spacing-mode]').forEach(button=>button.addEventListener('click',()=>{if(!isCurvedMode())return;const mode=button.dataset.curvedSpacingMode;state.spacingMode=mode==='column'||mode==='row'?mode:'all';if(state.spacingMode==='all')state.rowGap=state.columnGap;syncCurvedControls();updateTransforms();scheduleProjectSave()}));
$('#curveBendInput').addEventListener('input',e=>{state.curveBend=Number(e.target.value);$('#curveBendOutput').textContent=`${state.curveBend}°`;if(isCurvedMode())updateTransforms()});
document.querySelectorAll('[data-curved-stagger-direction]').forEach(button=>button.addEventListener('click',()=>{if(!isCurvedMode())return;state.staggerDirection=button.dataset.curvedStaggerDirection==='vertical'?'vertical':'horizontal';syncCurvedControls();updateTransforms();scheduleProjectSave()}));
$('#gridRowCountInput').addEventListener('input',e=>{if(!isGridMode())return;normalizeCurvedGrid(Number(e.target.value),state.columns,'rows');syncGridControls();updateTransforms();scheduleProjectSave()});
$('#gridColumnCountInput').addEventListener('input',e=>{if(!isGridMode())return;normalizeCurvedGrid(state.rows,Number(e.target.value),'columns');syncGridControls();updateTransforms();scheduleProjectSave()});
$('#gridGapInput').addEventListener('input',e=>{if(!isGridMode())return;const value=THREE.MathUtils.clamp(Number(e.target.value),0,160);if(state.spacingMode==='row')state.rowGap=value;else if(state.spacingMode==='column')state.columnGap=value;else{state.columnGap=value;state.rowGap=value}syncGridControls();updateTransforms();scheduleProjectSave()});
document.querySelectorAll('[data-grid-spacing-mode]').forEach(button=>button.addEventListener('click',()=>{if(!isGridMode())return;const mode=button.dataset.gridSpacingMode;state.spacingMode=mode==='column'||mode==='row'?mode:'all';if(state.spacingMode==='all')state.rowGap=state.columnGap;syncGridControls();updateTransforms();scheduleProjectSave()}));
$('#gridStaggerInput').addEventListener('input',e=>{if(!isGridMode())return;state.gridStagger=Number(e.target.value);syncGridControls();updateTransforms();scheduleProjectSave()});
document.querySelectorAll('[data-grid-direction]').forEach(button=>button.addEventListener('click',()=>{if(!isGridMode())return;state.gridStaggerDirection=button.dataset.gridDirection==='vertical'?'vertical':'horizontal';syncGridControls();updateTransforms();scheduleProjectSave()}));
function updateSelectedPhotoAdjustment(key,value){
  const photo=state.photos[state.selected];if(!photo)return;
  photo[key]=Number(value);syncPhotoAdjustControls();applyCardTextureTransform(cards[state.selected]);render();scheduleProjectSave();
}
$('#photoScaleInput').addEventListener('input',e=>updateSelectedPhotoAdjustment('imageScale',Number(e.target.value)/100));
$('#photoOffsetXInput').addEventListener('input',e=>updateSelectedPhotoAdjustment('imageOffsetX',e.target.value));
$('#photoOffsetYInput').addEventListener('input',e=>updateSelectedPhotoAdjustment('imageOffsetY',e.target.value));
$('#resetPhotoAdjust').addEventListener('click',()=>{const photo=state.photos[state.selected];if(!photo)return;photo.imageScale=1;photo.imageOffsetX=0;photo.imageOffsetY=0;syncPhotoAdjustControls();applyCardTextureTransform(cards[state.selected]);render();scheduleProjectSave();notify(`已重置槽位 ${state.selected+1} 的图片调整`)});
$('#closePhotoAdjust').addEventListener('click',()=>{photoAdjustOpen=false;positionPhotoAdjustPanel()});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(photoAdjustOpen){event.preventDefault();photoAdjustOpen=false;positionPhotoAdjustPanel()}if(previewQualityMenu?.classList.contains('open')){event.preventDefault();closePreviewQualityMenu()}if(exportMenu?.classList.contains('open')){event.preventDefault();closeExportMenu()}if(resolutionPresetMenu?.classList.contains('open')){event.preventDefault();closeResolutionPresetMenu()}});
$('#cornerInput').addEventListener('input',e=>{state.corner=Number(e.target.value);$('#cornerOutput').textContent=`${state.corner} px`;for(const card of cards)if(card)card.cornerUniform.value=state.corner/DESIGN_SCALE;render()});
$('#contentRotationInput').addEventListener('input',e=>{state.contentRotation=Number(e.target.value);$('#contentRotationOutput').textContent=`${state.contentRotation}°`;updateTransforms()});
$('#backBrightnessInput').addEventListener('input',e=>{state.backBrightness=Number(e.target.value);$('#backBrightnessOutput').textContent=`${state.backBrightness}%`;for(const card of cards)if(card)card.backMaterial.color.setScalar(state.mode==='bloom'?1:state.backBrightness/100);render()});
$('#photoOpacityInput').addEventListener('input',e=>{state.photoOpacity=THREE.MathUtils.clamp(Number(e.target.value),0,100);$('#photoOpacityOutput').textContent=`${state.photoOpacity}%`;syncCardOpacity();render();scheduleProjectSave()});
$('#wallTiltInput').addEventListener('input',e=>{const value=Number(e.target.value);state.wallTilt=value;state[tiltKey(state.tiltAxis||'x')]=value;if(isGridMode())state.gridTiltZ=state.tiltZ;$('#wallTiltOutput').textContent=`${Math.round(value)}°`;updateTransforms();scheduleProjectSave()});
tiltGizmoToggle?.addEventListener('click',()=>setTiltGizmoVisible(!tiltGizmoVisible));
document.querySelectorAll('[data-tilt-axis]').forEach(button=>button.addEventListener('click',()=>{state.tiltAxis=button.dataset.tiltAxis==='y'||button.dataset.tiltAxis==='z'?button.dataset.tiltAxis:'x';syncViewControls();updateTransforms();scheduleProjectSave()}));
document.querySelectorAll('[data-camera-axis]').forEach(button=>button.addEventListener('click',()=>{state.cameraAxis=button.dataset.cameraAxis==='y'?'y':'x';syncViewControls();updateTransforms(false);scheduleProjectSave()}));
$('#cameraRotationInput').addEventListener('input',e=>{const value=Number(e.target.value);if(state.cameraAxis==='y'){state.rotation=value;updateTransforms(false)}else{state.tilt=value;fitCamera()}$('#cameraRotationOutput').textContent=`${Math.round(value)}°`;render();scheduleProjectSave()});
$('#fovInput').addEventListener('input',e=>{state.fov=THREE.MathUtils.clamp(Number(e.target.value),5,120);camera.fov=state.fov;$('#fovInput').value=state.fov;$('#fovOutput').textContent=`${state.fov}°`;fitCamera();render();scheduleProjectSave()});
function resetCurrentEffect(){
  modeSettings[state.mode]=createModeSettings(state.mode);
  applyModeSettings(state.mode);
  state.cardWidth=DEFAULT_CARD_WIDTH;state.cardHeight=DEFAULT_CARD_HEIGHT;syncCardSizeControls();
  $('#cornerInput').value=state.corner;$('#cornerOutput').textContent=`${state.corner} px`;
  $('#contentRotationInput').value=state.contentRotation;$('#contentRotationOutput').textContent=`${state.contentRotation}°`;
  $('#backBrightnessInput').value=state.backBrightness;$('#backBrightnessOutput').textContent=`${state.backBrightness}%`;
  $('#photoOpacityInput').value=state.photoOpacity;$('#photoOpacityOutput').textContent=`${state.photoOpacity}%`;
  for(const card of cards)if(card)card.backMaterial.color.setScalar(state.mode==='bloom'?1:state.backBrightness/100);
  syncCardOpacity();
  if(isCurvedMode()){normalizeCurvedGrid(state.rows,state.columns,'rows');syncCurvedControls();updateSlots();updateTransforms()}else if(isGridMode()){normalizeCurvedGrid(state.rows,state.columns,'rows');syncGridControls();updateSlots();updateTransforms()}else syncRingControls();syncViewControls();zoom(state.zoom);updateModeUI();scheduleProjectSave();notify('当前效果已恢复默认参数');
}
function confirmResetCurrentEffect(){
  if(window.confirm('确定将当前效果的参数恢复为默认状态吗？\n照片槽位和图片不会改变。'))resetCurrentEffect();
}
$('#resetButton').addEventListener('click',confirmResetCurrentEffect);
tiltGizmoReset?.addEventListener('click',confirmResetCurrentEffect);
function zoom(value){state.zoom=Math.max(40,Math.min(400,value));$('#zoomLabel').textContent=`${state.zoom}%`;$('#viewZoomInput').value=state.zoom;$('#viewZoomOutput').textContent=`${state.zoom}%`;fitCamera(true);render()}
function interactiveZoom(value){beginInteractivePreview();zoom(value);endInteractivePreview()}
$('#zoomInButton').addEventListener('click',()=>interactiveZoom(state.zoom+10));$('#zoomOutButton').addEventListener('click',()=>interactiveZoom(state.zoom-10));$('#fitButton').addEventListener('click',()=>{beginInteractivePreview();cameraTarget.set(0,0,0);syncPanControls();zoom(100);fitCamera(true);render();endInteractivePreview()});
const previewQualityControl=$('#previewQualityControl'),previewQualityTrigger=$('#previewQualityTrigger'),previewQualityMenu=$('#previewQualityMenu');
function closePreviewQualityMenu(){previewQualityMenu?.classList.remove('open');previewQualityTrigger?.setAttribute('aria-expanded','false')}
previewQualityTrigger?.addEventListener('click',event=>{event.stopPropagation();const open=!previewQualityMenu.classList.contains('open');previewQualityMenu.classList.toggle('open',open);previewQualityTrigger.setAttribute('aria-expanded',String(open))});
previewQualityMenu?.addEventListener('click',event=>{const option=event.target.closest('[data-preview-quality]');if(!option)return;closePreviewQualityMenu();applyPreviewQuality(option.dataset.previewQuality)});
syncPreviewQualityControl();
const exportControl=$('#exportControl'),exportTrigger=$('#exportButton'),exportMenu=$('#exportMenu');
function closeExportMenu(){exportMenu?.classList.remove('open');exportTrigger?.setAttribute('aria-expanded','false')}
exportTrigger?.addEventListener('click',event=>{event.stopPropagation();const open=!exportMenu.classList.contains('open');exportMenu.classList.toggle('open',open);exportTrigger.setAttribute('aria-expanded',String(open))});
exportMenu?.addEventListener('click',event=>{const option=event.target.closest('[data-export-format]');if(!option)return;closeExportMenu();exportImage(option.dataset.exportFormat)});
$('#viewZoomInput').addEventListener('input',e=>{beginInteractivePreview();zoom(Number(e.target.value));endInteractivePreview()});
$('#viewOffsetXInput').addEventListener('input',e=>{state.viewOffsetX=Number(e.target.value);cameraTarget.x=state.viewOffsetX/DESIGN_SCALE;syncPanControls();updateCameraOrbit();render()});
$('#viewOffsetYInput').addEventListener('input',e=>{state.viewOffsetY=Number(e.target.value);cameraTarget.y=state.viewOffsetY/DESIGN_SCALE;syncPanControls();updateCameraOrbit();render()});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();beginInteractivePreview();zoom(state.zoom+(e.deltaY<0?10:-10));endInteractivePreview()},{passive:false});
$('#themeButton').addEventListener('click',()=>document.body.classList.toggle('light-theme'));
$('#projectButton').addEventListener('click',()=>{const menu=$('#projectMenu');const open=!menu.classList.contains('open');menu.classList.toggle('open',open);menu.setAttribute('aria-hidden',String(!open));if(open)renderProjectList()});
$('#closeProjectMenu').addEventListener('click',closeProjectMenu);
$('#createProjectButton').addEventListener('click',()=>{const input=$('#projectNameInput');createProject(input.value);input.value=''});
$('#projectNameInput').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('#createProjectButton').click()}});
$('#projectList').addEventListener('click',event=>{const reset=event.target.closest('[data-project-reset]');if(reset){event.stopPropagation();resetProject(reset.dataset.projectReset);return}const remove=event.target.closest('[data-project-delete]');if(remove){event.stopPropagation();deleteProject(remove.dataset.projectDelete);return}const name=event.target.closest('[data-project-name]');if(name){event.stopPropagation();beginProjectRename(name.dataset.projectName);return}const row=event.target.closest('[data-project-id]');if(row)switchProject(row.dataset.projectId)});
$('#projectList').addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;const row=event.target.closest('[data-project-id]');if(!row||event.target.closest('[data-project-delete]')||event.target.closest('[data-project-reset]'))return;event.preventDefault();switchProject(row.dataset.projectId)});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('#projectMenu')&&!event.target.closest('#projectButton'))closeProjectMenu();if(!event.target.closest('#previewQualityControl'))closePreviewQualityMenu();if(!event.target.closest('#exportControl'))closeExportMenu();if(!event.target.closest('#resolutionPresetControl'))closeResolutionPresetMenu()});
$('#undoButton').addEventListener('click',()=>notify('撤销功能将在后续版本加入'));$('#redoButton').addEventListener('click',()=>notify('重做功能将在后续版本加入'));
async function exportImage(format='png'){
  const button=$('#exportButton'),label=button.querySelector('.export-label');button.disabled=true;button.classList.add('exporting');if(label)label.textContent='导出中';
  const oldAspect=camera.aspect,oldBackground=scene.background;
  const isJpeg=format==='jpeg',extension=isJpeg?'jpg':'png',mime=isJpeg?'image/jpeg':'image/png';
  try{
    // The editor can use a lighter preview texture, while export temporarily
    // restores each original image so both formats keep the source resolution.
    await switchToFullResolutionTextures();
    if(!exportRenderer){exportRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});exportRenderer.setPixelRatio(1);exportRenderer.setClearColor(0x000000,0);exportRenderer.outputColorSpace=THREE.SRGBColorSpace;exportRenderer.toneMapping=THREE.NoToneMapping;exportRenderer.toneMappingExposure=1}
    exportRenderer.setSize(state.width,state.height,false);
    camera.aspect=state.width/state.height;camera.updateProjectionMatrix();
    if(isJpeg){
      // JPEG has no alpha channel, so retain the current canvas background.
      exportRenderer.setClearColor(oldBackground||0x101014,1);exportRenderer.setClearAlpha?.(1);scene.background=oldBackground||new THREE.Color('#101014');
    }else{
      exportRenderer.setClearColor(0x000000,0);exportRenderer.setClearAlpha?.(0);scene.background=null;exportRenderer.clear(true,true,true);
    }
    exportRenderer.render(scene,camera);
    const blob=await new Promise((resolve,reject)=>exportRenderer.domElement.toBlob(value=>value?resolve(value):reject(new Error('图片生成失败')),mime,isJpeg?0.92:undefined));
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`photo-wall-${state.width}x${state.height}.${extension}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);notify(`已导出 ${state.width} × ${state.height} ${isJpeg?'JPEG':'PNG'}`);
  }catch{notify('导出失败，请重试')}
  finally{
    scene.background=oldBackground;camera.aspect=oldAspect;camera.updateProjectionMatrix();
    await restorePreviewTextures().catch(()=>{});render();button.disabled=false;button.classList.remove('exporting');if(label)label.textContent='导出';
  }
}

updateDimensionUI();updateSlots();updateModeUI();resize();new ResizeObserver(resize).observe(host);window.addEventListener('resize',resize);


