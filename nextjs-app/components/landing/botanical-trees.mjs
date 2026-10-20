import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';

// Street trees of the NCR: neem and ficus greens, dark ashoka, and the yellow amaltas and
// red-orange gulmohar in flower. Each entry is [share, foliage HSL, blossom HSL, blossom share].
const SPECIES = [
  [.38, [.24, .5, .15], null, 0],
  [.2, [.3, .45, .1], null, 0],
  [.14, [.2, .55, .19], null, 0],
  [.14, [.24, .48, .15], [.135, .85, .46], .5],
  [.14, [.27, .5, .13], [.022, .82, .4], .45],
];

// Individual folded leaves and tapered branches. Seeded placement keeps the same tree
// silhouette after hydration and remounts. Close scenes give each tree its own swaying
// crown; with `forest`, trees are planted as markers and later merged into one leaf and
// one branch draw for the whole board, swaying in the vertex shader instead.
export function createBotanicalKit({ compact = false, forest = false } = {}) {
  const leafGeometry = new BufferGeometry();
  leafGeometry.setAttribute('position',new Float32BufferAttribute([0,0,0,-.36,.3,0,-.48,.65,.01,0,1,0,.48,.65,.01,.36,.3,0,0,.52,.13],3));
  leafGeometry.setAttribute('uv',new Float32BufferAttribute([.5,0,.14,.3,.02,.65,.5,1,.98,.65,.86,.3,.5,.52],2));
  leafGeometry.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leafGeometry.computeVertexNormals();
  const branchGeometry = new CylinderGeometry(.55,1,1,8);
  const leavesMaterial = new MeshStandardMaterial({name:'autumn-leaf',color:'#ffffff',roughness:.8,side:DoubleSide});
  const barkMaterial = new MeshStandardMaterial({name:'trunk',color:'#b9a591',roughness:1});
  const geometries = [leafGeometry, branchGeometry], materials = [leavesMaterial, barkMaterial];
  const crowns=[], matrix=new Matrix4(), rotation=new Quaternion(), up=new Vector3(0,1,0), color=new Color();
  // Grows one tree into callbacks: branch(index, matrix) and leaf(index, matrix, colour, crown-local position).
  function grow(x,z,size,perBranch,leafScale,branch,leaf) {
    let seed=(Math.round((x+20)*971+(z+20)*479+size*991)|0)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const pick=random();let total=0;const [, foliage, blossom, share]=SPECIES.find(entry=>(total+=entry[0])>=pick)||SPECIES[0];
    const branchCount=14;
    const limb=(index,a,b,radius)=>{const delta=b.clone().sub(a);rotation.setFromUnitVectors(up,delta.clone().normalize());branch(index,matrix.compose(a.clone().add(b).multiplyScalar(.5),rotation,new Vector3(radius,delta.length(),radius)));};
    limb(0,new Vector3(0,.04,0),new Vector3(.025,1.26,0),.048);
    for(let b=0;b<branchCount;b++) {
      const angle=b*2.39996, y=.75+(b%5)*.15, radius=.31+random()*.12;
      const tip=new Vector3(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      const joint=new Vector3(0,.38+(b%5)*.13,0);
      limb(1+b*2,joint,tip,.011+(1-y/2)*.008);
      limb(2+b*2,tip.clone().lerp(joint,.3),tip.clone().add(new Vector3(.06,.17,-.04)),.006);
      for(let j=0;j<perBranch;j++) {
        const a=random()*Math.PI*2, v=random()*2-1, r=Math.cbrt(random()), h=Math.sqrt(1-v*v);
        const position=tip.clone().add(new Vector3(Math.cos(a)*h*r*.19,v*r*.22,Math.sin(a)*h*r*.19));
        rotation.setFromAxisAngle(new Vector3(random()-.5,random()-.5,random()-.5).normalize(),random()*Math.PI*2);
        matrix.compose(position,rotation,new Vector3((.065+random()*.035)*leafScale,(.085+random()*.045)*leafScale,1));
        const tone=blossom&&random()<share?blossom:foliage;
        color.setHSL(tone[0]+(random()-.5)*.035,tone[1]+(random()-.5)*.2,tone[2]*(.78+random()*.44));
        leaf(b*perBranch+j,matrix,color,position);
      }
    }
    return branchCount;
  }
  function tree(parent,x,z,size=1) {
    const root=new Group();root.name='botanical-tree';root.position.set(x,0,z);root.scale.setScalar(size);parent.add(root);
    if(forest){root.userData.plant={x,z,size};return root;}
    const crown=new Group();crown.name='tree-crown';crown.userData.animated=true;root.add(crown);crowns.push(crown);
    const perBranch=compact?22:46;
    const leaves=new InstancedMesh(leafGeometry,leavesMaterial,14*perBranch);
    const branches=new InstancedMesh(branchGeometry,barkMaterial,1+14*2);
    leaves.name='individual-autumn-leaves';branches.name='tapered-tree-branches';
    grow(x,z,size,perBranch,1,(i,m)=>branches.setMatrixAt(i,m),(i,m,c)=>{leaves.setMatrixAt(i,m);leaves.setColorAt(i,c);});
    leaves.castShadow=true;leaves.receiveShadow=true;branches.castShadow=true;branches.receiveShadow=true;
    crown.add(branches,leaves);return root;
  }
  // Merges every planted marker under `root` into two instanced draws.
  function plantForest(root) {
    root.updateMatrixWorld(true);
    const plants=[];root.traverse(o=>{if(o.userData.plant)plants.push(o);});
    const perBranch=compact?9:14, leafCount=14*perBranch, branchCount=15;
    const leafMaterial=leavesMaterial.clone();leafMaterial.defines={RL_FOREST:1};materials.push(leafMaterial);
    // At city distance a leaf is a few pixels: a two-triangle blade reads the same.
    const forestLeaf=new BufferGeometry();forestLeaf.setAttribute('position',new Float32BufferAttribute([0,0,0,-.42,.5,.05,0,1,0,.42,.5,.05],3));forestLeaf.setAttribute('uv',new Float32BufferAttribute([.5,0,0,.5,.5,1,1,.5],2));forestLeaf.setIndex([0,1,2,0,2,3]);forestLeaf.computeVertexNormals();geometries.push(forestLeaf);
    // Trunk and main limbs only, as open five-sided tubes; twigs vanish at this distance.
    const limbGeometry=new CylinderGeometry(.55,1,1,5,1,true);geometries.push(limbGeometry);
    const leaves=new InstancedMesh(forestLeaf,leafMaterial,Math.max(1,plants.length*leafCount)),branches=new InstancedMesh(limbGeometry,barkMaterial,Math.max(1,plants.length*branchCount));
    leaves.name='forest-leaves';branches.name='forest-branches';leaves.count=plants.length*leafCount;branches.count=plants.length*branchCount;
    const crown=new Float32Array(Math.max(1,plants.length*leafCount)*3),inverse=new Matrix4().copy(root.matrixWorld).invert(),plantMatrix=new Matrix4(),world=new Matrix4();
    plants.forEach((plant,p)=>{
      plantMatrix.multiplyMatrices(inverse,plant.matrixWorld);const {x,z,size}=plant.userData.plant;
      grow(x,z,size,perBranch,1.45,(i,m)=>{if(i===0||i%2)branches.setMatrixAt(p*branchCount+(i+1>>1),world.multiplyMatrices(plantMatrix,m));},(i,m,c,position)=>{
        const index=p*leafCount+i;leaves.setMatrixAt(index,world.multiplyMatrices(plantMatrix,m));leaves.setColorAt(index,c);crown.set([position.x,position.y,position.z],index*3);
      });
    });
    forestLeaf.setAttribute('rlCrown',new InstancedBufferAttribute(crown,3));
    leaves.castShadow=branches.castShadow=true;leaves.receiveShadow=branches.receiveShadow=true;
    leaves.computeBoundingSphere();branches.computeBoundingSphere();root.add(branches,leaves);
    return {trees:plants.length};
  }
  function animate(seconds,reduced=false){crowns.forEach((crown,i)=>{crown.rotation.z=reduced?0:(.045 + Math.sin(seconds*.85+i*.65)*.04 + Math.sin(seconds*2.1+i*1.7)*.012);crown.rotation.x=reduced?0:Math.sin(seconds*1.2+i)*.027;});}
  return {tree,plantForest,animate,resources:{geometries,materials}};
}
