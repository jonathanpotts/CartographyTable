import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

/**
 * A weighted model.
 */
interface WeightedModel {
  /**
   * Weight of the model.
   */
  weight: number;

  /**
   * Model.
   */
  model: TransformNode;
}

export default WeightedModel;
