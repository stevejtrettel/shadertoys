const float PI = 3.14159265359;

// Color palette
const vec3 WHITE = vec3(0.95, 0.95, 0.95);
const vec3 LIGHT_GRAY = vec3(0.82, 0.82, 0.82);
const vec3 BLACK = vec3(0.03, 0.03, 0.03);
const vec3 BACKGROUND = vec3(0.15, 0.18, 0.22);

// Camer
const vec3 CAM_POS = vec3(20, 0, 2.0);
const vec3 CAM_TARGET = vec3(0.0, 0.0, 6.);
const float CAM_FOV = 1.5;

// Lighting
const vec3 LIGHT_DIR = normalize(vec3(1.0, 2.0, 3.0));
const float AMBIENT = 0.3;
const float DIFFUSE = 0.7;

// Tiling
const float TILING_EDGE_WIDTH = 0.02;

//-----------
// Complex Arithmetic
//-----------

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / dot(b, b);
}

//-----------
// Model Transformations
//-----------

vec2 diskToUHP(vec2 w) {
    return cmul(vec2(0,1), cdiv(vec2(1,0) + w, vec2(1,0) - w));
}

vec2 hyperboloidToDisk(vec3 p) {
    // Stereographic projection from (0, 0, -1) onto z = 0 plane
    return p.xy / (p.z + 1.0);
}

vec2 hyperboloidToUHP(vec3 p) {
    return diskToUHP(hyperboloidToDisk(p));
}

//-----------
// Ray-Hyperboloid Intersection
//-----------

// Hyperboloid: z^2 - x^2 - y^2 = 1, z > 0
// Minkowski inner product: (a,b) = a.z*b.z - a.x*b.x - a.y*b.y

float minkowskiDot(vec3 a, vec3 b) {
    return a.z*b.z - a.x*b.x - a.y*b.y;
}

bool intersectHyperboloid(vec3 ro, vec3 rd, out float t, out vec3 hitPos) {
    // Solve: minkowski(ro + t*rd, ro + t*rd) = 1
    float a = minkowskiDot(rd, rd);
    float b = 2.0 * minkowskiDot(ro, rd);
    float c = minkowskiDot(ro, ro) - 1.0;
    
    float disc = b*b - 4.0*a*c;
    if (disc < 0.0) return false;
    
    float sqrtDisc = sqrt(disc);
    float t1 = (-b - sqrtDisc) / (2.0 * a);
    float t2 = (-b + sqrtDisc) / (2.0 * a);
    
    // Find smallest positive t with z > 0
    t = -1.0;
    if (t1 > 0.001) {
        vec3 p1 = ro + t1 * rd;
        if (p1.z > 0.0) t = t1;
    }
    if (t2 > 0.001 && (t < 0.0 || t2 < t)) {
        vec3 p2 = ro + t2 * rd;
        if (p2.z > 0.0) t = t2;
    }
    
    if (t < 0.0) return false;
    
    hitPos = ro + t * rd;
    return true;
}

vec3 hyperboloidNormal(vec3 p) {
    // Gradient of z^2 - x^2 - y^2 is (-2x, -2y, 2z)
    return normalize(vec3(-p.x, -p.y, p.z));
}

//-----------
// Camera
//-----------

mat3 buildCamera(vec3 pos, vec3 target) {
    vec3 forward = normalize(target - pos);
    vec3 right = normalize(cross(forward, vec3(0.0, 0.0, 1.0)));
    vec3 up = cross(right, forward);
    return mat3(right, up, forward);
}

//-----------
// Hyperbolic Distance (in UHP)
//-----------

float distToVerticalGeodesic(vec2 z, float x0) {
    vec2 rel = vec2(z.x - x0, z.y);
    return acosh(length(rel) / z.y);
}

//-----------
// Triangle Tiling (237)
//-----------

struct HalfSpaceVert { float x; float side; };
struct HalfSpaceCirc { float center; float radius; float side; };

vec2 reflectInto(vec2 z, HalfSpaceVert h, inout int count) {
    if ((z.x - h.x) * h.side < 0.0) return z;
    count++;
    return vec2(2.0 * h.x - z.x, z.y);
}

vec2 reflectInto(vec2 z, HalfSpaceCirc h, inout int count) {
    vec2 rel = z - vec2(h.center, 0.0);
    if ((dot(rel,rel) - h.radius*h.radius) * h.side > 0.0) return z;
    count++;
    z.x -= h.center;
    z = z / h.radius;
    z = z / dot(z, z);
    z = z * h.radius;
    z.x += h.center;
    return z;
}

float distToBoundary(vec2 z, HalfSpaceVert hs) {
    return distToVerticalGeodesic(z, hs.x);
}

float distToBoundary(vec2 z, HalfSpaceCirc hs) {
    vec2 num = z - vec2(hs.center + hs.radius, 0.0);
    vec2 denom = z - vec2(hs.center - hs.radius, 0.0);
    vec2 w = cdiv(num, denom);
    return acosh(length(w) / w.y);
}

vec3 getUHPColor(vec2 z) {
    HalfSpaceVert left = HalfSpaceVert(0.0, -1.0);
    HalfSpaceCirc bottom = HalfSpaceCirc(0.0, 1.0, 1.0);
    HalfSpaceCirc third = HalfSpaceCirc(-0.7665, 1.533, -1.0);

    int foldCount = 0;
    vec2 zFolded = z;
    
    for (int i = 0; i < 100; i++) {
        vec2 zPrev = zFolded;
        zFolded = reflectInto(zFolded, left, foldCount);
        zFolded = reflectInto(zFolded, bottom, foldCount);
        zFolded = reflectInto(zFolded, third, foldCount);
        if (length(zFolded - zPrev) < 0.0001) break;
    }
    
    float parity = mod(float(foldCount), 2.0);
    vec3 color = (parity < 0.5) ? WHITE : LIGHT_GRAY;
    
    float d1 = distToBoundary(zFolded, left);
    float d2 = distToBoundary(zFolded, bottom);
    float d3 = distToBoundary(zFolded, third);
    float minEdge = min(d1, min(d2, d3));
    
    if (minEdge < TILING_EDGE_WIDTH) {
        color = LIGHT_GRAY * 0.7;
    }
    
    return color;
}

//-----------
// Main
//-----------

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    // Build camera
    mat3 cam = buildCamera(CAM_POS, CAM_TARGET);
    vec3 rd = cam * normalize(vec3(uv, CAM_FOV));
    vec3 ro = CAM_POS;
    
    vec3 color = BACKGROUND;
    
    // Ray-hyperboloid intersection
    float t;
    vec3 hitPos;
    if (intersectHyperboloid(ro, rd, t, hitPos)) {
        // Map to UHP and get texture color
        vec2 uhp = hyperboloidToUHP(hitPos);
        vec3 texColor = getUHPColor(uhp);
        
        // 3D shading
        vec3 normal = hyperboloidNormal(hitPos);
        float diff = max(dot(normal, LIGHT_DIR), 0.0);
        float lighting = AMBIENT + DIFFUSE * diff;
        
        color = texColor * lighting;
    }
    
    // Gamma correction
    color = pow(color, vec3(0.9));
    
    fragColor = vec4(color, 1.0);
}