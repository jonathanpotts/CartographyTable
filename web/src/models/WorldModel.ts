import VectorXYZ from './VectorXYZ';

/**
 * Stores data needed to process a world.
 */
interface WorldModel {
  /**
   * The name of the world.
   */
  name: string;

  /**
   * The spawn point of the world.
   */
  spawn: VectorXYZ;

  /**
   * The minimum height of the world.
   */
  minHeight: number;

  /**
   * The maximum height of the world.
   */
  maxHeight: number;
}

export default WorldModel;
