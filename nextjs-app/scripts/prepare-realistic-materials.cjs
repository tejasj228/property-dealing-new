// Offline asset preparation. Powered by Poly Haven: https://polyhaven.com
// Runtime uses only the self-hosted CC0 files; it does not call their API.
const fs=require('node:fs/promises'), path=require('node:path'), sharp=require('sharp');
const out=path.join(__dirname,'../public/textures/pbr');
const headers={'User-Agent':'PawanBuildhome-LocalAssetPreparation/1.0'};
async function get(url){const r=await fetch(url,{headers});if(!r.ok)throw Error(`${r.status}: ${url}`);return r;}
async function main(){
 await fs.mkdir(out,{recursive:true});const sources=[];
 for(const [name,id] of Object.entries({concrete:'brushed_concrete',wood:'wood_floor_deck',asphalt:'asphalt_02',ground:'grass_ground',bark:'bark_brown_02'})){
  const files=await(await get('https://api.polyhaven.com/files/'+id)).json();
  for(const [type,key] of Object.entries({color:'Diffuse',normal:'nor_gl',roughness:'Rough'})){
   const source=files[key]['1k'].jpg;const data=Buffer.from(await(await get(source.url)).arrayBuffer());
   for(const [size,suffix] of [[type==='color'?1024:type==='normal'?512:256,''],[256,'-compact']]) await sharp(data).resize(size,size).webp({quality:type==='normal'?95:85}).toFile(path.join(out,`${name}-${type}${suffix}.webp`));
   sources.push({asset:id,map:key,url:source.url,license:'CC0-1.0',page:'https://polyhaven.com/a/'+id});
  }
  console.log('Prepared scanned material:',name);
 }
 const id='autumn_field_puresky',data=await(await get('https://api.polyhaven.com/files/'+id)).json();
 const source=data.hdri['1k'].hdr;
 await fs.writeFile(path.join(out,'autumn-sky.hdr'),Buffer.from(await(await get(source.url)).arrayBuffer()));
 sources.push({asset:id,url:source.url,license:'CC0-1.0',page:'https://polyhaven.com/a/'+id});
 await fs.writeFile(path.join(out,'SOURCES.json'),JSON.stringify(sources,null,2));
 console.log('Prepared outdoor HDR environment.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
