# Uniform Controls Test

This shader demonstrates all supported uniform control types in the shader-sandbox system.

## Supported Uniform Types

| Type | Control | Example |
|------|---------|---------|
| `float` | Slider | Animation speed, scale |
| `int` | Slider (discrete) | Ring count |
| `bool` | Toggle switch | Enable/disable animation |
| `vec2` | XY position pad | Center offset |
| `vec3` | Color picker | Base color |

## Config Example

```json
{
  "uniforms": {
    "uSpeed": {
      "type": "float",
      "value": 1.0,
      "min": 0.0,
      "max": 5.0,
      "step": 0.1,
      "label": "Animation Speed"
    },
    "uColor": {
      "type": "vec3",
      "value": [1.0, 0.5, 0.2],
      "color": true,
      "label": "Base Color"
    }
  }
}
```

## Shader Declaration

Remember to declare your uniforms in the GLSL code:

```glsl
uniform float uSpeed;
uniform vec3 uColor;
```

## Tips

- Use `color: true` on `vec3` uniforms to get a color picker instead of RGB sliders
- The `label` field is optional but recommended for user-friendly names
- `min`, `max`, and `step` are optional for numeric types
- For `vec2`, you can set per-component min/max: `"min": [0.0, 0.0]`
