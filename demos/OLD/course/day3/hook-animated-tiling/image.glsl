// Color palette
const vec3 LIGHT_BLUE = vec3(0.55, 0.70, 0.85);
const vec3 DARK_BLUE = vec3(0.20, 0.30, 0.45);
const vec3 EDGE = vec3(0.92, 0.88, 0.82);
const vec3 VERTEX = vec3(0.9, 0.35, 0.25);
const vec3 BLACK = vec3(0.02, 0.02, 0.03);

struct HalfSpaceVert { float x; float side; };
struct HalfSpaceCirc { float center; float radius; float side; };

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / dot(b, b);
}

vec2 diskToUHP(vec2 w) {
    return cmul(vec2(0,1), cdiv(vec2(1,0) + w, vec2(1,0) - w));
}

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

float distToVert(vec2 z, float c) {
    z.x -= c;
    return acosh(length(z) / z.y);
}

float distToCirc(vec2 z, float center, float radius) {
    vec2 num = z - vec2(center + radius, 0.0);
    vec2 denom = z - vec2(center - radius, 0.0);
    vec2 w = cdiv(num, denom);
    return acosh(length(w) / w.y);
}

float hypDist(vec2 z1, vec2 z2) {
    vec2 d = z1 - z2;
    return acosh(1.0 + dot(d,d) / (2.0 * z1.y * z2.y));
}

// Möbius transformation in disk: rotation around origin
vec2 diskRotate(vec2 w, float angle) {
    float c = cos(angle), s = sin(angle);
    return vec2(c*w.x - s*w.y, s*w.x + c*w.y);
}

// Möbius transformation in disk: hyperbolic translation toward point a
vec2 diskTranslate(vec2 w, vec2 a) {
    vec2 aConj = vec2(a.x, -a.y);
    vec2 num = w - a;
    vec2 denom = vec2(1.0, 0.0) - cmul(aConj, w);
    return cdiv(num, denom);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 w = uv * 2.4;
    
    // Animate: gentle rotation + small oscillating translation
    float t = iTime * 0.3;
    w = diskRotate(w, t);
    vec2 offset = 0.15 * vec2(sin(t * 1.3), cos(t * 0.9));
    w = diskTranslate(w, offset);
    
    vec3 color = BLACK;
    
    if (length(w) < 0.995) {
        vec2 z = diskToUHP(w);
        
        // (2,3,7) triangle
        HalfSpaceVert left = HalfSpaceVert(0.0, -1.0);
        HalfSpaceCirc bottom = HalfSpaceCirc(0.0, 1.0, 1.0);
        HalfSpaceCirc third = HalfSpaceCirc(-0.7665, 1.533, -1.0);
        
        int foldCount = 0;
        for (int i = 0; i < 100; i++) {
            vec2 z0 = z;
            z = reflectInto(z, left, foldCount);
            z = reflectInto(z, bottom, foldCount);
            z = reflectInto(z, third, foldCount);
            if (length(z - z0) < 0.0001) break;
        }
        
        // Background by parity
        float parity = mod(float(foldCount), 2.0);
        color = (parity < 0.5) ? LIGHT_BLUE : DARK_BLUE;
        
        // Edges
        float d1 = distToVert(z, 0.0);
        float d2 = distToCirc(z, 0.0, 1.0);
        float d3 = distToCirc(z, -0.7665, 1.533);
        float minEdge = min(d1, min(d2, d3));
        
        if (minEdge < 0.015) color = EDGE;
        
        // Vertices
        vec2 v1 = vec2(0.0, 1.0);           // pi/2 vertex
        vec2 v2 = vec2(0.498, 0.867);       // pi/3 vertex  
        vec2 v3 = vec2(0.0, 1.328);         // pi/7 vertex
        
        float dv1 = hypDist(z, v1);
        float dv2 = hypDist(z, v2);
        float dv3 = hypDist(z, v3);
        float minVert = min(dv1, min(dv2, dv3));
        
        if (minVert < 0.06) color = VERTEX;
    }
    
    fragColor = vec4(color, 1.0);
}