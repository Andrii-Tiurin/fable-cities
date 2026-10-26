import fs from 'node:fs';
const file='src/core/CameraController.js';
let s=fs.readFileSync(file,'utf8');
const needle='    this.updateCameraTransform(true);';
if(!s.includes(needle))throw new Error('Camera controller interface changed');
const add=`
    // CIVITAS mobile: two-finger drag pans, pinch zooms. One-finger tap remains available for city tools.
    this._mobileTouches = null;
    canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length >= 2) {
        const [a,b] = event.touches;
        this._mobileTouches = { x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2,
          gap:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY) };
      }
    }, {passive:true});
    canvas.addEventListener('touchmove', (event) => {
      if (event.touches.length < 2) return;
      event.preventDefault();
      const [a,b] = event.touches;
      const x=(a.clientX+b.clientX)/2, y=(a.clientY+b.clientY)/2;
      const gap=Math.max(10,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY));
      const last=this._mobileTouches;
      if(last){
        const factor=this.desired.distance/Math.max(240,canvas.clientHeight);
        const angle=this.desired.yaw;
        const dx=(x-last.x)*factor*1.7, dz=(y-last.y)*factor*1.7;
        this.desired.target.x += -Math.cos(angle)*dx - Math.sin(angle)*dz;
        this.desired.target.z += Math.sin(angle)*dx - Math.cos(angle)*dz;
        this.desired.distance=Math.max(this.minDistance,Math.min(this.maxDistance,this.desired.distance*last.gap/gap));
      }
      this._mobileTouches={x,y,gap};
    }, {passive:false});
    canvas.addEventListener('touchend', (event)=>{if(event.touches.length<2)this._mobileTouches=null;},{passive:true});
`;
s=s.replace(needle,add+needle);
fs.writeFileSync(file,s);
let html=fs.readFileSync('index.html','utf8');
html=html.replace('<title>Fable Cities</title>','<title>CIVITAS — ONE WORLD</title>');
html=html.replace('>Fable Cities</h1>','>CIVITAS</h1>');
html=html.replace('<meta name="viewport" content="width=device-width, initial-scale=1" />','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
html=html.replace('</head>','<style>@media (max-width: 700px) {#loading h1{font-size:24px!important}#loading .bar{width:min(75vw,320px)!important}button{min-height:40px}#ui-root{max-width:100vw;overflow:hidden}}@media (pointer:coarse){#game{touch-action:none}} </style></head>');
fs.writeFileSync('index.html',html);
console.log('CIVITAS mobile camera and branding patch applied');
