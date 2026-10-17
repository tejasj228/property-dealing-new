import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from 'three';
import { createAssetPool } from '../components/landing/asset-pool.mjs';
import { createSceneLife } from '../components/landing/scene-life.mjs';
import { createBotanicalKit } from '../components/landing/botanical-trees.mjs';
import { createCloudGeometry } from '../components/landing/cloud-volume.mjs';

test('multiple scenes share one texture and release it only after the final consumer',()=>{
 const pool=createAssetPool();let loads=0,dispose=0,ready,wakes=0;
 const create=callback=>{loads++;ready=callback;return {dispose:()=>dispose++};};
 const first=pool.acquire('stone',create,()=>wakes++), second=pool.acquire('stone',create,()=>wakes+=10);
 assert.equal(first.asset,second.asset);assert.equal(loads,1);
 first.release();assert.equal(dispose,0);ready();assert.equal(wakes,10);
 second.release();second.release();assert.equal(dispose,1);assert.equal(pool.size,0);
});
test('an abandoned texture request cannot wake a new scene after remount',()=>{
 const pool=createAssetPool();let oldReady,wakes=0;
 const old=pool.acquire('stone',callback=>{oldReady=callback;return {dispose(){}};},()=>wakes++);
 old.release();const fresh=pool.acquire('stone',()=>({dispose(){}}),()=>wakes+=10);
 oldReady();assert.equal(wakes,0);assert.equal(pool.size,1);fresh.release();
});
test('clouds use a bounded prebuilt surface and soft-edge shading',()=>{
 const geometry=createCloudGeometry();geometry.computeBoundingBox();
 assert.ok(geometry.getAttribute('position').count<5000);
 assert.ok(geometry.boundingBox.max.x<=.9);assert.ok(geometry.boundingBox.max.y<=.33);
 const root=new Group();createSceneLife(root);
 const cloud=root.getObjectByName('drifting-cloud');assert.equal(cloud.children.length,1);
 assert.equal(cloud.children[0].name,'continuous-cloud-volume');
 const shader={fragmentShader:'#include <opaque_fragment>'};cloud.children[0].material.onBeforeCompile(shader);
 assert.match(shader.fragmentShader,/smoothstep/);
 const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());geometry.dispose();
});
test('stronger gusts stay bounded and reduced motion freezes vegetation',()=>{
 const kit=createBotanicalKit(),root=new Group();kit.tree(root,0,0);
 const crown=root.getObjectByName('tree-crown');let maximum=0;
 for(let time=0;time<20;time+=.1){kit.animate(time);maximum=Math.max(maximum,Math.abs(crown.rotation.z));assert.ok(Math.abs(crown.rotation.z)<.1);}
 assert.ok(maximum>.07);kit.animate(8,true);assert.equal(crown.rotation.z,0);
 root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});kit.resources.geometries.forEach(g=>g.dispose());kit.resources.materials.forEach(m=>m.dispose());
});
