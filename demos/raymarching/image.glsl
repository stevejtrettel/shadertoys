// Raymarching
// Advanced 3D rendering using signed distance functions
//
// Click and drag to orbit the camera around the scene.
// This demonstrates iMouse for interactive camera control.

// ============================================================================
// Distance Functions
// ============================================================================

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Smooth minimum for blending
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// ============================================================================
// Scene Definition
// ============================================================================

float map(vec3 p) {
    // Animated sphere
    vec3 spherePos = vec3(sin(iTime) * 0.5, 0.0, cos(iTime) * 0.5);
    float sphere = sdSphere(p - spherePos, 0.4);

    // Spinning torus
    float angle = iTime * 0.5;
    vec3 tp = p;
    tp.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * tp.xz;
    float torus = sdTorus(tp, vec2(0.8, 0.2));

    // Ground plane (approximated as large box)
    float ground = p.y + 1.0;

    // Combine with smooth blending
    float d = smin(sphere, torus, 0.3);
    d = min(d, ground);

    return d;
}

// ============================================================================
// Rendering
// ============================================================================

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) break;
        t += d;
        if (t > 20.0) break;
    }
    return t;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Camera setup with mouse control
    vec2 mouse = iMouse.xy / iResolution.xy;
    if (iMouse.z <= 0.0) {
        mouse = vec2(0.5 + iTime * 0.05, 0.4); // Auto-rotate when not dragging
    }

    float theta = (mouse.x - 0.5) * 6.28318;
    float phi = (mouse.y - 0.5) * 3.14159 * 0.5;

    vec3 ro = vec3(
        4.0 * cos(theta) * cos(phi),
        2.0 + 2.0 * sin(phi),
        4.0 * sin(theta) * cos(phi)
    );
    vec3 target = vec3(0.0, 0.0, 0.0);

    // Camera matrix
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(vec3(0, 1, 0), forward));
    vec3 up = cross(forward, right);

    vec3 rd = normalize(uv.x * right + uv.y * up + 1.5 * forward);

    // Raymarch
    float t = raymarch(ro, rd);

    // Shading
    vec3 col = vec3(0.1, 0.1, 0.15); // Background

    if (t < 20.0) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);

        // Lighting
        vec3 lightDir = normalize(vec3(1, 2, -1));
        float diff = max(dot(n, lightDir), 0.0);
        float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);

        // Material color based on position
        vec3 matCol = 0.5 + 0.5 * cos(p.y * 2.0 + vec3(0, 2, 4));

        col = matCol * (0.2 + 0.8 * diff) + vec3(1.0) * spec * 0.5;

        // Fog
        col = mix(col, vec3(0.1, 0.1, 0.15), 1.0 - exp(-t * 0.1));
    }

    // Gamma correction
    col = pow(col, vec3(0.4545));

    fragColor = vec4(col, 1.0);
}
