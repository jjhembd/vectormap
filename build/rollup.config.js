import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'; // Yuck... remove when possible
import { glsl } from "./glsl-plugin.js";
import pkg from "../package.json";

export default [{
  input: 'src/main.js',
  plugins: [
    glsl(),
    resolve(),
    commonjs(),
  ],
  output: {
    file: pkg.main,
    //sourcemap: 'inline',
    format: 'esm',
    name: pkg.name
  }
}, {
  input: 'src/worker.js',
  plugins: [
    resolve(),
    commonjs(),
  ],
  output: {
    file: 'dist/worker.bundle.js',
    format: 'esm',
    name: pkg.name,
  },
}];
