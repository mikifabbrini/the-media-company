
/* TMC_SERVICES_3D: scene e controlli. Librerie locali, nessun servizio esterno. */
(async function(){
const component=document.querySelector('.tmcs');if(!component)return;
await new Promise(resolve=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();resolve()}},{rootMargin:'350px'});observer.observe(component)});
try {
const assetBase=new URL('img/servizi-3d/',document.baseURI);
let libraries,localAssets=null;
if(location.protocol==='file:'){
 await new Promise((resolve,reject)=>{if(window.TMC3DLocal){resolve();return}const script=document.createElement('script');script.src=new URL('local-runtime.js',assetBase).href;script.onload=resolve;script.onerror=()=>reject(new Error('Risorse 3D locali non disponibili'));document.head.appendChild(script)});
 localAssets=window.TMC3DLocal;libraries=[localAssets.T,localAssets,localAssets,localAssets];
}else{libraries=await Promise.all(['three.module.js','RoundedBoxGeometry.js','RoomEnvironment.js','GLTFLoader.js'].map(file=>import(new URL(file,assetBase).href)))}
const [T,{RoundedBoxGeometry},{RoomEnvironment},{GLTFLoader}]=libraries;

const WHITE=0xf6f7f9, BLUE=0x352b7d;
const mat=(color,metalness=0,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
const M={silver:mat(0xc5cbd1,.86,.3),edge:mat(0xe9edf2,.95,.17),paper:mat(0xffffff,0,.85),ink:mat(0x101827,.1,.4),dark:mat(0x282d34,.4,.25),blue:mat(BLUE,.05,.42),glass:new T.MeshPhysicalMaterial({color:0x17202d,metalness:.3,roughness:.1,clearcoat:1}),rubber:mat(0x14171c,0,.72)};
const makeBox=(w,h,d,r,m)=>new T.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,d/2,w/2,h/2)),m);
const cyl=(r,h,m,segments=40)=>new T.Mesh(new T.CylinderGeometry(r,r,h,segments),m);
function put(g,o,x=0,y=0,z=0){o.position.set(x,y,z);g.add(o);return o}
function panel(g,w,h,texture,x,y,z,emissive=0){const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});return put(g,new T.Mesh(new T.PlaneGeometry(w,h),material),x,y,z)}
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex}
function image(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url})}
let logo,mark;
function drawLogo(c,x,y,w){c.drawImage(logo,x,y,w,w*logo.height/logo.width)}
function campaign(w,h,vertical=false){return texture(w,h,(c,W,H)=>{c.fillStyle='#ffffff';c.fillRect(0,0,W,H);if(vertical){c.drawImage(mark,W*.27,H*.12,W*.46,W*.46*mark.height/mark.width);c.fillStyle='#352b7d';c.fillRect(0,H*.76,W,H*.24);c.fillStyle='#fff';c.font=`500 ${W*.043}px Onest,Arial`;c.textAlign='center';c.fillText('THE MEDIA COMPANY',W/2,H*.88)}else{drawLogo(c,W*.085,H*.34,W*.83);c.fillStyle='#352b7d';c.fillRect(W*.085,H*.82,W*.18,H*.012)}})}
function textTexture(text,w=512,h=128){return texture(w,h,(c,W,H)=>{c.fillStyle='#fff';c.fillRect(0,0,W,H);c.fillStyle='#15203d';c.font=`600 ${H*.62}px Onest,Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H*.51)})}
function billboard(){const g=new T.Group(),w=2.7,h=1.25,y=1.7;
 for(const x of [-.82,.82]){put(g,makeBox(.07,1.05,.08,.006,M.silver),x,.525,-.035);put(g,makeBox(.4,.045,.27,.006,M.silver),x,.022,-.025)}
 put(g,makeBox(w,h,.105,.012,M.edge),0,y,0);put(g,makeBox(w-.06,h-.06,.018,.003,M.paper),0,y,.057);
 panel(g,w-.11,h-.11,campaign(1024,512),0,y,.068);
 // Thin structural members remain visible during rotation.
 put(g,makeBox(w-.08,.055,.05,.005,M.silver),0,y-h*.3,-.08);put(g,makeBox(w-.08,.055,.05,.005,M.silver),0,y+h*.3,-.08);
 for(const x of [-1,0,1]){put(g,makeBox(.027,.08,.025,.002,M.silver),x,y+h/2+.035,0);put(g,makeBox(.026,.025,.2,.004,M.silver),x,y+h/2+.075,.085);const lamp=put(g,makeBox(.19,.034,.105,.004,M.edge),x,y+h/2+.065,.18);lamp.rotation.x=.18;put(g,makeBox(.14,.009,.072,.002,M.paper),x,y+h/2+.047,.18)}
 for(const x of [-w/2+.035,w/2-.035])for(const yy of [y-h/2+.035,y+h/2-.035])put(g,new T.Mesh(new T.SphereGeometry(.012,8,6),M.dark),x,yy,.061);
 return g;
}
function led(){const g=new T.Group();put(g,makeBox(.9,.055,.5,.015,M.silver),0,.028,0);put(g,makeBox(.14,.28,.13,.01,M.silver),0,.17,0);
 put(g,makeBox(1.05,1.83,.16,.035,M.edge),0,1.2,0);put(g,makeBox(1.015,1.79,.018,.02,M.ink),0,1.2,.087);const front=panel(g,.94,1.63,campaign(512,900,true),0,1.22,.099,.16);
 put(g,makeBox(.12,.013,.008,.003,M.dark),0,.343,.102);
 g.userData.animate=t=>{};return g;
}
function newspaper(){const g=new T.Group(),w=1.48,h=1.28;
 const tex=texture(1200,1040,(c,W,H)=>{
 c.fillStyle='#f2f0eb';c.fillRect(0,0,W,H);
 c.fillStyle='#17202a';c.textAlign='center';c.font='bold 142px Georgia,serif';c.fillText('NOTIZIE',W/2,167);
 c.fillRect(48,196,W-96,7);c.fillRect(48,208,W-96,2);
 drawLogo(c,420,226,360);c.font='24px Georgia,serif';c.textAlign='left';c.fillText('MEDIA · COMUNICAZIONE · IMPRESE',55,295);
 c.fillRect(48,313,W-96,2);c.font='bold 53px Georgia,serif';c.fillText('Le idee fanno notizia',54,384);
 const widths=[226,238,218,230],starts=[54,342,640,928];
 for(let col=0;col<4;col++)for(let row=0;row<34;row++){
 if(col===0&&row<13)continue;
 c.fillStyle=row%9===0?'#4d5053':'#8b8d8e';c.fillRect(starts[col],420+row*16,widths[col]-(row%5)*12,row%9===0?5:3);
 }
 c.fillStyle='#d8dbde';c.fillRect(54,422,228,178);c.drawImage(mark,139,454,60,70);c.fillStyle='#5c6370';c.font='17px Arial';c.fillText('THE MEDIA COMPANY',74,574);
 c.fillStyle='#171e26';c.font='bold 32px Georgia,serif';c.fillText('Il valore dei media',640,698);
 c.fillStyle='#f2f0eb';c.fillRect(632,655,526,58);c.fillStyle='#171e26';c.font='bold 32px Georgia,serif';c.fillText('Il valore dei media',640,694);
 c.fillStyle='#9fa1a3';c.fillRect(48,984,W-96,1);c.font='20px Georgia';c.fillText('01',54,1015);c.textAlign='right';c.fillText('02',1145,1015);
 const crease=c.createLinearGradient(575,0,625,0);crease.addColorStop(0,'rgba(70,65,55,0)');crease.addColorStop(.5,'rgba(70,65,55,.22)');crease.addColorStop(1,'rgba(70,65,55,0)');c.fillStyle=crease;c.fillRect(575,0,50,H);
 });
 for(let i=5;i>=0;i--){const geo=new T.PlaneGeometry(w,h,40,28),pos=geo.attributes.position;
 for(let k=0;k<pos.count;k++){const x=pos.getX(k),y=pos.getY(k),edge=Math.abs(x)/(w/2);pos.setZ(k,.1*edge+.025*Math.sin((y+h/2)/h*Math.PI)-i*.008);}
 geo.computeVertexNormals();const material=i===0?new T.MeshBasicMaterial({map:tex,toneMapped:false,side:T.DoubleSide}):new T.MeshStandardMaterial({color:i%2?0xd9d8d3:0xf4f2ec,roughness:.94,side:T.DoubleSide});
 const sheet=put(g,new T.Mesh(geo,material),i*.006,h/2-i*.006,0);if(i===0)g.userData.paper=sheet;}
 return g;
}
function phone(){const g=new T.Group();put(g,makeBox(.69,1.43,.088,.06,M.edge),0,.715,0);put(g,makeBox(.662,1.407,.011,.045,M.ink),0,.715,.045);
 const tex=texture(460,960,(c,W,H)=>{c.fillStyle='#fff';c.fillRect(0,0,W,H);c.fillStyle='#111a31';c.font='500 20px Onest';c.fillText('9:41',32,39);drawLogo(c,29,91,400);c.fillStyle='#e1e3e8';c.fillRect(0,195,W,2);c.drawImage(mark,95,249,270,316);c.fillStyle='#352b7d';c.fillRect(0,657,W,8);c.strokeStyle='#19213a';c.lineWidth=3;for(const [x,r]of[[43,11],[95,10],[148,9]]){c.beginPath();c.arc(x,713,r,0,Math.PI*2);c.stroke()}c.fillStyle='#dce0e6';c.fillRect(32,763,360,8);c.fillRect(32,790,270,7);c.fillRect(32,815,310,7);c.fillStyle='#162039';c.fillRect(161,920,140,6)});
 panel(g,.6,1.315,tex,0,.715,.052,.08);put(g,makeBox(.15,.031,.008,.014,M.ink),0,1.37,.059);put(g,makeBox(.015,.15,.022,.004,M.silver),.35,.97,0);return g;
}
function tv(){const g=new T.Group(),w=2.2,h=1.27;put(g,makeBox(.67,.035,.39,.008,M.silver),0,.018,0);put(g,makeBox(.075,.37,.09,.005,M.silver),0,.2,-.025);put(g,makeBox(w,h,.09,.022,M.edge),0,.98,0);put(g,makeBox(w-.035,h-.035,.013,.014,M.ink),0,.98,.05);panel(g,w-.1,h-.1,campaign(1024,600),0,.98,.059,.1);return g}
function onAir(){const g=new T.Group();put(g,makeBox(.95,.3,.15,.022,M.silver),0,.15,0);panel(g,.86,.23,textTexture('ON AIR'),0,.15,.078,.1);put(g,new T.Mesh(new T.SphereGeometry(.015,12,8),new T.MeshBasicMaterial({color:BLUE})),.415,.055,.08);return g}
function microphone(){const g=new T.Group();put(g,cyl(.33,.065,M.dark),0,.032,0);put(g,cyl(.045,.76,M.silver),0,.43,0);const head=new T.Group();head.position.set(0,1.31,0);head.rotation.z=-.14;g.add(head);
 const gridTex=texture(256,512,(c,W,H)=>{c.fillStyle='#727b84';c.fillRect(0,0,W,H);c.fillStyle='#303840';for(let y=0;y<H;y+=8)for(let x=0;x<W;x+=8)c.fillRect(x+(y%16?2:0),y,3,5)});gridTex.wrapS=gridTex.wrapT=T.RepeatWrapping;gridTex.repeat.set(2,1);
 const grille=new T.MeshStandardMaterial({color:0xd4d8df,metalness:.85,roughness:.32,map:gridTex,bumpMap:gridTex,bumpScale:.009});put(head,new T.Mesh(new T.CapsuleGeometry(.17,.37,10,32),grille),0,.26,0);put(head,cyl(.17,.44,M.silver),0,-.25,0);
 for(const y of [-.08,-.45]){const hoop=new T.Mesh(new T.TorusGeometry(.27,.015,10,48),M.dark);hoop.rotation.x=Math.PI/2;put(head,hoop,0,y,0);for(let k=0;k<6;k++){const a=k*Math.PI/3;put(head,cyl(.008,.34,M.dark,8),Math.cos(a)*.26,(y===-.08?-.26:-.27),Math.sin(a)*.26)}}
 put(head,makeBox(.056,.11,.007,.007,M.ink),0,-.28,.173);return g;
}

async function loadTaxi(){const loader=new GLTFLoader();let compressed;if(localAssets){compressed=new Blob([Uint8Array.from(atob(localAssets.model),c=>c.charCodeAt(0))]).stream()}else{const response=await fetch(new URL('taxi.glb.gz',assetBase));if(!response.ok)throw new Error('Modello 3D non disponibile');compressed=response.body}const data=await new Response(compressed.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();const gltf=await loader.parseAsync(data,assetBase.href);const source=gltf.scene;
 source.traverse(o=>{if(!o.isMesh)return;const name=(o.material?.name||'').toLowerCase();o.userData.originalMaterial=name;if(name.includes('body')||name.includes('zx')||name.includes('livery'))o.material=new T.MeshPhysicalMaterial({color:0xe6e9ed,metalness:.6,roughness:.24,clearcoat:.75,clearcoatRoughness:.2});else if(name.includes('white'))o.material=M.paper;else if(name.includes('window'))o.material=M.glass;else if(name.includes('rim')||name.includes('chrome'))o.material=M.silver;else if(name.includes('led')||name.includes('headlight'))o.material=new T.MeshStandardMaterial({color:0xebf0f9,emissive:0xb7c5e2,emissiveIntensity:.12,metalness:.5,roughness:.2});else if(name.includes('redlight'))o.material=mat(0x702e33,.1,.35);else o.material=M.rubber;o.material.side=T.DoubleSide;o.castShadow=false;o.receiveShadow=false});
 let bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3());if(size.z>size.x)source.rotation.y+=Math.PI/2;source.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(source);size=bounds.getSize(new T.Vector3());const center=bounds.getCenter(new T.Vector3());const scale=3.25/size.x;
 const normalized=new T.Group();normalized.add(source);source.position.x-=center.x;source.position.y-=bounds.min.y;source.position.z-=center.z;normalized.scale.setScalar(scale);
 const g=new T.Group();g.add(normalized);g.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(g);size=bounds.getSize(new T.Vector3());
 // Tyres and rims share a source material: separate them by wheel radius.
 g.traverse(mesh=>{if(!mesh.isMesh||!mesh.userData.originalMaterial?.includes('rim'))return;
 const geometry=mesh.geometry.clone(),pos=geometry.attributes.position,boundsByWheel=Array.from({length:4},()=>({min:new T.Vector3(Infinity,Infinity,Infinity),max:new T.Vector3(-Infinity,-Infinity,-Infinity)})),points=[];
 for(let i=0;i<pos.count;i++){const v=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);const k=(v.x>0?1:0)+(v.z>0?2:0);boundsByWheel[k].min.min(v);boundsByWheel[k].max.max(v);points.push([v,k]);}
 const centers=boundsByWheel.map(b=>({p:b.min.clone().add(b.max).multiplyScalar(.5),r:(b.max.y-b.min.y)/2})),colors=new Uint8Array(pos.count*3);
 points.forEach(([v,k],i)=>{const c=centers[k],r=Math.hypot(v.x-c.p.x,v.y-c.p.y),tyre=r>c.r*.79;colors.set(tyre?[12,15,19]:[169,176,187],i*3)});
 geometry.setAttribute('color',new T.BufferAttribute(colors,3,true));mesh.geometry=geometry;mesh.material=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,metalness:.45,roughness:.38,side:T.DoubleSide});
 });
 const sign=put(g,makeBox(.42,.16,.22,.027,M.paper),0,size.y+.075,0);panel(g,.355,.11,textTexture('TAXI'),0,size.y+.077,.112,.03);const rear=panel(g,.355,.11,textTexture('TAXI'),0,size.y+.077,-.112,.03);rear.rotation.y=Math.PI;
 // Project the original wordmark directly onto the curved doors.
 const advert=texture(1438,360,(c,W,H)=>drawLogo(c,0,0,W));
 const body=[];g.traverse(o=>{if(o.isMesh&&/body|zx|livery/.test(o.userData.originalMaterial||''))body.push(o)});g.updateMatrixWorld(true);
 for(const side of [-1,1]){const verts=[],uv=[],idx=[],cols=24,rows=6,ray=new T.Raycaster();
 for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
 const u=col/cols,v=row/rows,x=-.03+(u-.5)*1.28,y=size.y*.48+(v-.5)*.32;
 ray.set(new T.Vector3(x,y,side*2.5),new T.Vector3(0,0,-side));const hit=ray.intersectObjects(body,false)[0];
 verts.push(x,y,hit?hit.point.z+side*.004:side*(size.z/2-.04));uv.push(side>0?u:1-u,v);
 }
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const a=row*(cols+1)+col,b=a+1,c=a+cols+1,d=c+1;idx.push(a,b,d,a,d,c)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const material=new T.MeshBasicMaterial({map:advert,toneMapped:false,transparent:true,alphaTest:.03,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});g.add(new T.Mesh(geo,material));
 }
 return g;
}
function place(root,item,x,y,z,scale=1,yaw=0,phase=0){const pivot=new T.Group();put(root,pivot,x,y,z);pivot.scale.setScalar(scale);pivot.rotation.y=yaw;pivot.add(item);pivot.userData={yaw,phase,kind:item.userData.kind||'media',baseY:y};return pivot}
function shadow(){const tex=texture(256,256,(c,W,H)=>{const gr=c.createRadialGradient(W/2,H/2,5,W/2,H/2,W/2);gr.addColorStop(0,'rgba(42,51,70,.27)');gr.addColorStop(.45,'rgba(42,51,70,.14)');gr.addColorStop(1,'rgba(42,51,70,0)');c.fillStyle=gr;c.fillRect(0,0,W,H)});const p=new T.Mesh(new T.PlaneGeometry(4.7,2.7),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));p.rotation.x=-Math.PI/2;p.position.y=-.035;return p}

async function createStage(canvas){[logo,mark]=await Promise.all([image(localAssets?localAssets.logo:new URL('img/logo-tmc-header.png',document.baseURI).href),image(localAssets?localAssets.mark:new URL('img/brand/M_tmc-01.svg',document.baseURI).href)]);await document.fonts.ready;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xffffff,1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 const world=new T.Scene();const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromScene(new RoomEnvironment(),.025);world.environment=environment.texture;world.environmentIntensity=1.0;pmrem.dispose();world.add(new T.HemisphereLight(0xffffff,0xd3d9e8,1.0));const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(-3,5,6);world.add(key);const fill=new T.DirectionalLight(0xe5ebff,.7);fill.position.set(4,2,-2);world.add(fill);
 const camera=new T.OrthographicCamera(-3,3,2,-2,.1,40);camera.position.set(0,2.6,9);
 const taxi=await loadTaxi(),groups=[],items=[];
 for(let i=0;i<4;i++){const r=new T.Group();world.add(r);r.visible=false;groups.push(r);items.push([]);r.add(shadow())}
 const add=(i,item,x,y,z,scale=1,yaw=0,phase=0)=>{const p=place(groups[i],item,x,y,z,scale,yaw,phase);items[i].push(p);return p};
 add(0,billboard(),-.25,0,-.35,1,-.06,0);add(0,newspaper(),-1.14,.02,.61,.84,.16,1);add(0,phone(),1.2,.02,.3,1.13,-.2,2);add(0,taxi.clone(true),.04,.02,1.18,.60,-.21,3);add(0,microphone(),.48,.02,.28,.84,.12,4);
 add(1,billboard(),-.46,0,-.17,1.02,-.15,0);add(1,led(),1.03,.0,.5,1.06,-.16,1);
 add(2,taxi.clone(true),0,.02,0,1.19,-.36,0);
 add(3,tv(),.38,.16,-.23,1.12,-.11,0);add(3,microphone(),-1.05,.0,.35,1.04,.12,1);add(3,newspaper(),.90,.02,.72,.87,-.15,2);add(3,onAir(),-.6,.0,.92,.87,-.1,3);
 const frames=[{y:1.17,h:3.37},{y:1.18,h:3.24},{y:.7,h:2.7},{y:.99,h:3.07}];let chosen=0,w=0,h=0;const rotation={drag:0};
 function resize(){const rect=canvas.getBoundingClientRect();if(w!==rect.width||h!==rect.height){w=rect.width;h=rect.height;renderer.setSize(w,h,false)}const frame=frames[chosen],half=frame.h/2,aspect=w/h;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.lookAt(0,frame.y,0);camera.updateProjectionMatrix()}
 function draw(i,time=0,staticPose=false){chosen=i;resize();groups.forEach((g,k)=>g.visible=k===i);const root=groups[i];const amplitude=i===2?.42:.24;root.rotation.y=rotation.drag+(staticPose?-.05:Math.sin(time*.9)*amplitude);items[i].forEach((p,k)=>{p.rotation.y=p.userData.yaw+(staticPose?0:Math.sin(time*1.05+k*.7)*.085);p.position.y=p.userData.baseY+(staticPose?0:Math.sin(time*.9+k)*.018);p.children[0].traverse(o=>o.userData.animate?.(time))});renderer.render(world,camera)}
 function thumbnails(){const saved=renderer.getSize(new T.Vector2()),oldW=canvas.style.width,oldH=canvas.style.height;const result=[];for(let i=0;i<4;i++){draw(i,0,true);result.push(canvas.toDataURL('image/jpeg',.87))}return result}
 return {draw,rotation,thumbnails,dispose(){renderer.dispose();environment.dispose()}};
}

const routeIds=['integrate','ooh','taxiadv','radiotv'];
const services=[['Campagne cross-mediali','/campagne-cross-mediali/'],['OOH e DOOH','/ooh-dooh/'],['Pubblicità dinamica','/pubblicita-dinamica/'],['Campagne radio, TV e stampa','/campagne-radio-tv/']];
const box=document.querySelector('.tmcs'),canvas=box.querySelector('canvas'),link=box.querySelector('.tmcs-link'),media=matchMedia('(prefers-reduced-motion: reduce)'),loading=box.querySelector('.tmcs-loading');
let stage,current=0,paused=media.matches,visible=false,focused=false,timer=0,raf=0,time=0,last=0,drawn=0;
function show(i){current=i;box.querySelector('h2').textContent=services[i][0];link.setAttribute('data-go',routeIds[i]);link.href=window.TMC_PAGINE?new URL(services[i][1].slice(1),document.baseURI).href:'#'+routeIds[i];link.setAttribute('aria-label','Scopri '+services[i][0]);if(stage){stage.draw(current,time);if(!media.matches)canvas.animate([{opacity:.25},{opacity:1}],{duration:350,easing:'ease-out'})}schedule()}
function loop(now){raf=0;if(!stage||!visible||document.hidden||paused)return;const dt=last?Math.min((now-last)/1000,.08):0;last=now;time+=dt;if(now-drawn>32){stage.draw(current,time);drawn=now}raf=requestAnimationFrame(loop)}
function schedule(){clearTimeout(timer);timer=0;const active=visible&&!document.hidden&&!!stage;box.dataset.motion=active&&!paused?'running':'paused';box.dataset.sequence=!paused&&!focused?'automatic':'paused';if(active&&!paused){if(!raf){last=0;raf=requestAnimationFrame(loop)}if(!focused)timer=setTimeout(()=>show((current+1)%4),4000)}else{cancelAnimationFrame(raf);raf=0;if(stage&&active)stage.draw(current,time,media.matches&&time===0)}}
link.addEventListener('focus',()=>{focused=true;schedule()});link.addEventListener('blur',()=>{focused=false;schedule()});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.05;schedule()},{threshold:[0,.05]}).observe(canvas);
document.addEventListener('visibilitychange',schedule);media.addEventListener('change',()=>{paused=media.matches;schedule()});
new ResizeObserver(()=>{if(stage&&visible)stage.draw(current,time)}).observe(canvas);
try{stage=await createStage(canvas);loading.remove();stage.draw(current,time,media.matches);schedule()}catch(err){loading.textContent='Non riesco a caricare la scena 3D. Puoi comunque aprire il servizio.';console.error(err)}

}catch(error){const message=component.querySelector('.tmcs-loading');if(message)message.textContent='Puoi aprire il servizio cliccando sul titolo.';console.error('Scene servizi:',error)}
})();
