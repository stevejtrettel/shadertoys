// Empty stub for editor module when editor is disabled
// This file is aliased in place of the real editor when __EDITOR_ENABLED__ is false

export function createEditor() {
  throw new Error('Editor not enabled in this build');
}

export class EditorPanel {
  constructor() {
    throw new Error('Editor not enabled in this build');
  }
  setRecompileHandler() {}
  dispose() {}
}
