declare module "troika-three-text" {
  import { Mesh } from "three";
  export class Text extends Mesh {
    text: string;
    fontSize: number;
    color: number | string;
    anchorX: string;
    anchorY: string;
    font: string;
    fontWeight: number;
    curveRadius: number;
    sync: () => void;
  }
}
