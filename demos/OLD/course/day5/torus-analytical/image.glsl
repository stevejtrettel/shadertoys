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

// Torus intersection by Inigo Quilez
// https://iquilezles.org/articles/intersectors/
float intersectTorusRaw(Ray ray, vec2 tor) {
    float po = 1.0;
    float Ra2 = tor.x * tor.x;
    float ra2 = tor.y * tor.y;

    float m = dot(ray.origin, ray.origin);
    float n = dot(ray.origin, ray.dir);

    float h = n*n - m + (tor.x + tor.y) * (tor.x + tor.y);
    if (h < 0.0) return -1.0;

    float k = (m - ra2 - Ra2) / 2.0;
    float k3 = n;
    float k2 = n*n + Ra2*ray.dir.y*ray.dir.y + k;
    float k1 = k*n + Ra2*ray.origin.y*ray.dir.y;
    float k0 = k*k + Ra2*ray.origin.y*ray.origin.y - Ra2*ra2;

    if (abs(k3*(k3*k3 - k2) + k1) < 0.01) {
        po = -1.0;
        float tmp = k1; k1 = k3; k3 = tmp;
        k0 = 1.0/k0;
        k1 = k1*k0;
        k2 = k2*k0;
        k3 = k3*k0;
    }

    float c2 = 2.0*k2 - 3.0*k3*k3;
    float c1 = k3*(k3*k3 - k2) + k1;
    float c0 = k3*(k3*(-3.0*k3*k3 + 4.0*k2) - 8.0*k1) + 4.0*k0;

    c2 /= 3.0;
    c1 *= 2.0;
    c0 /= 3.0;

    float Q = c2*c2 + c0;
    float R = 3.0*c0*c2 - c2*c2*c2 - c1*c1;

    float h2 = R*R - Q*Q*Q;
    float z = 0.0;

    if (h2 < 0.0) {
        float sQ = sqrt(Q);
        z = 2.0*sQ*cos(acos(R/(sQ*Q)) / 3.0);
    } else {
        float sQ = pow(sqrt(h2) + abs(R), 1.0/3.0);
        z = sign(R)*abs(sQ + Q/sQ);
    }

    z = c2 - z;

    float d1 = z - 3.0*c2;
    float d2 = z*z - 3.0*c0;

    if (abs(d1) < 1.0e-4) {
        if (d2 < 0.0) return -1.0;
        d2 = sqrt(d2);
    } else {
        if (d1 < 0.0) return -1.0;
        d1 = sqrt(d1/2.0);
        d2 = c1/d1;
    }

    float result = 1e20;

    h2 = d1*d1 - z + d2;
    if (h2 > 0.0) {
        h2 = sqrt(h2);
        float t1 = -d1 - h2 - k3;
        float t2 = -d1 + h2 - k3;
        t1 = (po < 0.0) ? 2.0/t1 : t1;
        t2 = (po < 0.0) ? 2.0/t2 : t2;
        if (t1 > 0.0) result = t1;
        if (t2 > 0.0) result = min(result, t2);
    }

    h2 = d1*d1 - z - d2;
    if (h2 > 0.0) {
        h2 = sqrt(h2);
        float t1 = d1 - h2 - k3;
        float t2 = d1 + h2 - k3;
        t1 = (po < 0.0) ? 2.0/t1 : t1;
        t2 = (po < 0.0) ? 2.0/t2 : t2;
        if (t1 > 0.0) result = min(result, t1);
        if (t2 > 0.0) result = min(result, t2);
    }

    if (result > 1e10) return -1.0;
    return result;
}

vec3 torusNormal(vec3 p, vec2 tor) {
    float R = tor.x;
    float k = sqrt(p.x*p.x + p.z*p.z);
    return normalize(vec3(p.x * (1.0 - R/k), p.y, p.z * (1.0 - R/k)));
}

Hit intersectTorus(Ray ray, vec2 tor, vec3 color) {
    Hit hit;
    hit.t = intersectTorusRaw(ray, tor);
    if (hit.t > 0.0) {
        hit.point = ray.origin + hit.t * ray.dir;
        hit.normal = torusNormal(hit.point, tor);
        hit.color = color;
    }
    return hit;
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

    // Torus with major radius 1.0, minor radius 0.4
    Hit hit = intersectTorus(ray, vec2(1.0, 0.4), vec3(0.0, 0.7, 1.0));

    vec3 color = vec3(0.1, 0.1, 0.2);
    if (hit.t > 0.0) {
        vec3 ambient = hit.color * 0.1;
        color = ambient + shade(hit, light, -ray.dir);
    }

    fragColor = vec4(color, 1.0);
}
