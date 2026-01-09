struct Ray {
    vec3 origin;
    vec3 dir;
};

struct Hit {
    float t;
    vec3 point;
    vec3 normal;
    vec3 color;
};

struct Light {
    vec3 dir;
    vec3 color;
};

Ray generateRay(vec2 fragCoord) {
    vec2 uv = (fragCoord / iResolution.xy) * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    float fov = 90.0;
    float f = 1.0 / tan(radians(fov) / 2.0);

    Ray ray;
    ray.origin = vec3(0.0);
    ray.dir = normalize(vec3(uv, -f));
    return ray;
}

mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1, 0, 0, 0, c, -s, 0, s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

Ray orbitCamera(Ray ray, float distance) {
    vec2 mouse = iMouse.xy / iResolution.xy;
    float angleY = (mouse.x - 0.5) * 6.28;
    float angleX = (0.5 - mouse.y) * 3.14;

    mat3 rot = rotateX(angleX) * rotateY(angleY);
    ray.origin = rot * vec3(0.0, 0.0, distance);
    ray.dir = rot * ray.dir;
    return ray;
}

float polynomial(vec3 p) {
    float phi = (1.0 + sqrt(5.0)) / 2.0;
    float phi2 = phi * phi;

    float x2 = p.x * p.x, y2 = p.y * p.y, z2 = p.z * p.z;

    float a = (phi2 * x2 - y2) * (phi2 * y2 - z2) * (phi2 * z2 - x2);
    float b = (x2 + y2 + z2 - 1.0);

    return 4.0 * a - (1.0 + 2.0 * phi) * b * b;
}

vec3 gradient(vec3 p) {
    float eps = 0.001;
    return vec3(
        polynomial(p + vec3(eps, 0, 0)) - polynomial(p - vec3(eps, 0, 0)),
        polynomial(p + vec3(0, eps, 0)) - polynomial(p - vec3(0, eps, 0)),
        polynomial(p + vec3(0, 0, eps)) - polynomial(p - vec3(0, 0, eps))
    ) / (2.0 * eps);
}

float sdBarth(vec3 p) {
    // Rotate the Barth surface
    mat3 spin = rotateY(iTime * 0.3);
    p = spin * p;

    // Bounding sphere
    float bounds = length(p) - 2.5;
    if (bounds > 0.01) return bounds;

    // Distance estimate for algebraic variety
    float f = polynomial(p);
    vec3 g = gradient(p);
    float glen = length(g);
    if (glen < 0.001) return 0.1;
    return 0.5 * abs(f) / glen;
}

float sceneSDF(vec3 p) {
    float barth = sdBarth(p);
    float floor = p.y + 1.8;
    return min(barth, floor);
}

vec3 sceneColor(vec3 p) {
    float barth = sdBarth(p);
    float floor = p.y + 1.8;

    if (barth < floor) {
        return vec3(0.9, 0.7, 0.5);  // Barth: gold
    }
    return vec3(0.3, 0.3, 0.35);     // Floor: gray
}

vec3 calcNormal(vec3 p) {
    float eps = 0.001;
    return normalize(vec3(
        sceneSDF(p + vec3(eps, 0, 0)) - sceneSDF(p - vec3(eps, 0, 0)),
        sceneSDF(p + vec3(0, eps, 0)) - sceneSDF(p - vec3(0, eps, 0)),
        sceneSDF(p + vec3(0, 0, eps)) - sceneSDF(p - vec3(0, 0, eps))
    ));
}

float raymarch(Ray ray) {
    float t = 0.0;

    for (int i = 0; i < 200; i++) {
        vec3 p = ray.origin + t * ray.dir;
        float d = sceneSDF(p);

        if (d < 0.0005) return t;

        t += d;

        if (t > 100.0) return -1.0;
    }

    return -1.0;
}

float shadow(vec3 origin, vec3 lightDir, float maxDist) {
    float t = 0.02;
    for (int i = 0; i < 50; i++) {
        float d = sceneSDF(origin + lightDir * t);
        if (d < 0.001) return 0.0;
        t += d;
        if (t > maxDist) break;
    }
    return 1.0;
}

vec3 shade(Hit hit, Light light, vec3 viewDir, float shadowFactor) {
    float diffuse = max(0.0, dot(hit.normal, light.dir));
    vec3 reflected = reflect(-light.dir, hit.normal);
    float specular = pow(max(0.0, dot(reflected, viewDir)), 64.0);

    vec3 diff = hit.color * light.color * diffuse * shadowFactor;
    vec3 spec = light.color * specular * 0.5 * shadowFactor;
    return diff + spec;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    Ray ray = generateRay(fragCoord);
    ray = orbitCamera(ray, 5.0);

    // Two colored lights
    Light light1 = Light(normalize(vec3(1.0, 2.0, 1.0)), vec3(1.0, 0.8, 0.6));
    Light light2 = Light(normalize(vec3(-1.0, 1.0, -0.5)), vec3(0.3, 0.4, 0.8));

    float t = raymarch(ray);

    vec3 color = vec3(0.05, 0.05, 0.1);
    if (t > 0.0) {
        vec3 p = ray.origin + t * ray.dir;
        vec3 normal = calcNormal(p);

        // Flip normal if facing away from camera (for Barth surface)
        if (dot(normal, ray.dir) > 0.0) normal = -normal;

        Hit hit;
        hit.t = t;
        hit.point = p;
        hit.normal = normal;
        hit.color = sceneColor(p);

        float shadow1 = shadow(p, light1.dir, 20.0);
        float shadow2 = shadow(p, light2.dir, 20.0);

        vec3 ambient = hit.color * 0.1;
        color = ambient + shade(hit, light1, -ray.dir, shadow1) + shade(hit, light2, -ray.dir, shadow2);
    }

    fragColor = vec4(color, 1.0);
}
