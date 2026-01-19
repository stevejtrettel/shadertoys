struct Ray {
    vec3 origin;
    vec3 dir;
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

float intersectSphere(Ray ray, vec3 center, float radius) {
    vec3 delta = ray.origin - center;

    float b = dot(delta, ray.dir);
    float c = dot(delta, delta) - radius * radius;
    float discriminant = b * b - c;

    if (discriminant < 0.0) return -1.0;

    float sqrtDisc = sqrt(discriminant);
    float t1 = -b - sqrtDisc;
    float t2 = -b + sqrtDisc;

    if (t1 > 0.0) return t1;
    if (t2 > 0.0) return t2;
    return -1.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    Ray ray = generateRay(fragCoord);

    float t = intersectSphere(ray, vec3(0.0, 0.0, -3.0), 1.0);

    vec3 color = vec3(0.1, 0.1, 0.2);
    if (t > 0.0) color = vec3(1.0, 0.0, 0.0);

    fragColor = vec4(color, 1.0);
}
