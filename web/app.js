import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { createShowroomRendering } from './rendering.js?v=__SHOWROOM_BUILD__';
import { moveWithCollision, safeSpawn } from './collision.js?v=__SHOWROOM_BUILD__';
const buildId = '__SHOWROOM_BUILD__';

const $ = id => document.getElementById(id);
let renderer, scene, camera, controls, model, currentCase, graphics, ground;
let mode = 'overview', yaw = 0, pitch = 0, furnitureVisible = true, evening = false;
let dragging = false, lastPointer = {x:0,y:0}, lastTime = 0, toastTimeout, transition = null;
const keys = new Set(), stick = {x:0,y:0}, eyeHeight = 1.65;
const coarse = matchMedia('(pointer:coarse)').matches;
const mapCanvas = $('map'), mapCtx = mapCanvas.getContext('2d');
let overviewPosition, overviewTarget, cases = [];

function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('toast').classList.remove('show'), 3500); }
function clearMotion() { keys.clear(); stick.x = stick.y = 0; dragging = false; $('joystick-knob').style.transform = ''; }
function setCaption(name, hint, index = '') { $('room-caption').innerHTML = ''; const num = document.createElement('span'); num.textContent = String(index || '01').padStart(2,'0'); const text = document.createElement('div'); const title = document.createElement('strong'); title.textContent = name; const small = document.createElement('small'); small.textContent = hint; text.append(title,small); $('room-caption').append(num,text); }

async function init() {
  try {
    const response = await fetch(`./showrooms.json?v=${buildId}`);
    if (!response.ok) throw new Error('空间目录未能加载');
    cases = await response.json();
    if (!cases.length) throw new Error('尚未添加空间');
    const requested = new URLSearchParams(location.search).get('showroom');
    currentCase = cases.find(c => c.id === requested) || cases[0];
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.25 : 1.5));
    renderer.setSize(innerWidth,innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .9;
    renderer.setClearColor('#e8e9e1');
    $('viewer').appendChild(renderer.domElement);
    scene = new THREE.Scene(); scene.background = new THREE.Color('#e8e9e1');
    camera = new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.06,250);
    controls = new OrbitControls(camera,renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .09;
    controls.minDistance = 8; controls.maxDistance = 65; controls.maxPolarAngle = Math.PI * .46;
    controls.addEventListener('start',()=>transition=null);
    graphics = createShowroomRendering({ renderer, scene, camera, coarse });
    ground = new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:'#dfe4d9',roughness:1}));
    ground.rotation.x=-Math.PI/2; ground.position.y=-.26; ground.receiveShadow = true; scene.add(ground);
    await loadCase(currentCase);
    bindEvents();
    renderer.setAnimationLoop(animate);
    $('loading').style.opacity='0'; setTimeout(()=>$('loading').hidden=true,550);
    window.__showroomDebug = { get model(){return model},get mode(){return mode},get camera(){return camera},get renderer(){return renderer},get scene(){return scene},get graphics(){return graphics},teleport,setMode };
  } catch (error) {
    console.error(error); $('loading').innerHTML='';
    const title=document.createElement('p');title.textContent='暂时无法打开三维空间';
    const detail=document.createElement('p');detail.textContent=error.message+'。请使用支持 WebGL 2 的浏览器，并通过本地服务器或网站链接打开。';
    const retry=document.createElement('button');retry.textContent='重新载入';retry.className='primary-button';retry.style.width='180px';retry.onclick=()=>location.reload();
    $('loading').append(title,detail,retry);
  }
}

async function loadCase(meta) {
  currentCase=meta;
  const module=await import(`./showrooms/${meta.id}/model.js?v=${buildId}`);
  if(model) {scene.remove(model.group);model.group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
  model=module.createApartment();
  model.walkable ||= [];
  scene.add(model.group);
  model.ceilings.visible=false;
  model.furniture.visible=furnitureVisible;
  if(model.exterior)model.exterior.visible=false;
  graphics.setModel(model);
  const b=model.bounds,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
  overviewTarget=new THREE.Vector3(cx-1,0,cz);
  const fit=Math.max(1,1.5/camera.aspect);
  overviewPosition=new THREE.Vector3(cx+22*fit,27*fit,cz+27*fit);
  controls.maxDistance=Math.max(65,overviewPosition.distanceTo(overviewTarget)*1.3);
  populateUI(meta);
  setMode('overview',true);
  const url=new URL(location.href);url.searchParams.set('showroom',meta.id);history.replaceState(null,'',url);
}

function populateUI(meta) {
  document.title=`${meta.title} · Showroom`;
  $('project-title').textContent=meta.title;
  $('project-subtitle').textContent=meta.subtitle;
  $('source-summary').textContent=meta.sourceSummary||meta.description;
  $('area-label').innerHTML='';const area=document.createTextNode('385');const label=document.createElement('small');label.textContent='㎡ 建筑面积';$('area-label').append(area,label);
  if(meta.areaLabel && !meta.areaLabel.includes('385')) $('area-label').textContent=meta.areaLabel;
  $('layout-label').textContent=meta.layoutLabel||'3 厅 · 4 房';
  $('assumptions').replaceChildren();for(const value of meta.assumptions||[]){const li=document.createElement('li');li.textContent=value;$('assumptions').append(li);}
  $('source-links').replaceChildren();for(const source of meta.sources||[]){const a=document.createElement('a');a.textContent=source.label+' ↗';a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';$('source-links').append(a);}
  $('project-select').replaceChildren();cases.forEach(c=>{const option=document.createElement('option');option.value=c.id;option.textContent=`${c.title} · ${c.subtitle}`;option.selected=c.id===meta.id;$('project-select').append(option);});
  document.querySelector('.project-select-wrap').hidden=cases.length<2;
  $('room-list').replaceChildren();model.rooms.forEach((room,i)=>{const button=document.createElement('button');button.textContent=room.name;button.dataset.room=room.id;button.addEventListener('click',()=>teleport(room.id));$('room-list').append(button);});
  $('room-jump').replaceChildren();model.rooms.forEach(room=>{const option=document.createElement('option');option.value=room.id;option.textContent=room.name;$('room-jump').append(option);});
}

function setMode(next, immediate=false) {
  mode=next;clearMotion();transition=null;
  document.body.classList.toggle('walk',next==='walk');
  document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===next);b.setAttribute('aria-pressed',String(b.dataset.mode===next));});
  controls.enabled=next==='overview';
  model.ceilings.visible=next==='walk';
  ground.visible=next==='overview';
  if(model.exterior)model.exterior.visible=next==='walk';
  graphics.setMode(next);
  $('walk-hint').hidden=next!=='walk';$('crosshair').hidden=next!=='walk';$('joystick').hidden=next!=='walk'||!coarse;
  if(next==='overview'){
    document.exitPointerLock?.();
    camera.setViewOffset(innerWidth,innerHeight,innerWidth>700?-Math.min(110,innerWidth*.11):0,0,innerWidth,innerHeight);
    camera.fov=42;camera.updateProjectionMatrix();
    if(immediate){camera.position.copy(overviewPosition);controls.target.copy(overviewTarget);controls.update();}
    else transition={from:camera.position.clone(),to:overviewPosition.clone(),fromTarget:controls.target.clone(),toTarget:overviewTarget.clone(),start:performance.now(),duration:850};
    setCaption('全屋空间','拖动旋转 · 滚轮缩放');$('controls-hint').textContent='拖动旋转 / 滚轮缩放';
    document.querySelectorAll('[data-room]').forEach(b=>b.classList.remove('active'));
  } else {
    camera.clearViewOffset();
    camera.fov=65;camera.updateProjectionMatrix();
    const room=model.rooms.find(r=>r.id==='living')||model.rooms[0]||model.entry;
    placeAt(room);
    $('controls-hint').textContent=coarse?'左侧摇杆行走 / 右侧拖动环顾':'WASD 行走 / 拖动环顾 / Esc 释放鼠标';
    if(coarse)toast('左下摇杆移动，拖动画面环顾四周');
  }
}

function placeAt(room) {
  const spawn=safeSpawn(room,model,furnitureVisible);
  if(!spawn){toast('这个位置暂时无法站立，请选其他房间');return false;}
  camera.position.set(spawn.x,eyeHeight,spawn.z);yaw=spawn.yaw||0;pitch=Number.isFinite(room.pitch)?room.pitch:-.025;applyLook();
  const index=model.rooms.findIndex(r=>r.id===room.id);
  setCaption(room.name||'入户前厅',room.description||'室内漫游',index+1);
  document.querySelectorAll('[data-room]').forEach(b=>b.classList.toggle('active',b.dataset.room===room.id));
  if(room.id)$('room-jump').value=room.id;
  return true;
}
function teleport(id) {const room=model.rooms.find(r=>r.id===id);if(!room)return; if(mode!=='walk')setMode('walk');clearMotion();placeAt(room);}
function applyLook(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}

function bindEvents() {
  const canvas=renderer.domElement;
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('start-walk').onclick=()=>setMode('walk');
  $('room-jump').onchange=e=>teleport(e.target.value);
  $('reset-view').onclick=()=>mode==='overview'?setMode('overview'):placeAt(model.entry);
  $('furniture-toggle').onclick=()=>{furnitureVisible=!furnitureVisible;model.furniture.visible=furnitureVisible;graphics.invalidateShadows();$('furniture-toggle').setAttribute('aria-pressed',String(furnitureVisible));if(mode==='walk'&&furnitureVisible){const adjusted=safeSpawn({x:camera.position.x,z:camera.position.z,yaw},model);if(adjusted)camera.position.set(adjusted.x,eyeHeight,adjusted.z);}};
  $('light-toggle').onclick=()=>{evening=!evening;graphics.setEvening(evening);$('light-toggle').setAttribute('aria-pressed',String(evening));$('light-toggle').querySelector('span').textContent=evening?'暖光':'日光';toast('光线为氛围演示，未做真实日照计算');};
  $('map-toggle').onclick=()=>{$('map-panel').hidden=!$('map-panel').hidden;$('map-toggle').setAttribute('aria-pressed',String(!$('map-panel').hidden));};
  $('toggle-rooms').onclick=()=>{$('room-list').hidden=!$('room-list').hidden;$('toggle-rooms').querySelector('span').textContent=$('room-list').hidden?'+':'−';};
  $('info-button').onclick=()=>{document.exitPointerLock?.();clearMotion();$('info-dialog').showModal();};
  $('close-info').onclick=()=>$('info-dialog').close();
  $('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog')){const r=$('info-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('info-dialog').close();}});
  $('project-select').onchange=async e=>{clearMotion();try{await loadCase(cases.find(c=>c.id===e.target.value));}catch(error){console.error(error);toast('该空间加载失败，请刷新重试');}};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器不支持全屏，请使用浏览器的全屏模式');}};
  $('lock-pointer').onclick=()=>{try{const result=canvas.requestPointerLock?.();result?.catch(()=>toast('无法锁定鼠标，仍可按住画面拖动环顾'));}catch{toast('按住画面拖动即可环顾');}};
  document.addEventListener('pointerlockchange',()=>{$('lock-pointer').textContent=document.pointerLockElement?'Esc 退出锁定':'鼠标锁定';});
  document.addEventListener('pointerlockerror',()=>toast('鼠标锁定不可用，可用拖动环顾'));
  canvas.addEventListener('pointerdown',e=>{if(mode!=='walk')return;dragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  document.addEventListener('pointermove',e=>{if(mode!=='walk'||$('info-dialog').open)return;if(document.pointerLockElement===canvas){yaw-=e.movementX*.0025;pitch-=e.movementY*.0025;}else if(dragging&&e.target===canvas){yaw-=(e.clientX-lastPointer.x)*.004;pitch-=(e.clientY-lastPointer.y)*.004;lastPointer={x:e.clientX,y:e.clientY};}else return;pitch=THREE.MathUtils.clamp(pitch,-1.35,1.3);applyLook();});
  window.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||$('info-dialog').open)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyV')setMode(mode==='walk'?'overview':'walk');if(e.code==='KeyR')$('reset-view').click();if(e.code==='KeyM')$('map-toggle').click();});
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearMotion);document.addEventListener('visibilitychange',clearMotion);
  window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);const b=model.bounds,cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2,fit=Math.max(1,1.5/camera.aspect);overviewPosition.set(cx+22*fit,27*fit,cz+27*fit);controls.maxDistance=Math.max(65,overviewPosition.distanceTo(overviewTarget)*1.3);if(mode==='overview')setMode('overview',true);else camera.updateProjectionMatrix();graphics.resize(innerWidth,innerHeight);});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('图形上下文已暂停，请重新载入页面恢复');renderer.setAnimationLoop(null);});
  const joy=$('joystick');let joyId=null;
  function updateStick(e){const r=joy.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const d=Math.hypot(x,y),max=32;if(d>max){x=x/d*max;y=y/d*max;}stick.x=x/max;stick.y=y/max;$('joystick-knob').style.transform=`translate(${x}px,${y}px)`;}
  joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);updateStick(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)updateStick(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,()=>{joyId=null;stick.x=stick.y=0;$('joystick-knob').style.transform='';});
}

function updateWalk(dt) {
  if($('info-dialog').open)return;
  let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stick.y;
  let right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
  const magnitude=Math.hypot(forward,right);if(magnitude<.03)return;if(magnitude>1){forward/=magnitude;right/=magnitude;}
  const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?3.5:1.9)*dt;
  const delta={x:(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed,z:(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed};
  const next=moveWithCollision(camera.position,delta,model,furnitureVisible);camera.position.x=next.x;camera.position.z=next.z;
}

function drawMap() {
  if($('map-panel').hidden)return;
  const ctx=mapCtx,w=mapCanvas.width,h=mapCanvas.height,b=model.bounds;
  const scale=Math.min((w-22)/(b.maxX-b.minX),(h-20)/(b.maxZ-b.minZ));
  const ox=(w-(b.maxX-b.minX)*scale)/2-b.minX*scale,oz=10-b.minZ*scale;
  const x=value=>ox+value*scale,z=value=>oz+value*scale;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#e7e9df';for(const f of model.walkable.length?model.walkable:[b])ctx.fillRect(x(f.minX),z(f.minZ),(f.maxX-f.minX)*scale,(f.maxZ-f.minZ)*scale);
  for(const c of model.colliders){if(c.type==='furniture'&&!furnitureVisible)continue;ctx.fillStyle=c.type==='furniture'?'#cbd1c2':'#7c8875';ctx.fillRect(x(c.minX),z(c.minZ),Math.max(1,(c.maxX-c.minX)*scale),Math.max(1,(c.maxZ-c.minZ)*scale));}
  ctx.fillStyle='#8b9d80';for(const r of model.rooms){ctx.beginPath();ctx.arc(x(r.x),z(r.z),1.7,0,Math.PI*2);ctx.fill();}
  if(mode==='walk'){const px=x(camera.position.x),pz=z(camera.position.z);ctx.save();ctx.translate(px,pz);ctx.rotate(-yaw);ctx.fillStyle='#476b43';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-5,2);ctx.lineTo(0,0);ctx.lineTo(5,2);ctx.closePath();ctx.fill();ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.restore();}
}

function animate(time) {
  const elapsed=(time-lastTime)/1000,dt=Math.min(elapsed,.035);lastTime=time;
  if(transition){const t=Math.min(1,(time-transition.start)/transition.duration),smooth=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,smooth);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,smooth);if(t===1)transition=null;}
  if(mode==='overview')controls.update();else updateWalk(dt);
  graphics.render(elapsed);drawMap();
}

init();
