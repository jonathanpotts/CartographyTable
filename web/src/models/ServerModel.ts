import WorldModel from './WorldModel';

/**
 * Stores data used to process a server.
 */
interface ServerModel {
  /**
   * Message of the day on the server.
   */
  motd: string;

  /**
   * Worlds on the server.
   */
  worlds: Array<WorldModel>;
}

export default ServerModel;
