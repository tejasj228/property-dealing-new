import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';

// Individual folded leaves and tapered branches, shared and instanced per tree.
// Seeded placement keeps the same tree silhouette after hydration and remounts.
export function createBotanicalKit({ compact = false } = {}) {
  const leafGeometry = new BufferGeometry();
  leafGeometry.setAttribute('position',new Float32BufferAttribute([0,0,0,-.36,.3,0,-.48,.65,.01,0,1,0,.48,.65,.01,.36,.3,0,0,.52,.13],3));
  leafGeometry.setAttribute('uv',new Float32BufferAttribute([.5,0,.14,.3,.02,.65,.5,1,.98,.65,.86,.3,.5,.52],2));
  leafGeometry.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leafGeometry.computeVertexNormals();
  const branchGeometry = new CylinderGeometry(.55,1,1,8);
  const leavesMaterial = new MeshStandardMaterial({name:'autumn-leaf',color:'#ffffff',roughness:.8,side:DoubleSide});
  const barkMaterial = new MeshStandardMaterial({name:'trunk',color:'#b9a591',roughness:1});
  const crowns=[], matrix=new Matrix4(), rotation=new Quaternion(), up=new Vector3(0,1,0), color=new Color();
  function tree(parent,x,z,size=1) {
    let seed=(Math.round((x+20)*971+(z+20)*479+size*991)|0)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const root=new Group();root.name='botanical-tree';root.position.set(x,0,z);root.scale.setScalar(size);parent.add(root);
    const crown=new Group();crown.name='tree-crown';crown.userData.animated=true;root.add(crown);crowns.push(crown);
    const branchCount=14, perBranch=compact?22:46;
    const leaves=new InstancedMesh(leafGeometry,leavesMaterial,branchCount*perBranch);
    const branches=new InstancedMesh(branchGeometry,barkMaterial,1+branchCount*2);
    leaves.name='individual-autumn-leaves';branches.name='tapered-tree-branches';
    function branch(index,a,b,radius) { const delta=b.clone().sub(a);rotation.setFromUnitVectors(up,delta.clone().normalize());matrix.compose(a.clone().add(b).multiplyScalar(.5),rotation,new Vector3(radius,delta.length(),radius));branches.setMatrixAt(index,matrix); }
    branch(0,new Vector3(0,.04,0),new Vector3(.025,1.26,0),.048);
    for(let b=0;b<branchCount;b++) {
      const angle=b*2.39996, y=.75+(b%5)*.15, radius=.31+random()*.12;
      const tip=new Vector3(Math.cos(angle)*radius,y,Math.sin(angle)*radius);
      const joint=new Vector3(0,.38+(b%5)*.13,0);
      branch(1+b*2,joint,tip,.011+(1-y/2)*.008);
      branch(2+b*2,tip.clone().lerp(joint,.3),tip.clone().add(new Vector3(.06,.17,-.04)),.006);
      for(let j=0;j<perBranch;j++) {
        const a=random()*Math.PI*2, v=random()*2-1, r=Math.cbrt(random()), h=Math.sqrt(1-v*v);
        const position=tip.clone().add(new Vector3(Math.cos(a)*h*r*.19,v*r*.22,Math.sin(a)*h*r*.19));
        rotation.setFromAxisAngle(new Vector3(random()-.5,random()-.5,random()-.5).normalize(),random()*Math.PI*2);
        matrix.compose(position,rotation,new Vector3(.065+random()*.035,.085+random()*.045,1));
        const index=b*perBranch+j;leaves.setMatrixAt(index,matrix);
        color.setHSL(.075+random()*.065,.48+random()*.35,.24+random()*.22);leaves.setColorAt(index,color);
      }
    }
    leaves.castShadow=true;leaves.receiveShadow=true;branches.castShadow=true;branches.receiveShadow=true;
    crown.add(branches,leaves);return root;
  }
  function animate(seconds,reduced=false){crowns.forEach((crown,i)=>{crown.rotation.z=reduced?0:(.045 + Math.sin(seconds*.85+i*.65)*.04 + Math.sin(seconds*2.1+i*1.7)*.012);crown.rotation.x=reduced?0:Math.sin(seconds*1.2+i)*.027;});}
  return {tree,animate,resources:{geometries:[leafGeometry,branchGeometry],materials:[leavesMaterial,barkMaterial]}};
}
