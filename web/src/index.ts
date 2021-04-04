import './index.scss';
import ServerLoader from './ServerLoader';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const serverLoader = new ServerLoader(canvas);
serverLoader.load();
