import { Tags } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { ungzip } from 'pako';
import BlockDataModel from './models/BlockDataModel';
import VectorXZ from './models/VectorXZ';
import WorldModel from './models/WorldModel';

export default class WorldLoader {
  public constructor(private world: WorldModel, private scene: Scene) {
  }

  public async loadChunkAsync(coordinates: VectorXZ): Promise<void> {
    const response = await fetch(`data/worlds/${this.world.name}/${coordinates.x}.${coordinates.z}.json.gz`);
    if (!response.ok) {
      throw new Error('Unable to fetch chunk data');
    }

    const data = new Uint8Array(await response.arrayBuffer());
    const json = ungzip(data, { to: 'string' });
    const chunkBlocks:
      Record<number, Record<number, Record<number, BlockDataModel>>> = JSON.parse(json);

    const blocks: Map<Vector3, Mesh> = new Map();

    for (const [y, yMap] of Object.entries(chunkBlocks)) {
      for (const [x, xMap] of Object.entries(yMap)) {
        for (const [z, blockModel] of Object.entries(xMap)) {
          const blockCoordinates = new Vector3(parseInt(x, 10), parseInt(y, 10), parseInt(z, 10));
        }
      }
    }

    const subMeshes: Mesh[] = [];

    for (const [blockCoordinates, blockMesh] of blocks) {
      // check for face culling
      for (const blockSubMesh of blockMesh.subMeshes) {
        const tags = Tags.GetTags(blockSubMesh);
      }

      subMeshes.push(blockMesh);
    }

    const chunk = Mesh.MergeMeshes(subMeshes);
  }
}
