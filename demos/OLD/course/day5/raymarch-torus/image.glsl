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

float sceneSDF(vec3 p) {
    vec2 tor = vec2(1.0, 0.4);  // major radius, minor radius
    vec2 q = vec2(length(p.xz) - tor.x, p.y);
    return length(q) - tor.y;
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

    for (int i = 0; i < 100; i++) {
        vec3 p = ray.origin + t * ray.dir;
        float d = sceneSDF(p);

        if (d < 0.001) return t;

        t += d;

        if (t > 100.0) return -1.0;
    }

    return -1.0;
}

vec3 shade(Hit hit, Light light, vec3 viewDir) {
    float diffuse = max(0.0, dot(hit.normal, light.dir));
    vec3 reflected = reflect(-light.dir, hit.normal);
    float specular = pow(max(0.0, dot(reflected, viewDir)), 32.0);

    vec3 diff = hit.color * light.color * diffuse;
    vec3 spec = light.color * specular * 0.5;
    return diff + spec;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    Ray ray = generateRay(fragCoord);
    ray = orbitCamera(ray, 4.0);

    Light light = Light(normalize(vec3(1.0, 1.0, 1.0)), vec3(1.0));

    float t = raymarch(ray);

    vec3 color = vec3(0.1, 0.1, 0.2);
    if (t > 0.0) {
        vec3 p = ray.origin + t * ray.dir;
        vec3 normal = calcNormal(p);

        Hit hit;
        hit.t = t;
        hit.point = p;
        hit.normal = normal;
        hit.color = vec3(0.0, 0.7, 1.0);

        vec3 ambient = hit.color * 0.1;
        color = ambient + shade(hit, light, -ray.dir);
    }

    fragColor = vec4(color, 1.0);
}
