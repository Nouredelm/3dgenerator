/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PreviewObject {
  type: 'box' | 'cylinder' | 'sphere' | 'torus';
  args: number[]; // box: [x,y,z], cylinder: [top, bottom, height], sphere: [radius], torus: [radius, tube]
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  name?: string;
}

export interface GeneratedModel {
  title: string;
  description: string;
  scadCode: string;
  parameters: ModelParameter[];
  preview: PreviewObject[];
}

export interface ModelParameter {
  name: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  value: any;
  min?: number;
  max?: number;
  step?: number;
}
