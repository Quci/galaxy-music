import * as THREE from 'three';
import {
  createPlanet,
  createStar,
  createBlackHole,
  createMoon,
  createComet,
  createNebula
} from './celestial-bodies';

// 以下暴露所有天体样式创建函数，但现在每个函数都是从各自的模块导入的
export {
  createPlanet,
  createStar,
  createBlackHole,
  createMoon,
  createComet,
  createNebula
};
