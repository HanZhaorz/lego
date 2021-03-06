import { Camera, CameraType } from "./Camera";
import { Scene, SceneType } from "./Scene";
import { Light, LightType } from "./Light";
import { RendererFactory, RendererType } from "./Renderer";
import { ControlFactory, ControlType } from "./Control";
import { MapControls } from "three/examples/jsm/controls/OrbitControls";

import { WEBGL } from "../utils/WebGl.js";
import {
  Scene as tScene,
  Camera as tCamera,
  Light as tLight,
  Renderer,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Mesh,
  Shape,
  Color
} from "three";

import { CameraOptions } from "../config/camera";
import { SceneOptions } from "../config/scene";
import Stats from "stats.js";
import Helper from "../utils/Helper";
import Model from "./Model";
import Interaction from "./Interaction";
import {
  AmbientOptions,
  DirectionalOptions,
  LightOptions
} from "../config/light";
import merge from "lodash/merge";
import { RenderOptions, renderOptions, HelperOptions } from "../config/lego";

export default class Lego {
  el: HTMLElement;
  // 场景
  scene: tScene;

  // 相机
  camera: tCamera;

  // 渲染器
  renderer: Renderer;

  // 控制器
  control: MapControls;

  // 场地
  ground: Mesh | null = null;

  // 环境光
  ambientLight: tLight;

  // 平行光
  directionalLight: tLight;

  // 调试函数组
  debugList: Function[] = [];

  constructor({
    el,
    camera: cameraOptions,
    scene: sceneOptions,
    ambient: ambientOptions,
    directional: directionalOptions
  }: LegoOptions) {
    if (!el || el.toString() !== "[object HTMLDivElement]") {
      throw new Error("请传入需要被挂载的document节点元素");
    }

    if (!this.compatibilityCheck(el)) throw new Error("此浏览器不支持webgl");

    // 挂载元素
    this.el = el;
    // 场景
    this.scene = this.initScene(sceneOptions);
    // 相机
    this.camera = this.initCamera(cameraOptions, el);
    // 光照工厂
    const lf = new Light(this);
    // 环境光
    this.ambientLight = this.initAmbientLight(lf, ambientOptions);
    // 平行光
    this.directionalLight = this.initDirectionalLight(lf, directionalOptions);
    // 渲染器
    this.renderer = this.initRenderer(el);
    // 控制器
    this.control = this.initControl(this.camera, el);
    console.log(this.control);
  }

  initScene(options: SceneOptions | undefined) {
    return new Scene().crtScene(SceneType.Scene, options);
  }

  initCamera(options: CameraOptions | undefined, el: HTMLElement) {
    return new Camera(el, this).crtCamera(CameraType.Orthographic, options);
  }

  initRenderer(el: HTMLElement) {
    return new RendererFactory(el).getRenderer(RendererType.WebGLRenderer);
  }

  initControl(camera: tCamera, el: HTMLElement) {
    return new ControlFactory(el, camera).getControl(ControlType.MapControls);
  }

  initAmbientLight(lightFactory: Light, options: LightOptions | undefined) {
    return lightFactory.crtLight(LightType.Ambient, options);
  }

  initDirectionalLight(
    lightFactory: Light,
    options: DirectionalOptions | undefined
  ) {
    return lightFactory.crtLight(LightType.Directional, options);
  }

  initHelper(helperOptions: HelperOptions, scene: tScene, el: HTMLElement) {
    const helper = new Helper(scene, el);
    const { grid, stats } = helperOptions;
    grid && helper.addGrid(grid);
    if (typeof stats === "number") {
      this.debugList.push(helper.addStats(stats));
    }
  }

  /**
   * 兼容性检测
   * @param el 挂载节点
   */
  compatibilityCheck(el: HTMLElement): boolean {
    if (WEBGL.isWebGLAvailable()) {
      return true;
    } else {
      const warning = WEBGL.getWebGLErrorMessage();
      el.appendChild(warning);
      return false;
    }
  }

  /**
   * 创建场地
   */
  createGround() {
    const groundShape = new Shape();
    const extrudeSettings = {
      steps: 2,
      depth: 10,
      bevelEnabled: true,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0,
      bevelSegments: 1
    };

    groundShape.moveTo(-250, -200);
    groundShape.lineTo(-250, 200);
    groundShape.lineTo(250, 200);
    groundShape.lineTo(250, -200);
    const geometry = new ExtrudeGeometry(groundShape, extrudeSettings);
    const material = new MeshStandardMaterial({ color: new Color("#efefef") });
    this.ground = new Mesh(geometry, material);
    this.scene.add(this.ground);
  }

  /**
   * 渲染
   */
  render(options?: RenderOptions) {
    const { scene } = this;
    scene.add(Model.group);
    scene.add(this.ambientLight);
    scene.add(this.directionalLight);
    const { helper } = merge(renderOptions, options);
    this.initHelper(helper, scene, this.el);
    new Interaction(this.camera, scene).addClickHandle(i => console.log(i));
    this.animate();
  }

  /**
   * 动画
   */
  animate = () => {
    this.debugList.forEach(f => f());
    this.control.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };

  debug() {
    const { control, scene, renderer, camera } = this;
    const stats = new Stats();
    stats.showPanel(0);
    this.el.appendChild(stats.dom);

    const animate = () => {
      renderer.render(scene, camera);
      control.update();
      stats.update();
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// 构造函数配置项
interface LegoOptions {
  /**
   * 挂载元素
   */
  el: HTMLElement | null;
  /**
   * 相机配置
   */
  camera?: CameraOptions;
  /**
   * 场景配置
   */
  scene?: SceneOptions;
  /**
   * 环境光配置
   */
  ambient?: AmbientOptions;
  /**
   * 平行光配置
   */
  directional?: DirectionalOptions;
}
