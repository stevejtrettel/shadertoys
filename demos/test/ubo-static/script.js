// Static UBO test — fill a palette once at setup, shader reads it

export function setup(engine) {
  const count = 16;
  // 16 vec4 colors = 64 floats
  const data = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // HSL-ish rainbow palette
    const r = Math.sin(t * Math.PI * 2.0) * 0.5 + 0.5;
    const g = Math.sin(t * Math.PI * 2.0 + 2.094) * 0.5 + 0.5;
    const b = Math.sin(t * Math.PI * 2.0 + 4.189) * 0.5 + 0.5;
    data[i * 4 + 0] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 1.0;
  }

  engine.setUniformValue('colors', data);
}
