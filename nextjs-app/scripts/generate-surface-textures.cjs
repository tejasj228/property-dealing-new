// Deterministic, original architectural textures. Run with Node; no browser work.
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, '../public/textures');
fs.mkdirSync(out, { recursive: true });
const noise = (x,y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
async function generate(kind, size) {
  const pixels = Buffer.alloc(size * size * 3);
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
    const u=x/size, v=y/size, fine=noise(x,y), grain=noise(Math.floor(x/4),Math.floor(y/4));
    let value=217+(fine-.5)*18+(grain-.5)*10;
    if(kind==='stone') { value+=Math.sin(u*35+Math.sin(v*20)*2)*5; if(x%(size/2)<2||y%(size/4)<2)value=155; }
    if(kind==='wood') value=202+Math.sin(u*330+Math.sin(v*9)*3+Math.sin(v*28))*18+Math.sin(u*1300+Math.sin(v*31))*6+(fine-.5)*10;
    if(kind==='foliage') value=200+(fine-.5)*28+(grain-.5)*22+Math.sin(u*65)*Math.sin(v*77)*12;
    if(kind==='asphalt') value=180+(fine-.5)*50+(grain-.5)*18;
    if(kind==='water') value=200+Math.sin(u*90+Math.sin(v*35))*18+Math.sin(v*140+u*19)*7;
    if(kind==='metal') value=220+(noise(x,0)-.5)*20+(fine-.5)*3;
    if(kind==='window') value=(x%(size/4)<2||y%(size/2)<2)?60:160+Math.floor(u*4)*18+Math.sin(u*90)*10;
    const i=(y*size+x)*3, c=Math.max(0,Math.min(255,Math.round(value)));
    pixels[i]=pixels[i+1]=pixels[i+2]=c;
  }
  const file=path.join(out,`${kind}.webp`);
  await sharp(pixels,{raw:{width:size,height:size,channels:3}}).webp({quality:82}).toFile(file);
  await sharp(file).resize(256,256).webp({quality:78}).toFile(path.join(out,`${kind}-compact.webp`));
  console.log(`${kind}: ${size} x ${size}, ${Math.round(fs.statSync(file).size/1024)} KB`);
}
Promise.all(['stone','plaster','wood','foliage','asphalt','water','metal','window'].map(kind=>generate(kind,['water','metal'].includes(kind)?512:kind==='window'?256:1024))).catch(error=>{console.error(error);process.exitCode=1;});
