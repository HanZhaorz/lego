import dat from "dat.gui";
import clone from "lodash/clone";

export default class Debug {
  static gui = new dat.GUI();
  /**
   * 倍数
   */
  multiple: number;

  constructor(multiple = 3) {
    this.multiple = multiple;
  }

  add(name: string, options: any) {
    options = clone(options);
    const folder = Debug.gui.addFolder(name);
    for (const key in options) {
      if (key === "color") {
        folder.addColor(options, key);
      } else {
        folder.add(
          options,
          key,
          -options[key] * this.multiple,
          options[key] * this.multiple
        );
      }
    }
    return options;
  }
}
