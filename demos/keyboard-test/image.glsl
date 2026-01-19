// Keyboard Input Test
// Demonstrates the new config-based keyboard system
//
// Controls:
// - WASD / Arrow keys: Move the circle
// - Space: Flash effect (hold)
// - G: Toggle debug overlay

// No need to declare uniforms - they're auto-injected from config.json!
// Available uniforms:
//   key_up, key_up_pressed, key_up_released
//   key_down, key_down_pressed, key_down_released
//   key_left, key_left_pressed, key_left_released
//   key_right, key_right_pressed, key_right_released
//   key_action, key_action_pressed, key_action_released
//   key_debug (toggle mode)

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);

    // Persistent position (using a simple approach - in real use you'd use a buffer)
    // For this demo, we just show the current input state
    vec2 dir = vec2(0.0);
    dir.x = key_right - key_left;
    dir.y = key_up - key_down;

    // Circle position based on time and input
    // Move 0.3 units per second when key is held
    vec2 pos = vec2(0.5) + dir * 0.2;

    // Draw the circle
    vec2 p = (uv - pos) * aspect;
    float d = length(p);
    float circle = smoothstep(0.12, 0.11, d);

    // Base color - changes when action (space) is pressed
    vec3 circleColor = vec3(0.2, 0.6, 1.0);
    if (key_action > 0.5) {
        circleColor = vec3(1.0, 0.8, 0.2); // Yellow flash when holding space
    }

    // Pulse effect on action press (single frame)
    float pulse = key_action_pressed * 0.5;
    circle = max(circle, smoothstep(0.3 + pulse, 0.29 + pulse, d) * key_action_pressed);

    // Background gradient
    vec3 bg = mix(vec3(0.05, 0.05, 0.1), vec3(0.1, 0.05, 0.15), uv.y);

    // Combine
    vec3 col = mix(bg, circleColor, circle);

    // Debug overlay (toggle with G)
    if (key_debug > 0.5) {
        // Show key states in corners
        float margin = 0.05;
        float size = 0.03;

        // Up indicator (top center)
        vec2 upPos = vec2(0.5, 1.0 - margin);
        if (length((uv - upPos) * aspect) < size) {
            col = mix(col, vec3(0.0, 1.0, 0.0), key_up);
        }

        // Down indicator (bottom center)
        vec2 downPos = vec2(0.5, margin);
        if (length((uv - downPos) * aspect) < size) {
            col = mix(col, vec3(0.0, 1.0, 0.0), key_down);
        }

        // Left indicator (left center)
        vec2 leftPos = vec2(margin, 0.5);
        if (length((uv - leftPos) * aspect) < size) {
            col = mix(col, vec3(0.0, 1.0, 0.0), key_left);
        }

        // Right indicator (right center)
        vec2 rightPos = vec2(1.0 - margin, 0.5);
        if (length((uv - rightPos) * aspect) < size) {
            col = mix(col, vec3(0.0, 1.0, 0.0), key_right);
        }

        // Action indicator (center bottom)
        vec2 actionPos = vec2(0.5, margin * 2.5);
        if (length((uv - actionPos) * aspect) < size * 1.5) {
            col = mix(col, vec3(1.0, 1.0, 0.0), key_action);
        }

        // Debug mode indicator (top left)
        vec2 debugPos = vec2(margin, 1.0 - margin);
        if (length((uv - debugPos) * aspect) < size) {
            col = vec3(1.0, 0.0, 1.0); // Magenta = debug on
        }
    }

    fragColor = vec4(col, 1.0);
}
