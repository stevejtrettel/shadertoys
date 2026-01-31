const float PI = 3.14159265359;

// Color palette
const vec3 WHITE = vec3(0.95, 0.95, 0.95);
const vec3 LIGHT_GRAY = vec3(0.82, 0.82, 0.82);
const vec3 BLACK = vec3(0.03, 0.03, 0.03);

const vec3 REGION_FILL = vec3(0.72, 0.52, 0.52);
const vec3 REGION_EDGE = vec3(0.03);
const vec3 GRID_COLOR = vec3(0.45, 0.30, 0.30);

// Equidistant region parameters
const float EQ_CENTER = 0.0;
const float EQ_RADIUS = 2.5;

// Truncation: geodesics at radii e^(-a) and e^a
const float TRUNC_A = 0.75;

// Grid parameters
const float GRID_H_DIVISIONS = 4.0;
const float GRID_V_DIVISIONS = 6.0;
const float GRID_WIDTH = 0.02;

// Line weights (hyperbolic distance)
const float EDGE_WIDTH = 0.06;
const float TILING_EDGE_WIDTH = 0.01;

// Disk border (Euclidean)
const float DISK_RADIUS = 0.995;
const float DISK_BORDER = 0.004;

//-----------
// Complex Arithmetic
//-----------

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / dot(b, b);
}

vec2 diskToUHP(vec2 w) {
    return cmul(vec2(0,1), cdiv(vec2(1,0) + w, vec2(1,0) - w));
}

//-----------
// Hyperbolic Distance
//-----------

float distToVerticalGeodesic(vec2 z, float x0) {
    vec2 rel = vec2(z.x - x0, z.y);
    return acosh(length(rel) / z.y);
}

float distToCircularGeodesic(vec2 z, float radius) {
    vec2 num = z - vec2(radius, 0.0);
    vec2 denom = z - vec2(-radius, 0.0);
    vec2 w = cdiv(num, denom);
    return acosh(length(w) / w.y);
}

//-----------
// Equidistant Region
//-----------

bool inStrip(vec2 z) {
    return distToVerticalGeodesic(z, EQ_CENTER) < EQ_RADIUS;
}

bool inTruncation(vec2 z) {
    float r = length(z);
    return r > exp(-TRUNC_A) && r < exp(TRUNC_A);
}

//-----------
// Strip Grid
//-----------

float distToStripGrid(vec2 z) {
    float dMin = 1e10;
    
    // Equidistant curves
    float distFromCenter = distToVerticalGeodesic(z, EQ_CENTER);
    float hSpacing = EQ_RADIUS / GRID_H_DIVISIONS;
    float nearestEqDist = round(distFromCenter / hSpacing) * hSpacing;
    if (nearestEqDist > 0.01 && nearestEqDist < EQ_RADIUS - 0.01) {
        dMin = min(dMin, abs(distFromCenter - nearestEqDist));
    }
    
    // Circular geodesics
    float logR = log(length(z));
    float vSpacing = 2.0 * TRUNC_A / GRID_V_DIVISIONS;
    float nearestLogR = round(logR / vSpacing) * vSpacing;
    if (nearestLogR > -TRUNC_A + 0.01 && nearestLogR < TRUNC_A - 0.01) {
        float nearestR = exp(nearestLogR);
        dMin = min(dMin, distToCircularGeodesic(z, nearestR));
    }
    
    return dMin;
}

//-----------
// Draw Strip Region
//-----------

vec3 drawStripRegion(vec2 z, vec3 baseColor) {
    vec3 color = baseColor;
    
    bool inS = inStrip(z);
    bool inT = inTruncation(z);
    
    // Fill
    if (inS && inT) {
        color = REGION_FILL;
        
        // Grid
        if (distToStripGrid(z) < GRID_WIDTH) {
            color = GRID_COLOR;
        }
    }
    
    // Edges along equidistant boundaries
    if (inT) {
        float edgeDist = abs(distToVerticalGeodesic(z, EQ_CENTER) - EQ_RADIUS);
        if (edgeDist < EDGE_WIDTH) {
            color = REGION_EDGE;
        }
    }
    
    // Edges along truncating geodesics
    if (inS) {
        float dInner = distToCircularGeodesic(z, exp(-TRUNC_A));
        float dOuter = distToCircularGeodesic(z, exp(TRUNC_A));
        
        if (dInner < EDGE_WIDTH || dOuter < EDGE_WIDTH) {
            color = REGION_EDGE;
        }
    }
    
    return color;
}

//-----------
// Triangle Tiling
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

vec3 drawTiling(vec2 z) {
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
        color = LIGHT_GRAY;
    }
    
    return color;
}

//-----------
// Main
//-----------

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 w = uv * 2.4;
    
    float diskDist = length(w);
    vec3 color = WHITE;
    
    if (diskDist < DISK_RADIUS) {
        vec2 z = diskToUHP(w);
        
        color = drawTiling(z);
        color = drawStripRegion(z, color);
    }
    
    if (diskDist > DISK_RADIUS - DISK_BORDER && diskDist < DISK_RADIUS) {
        color = BLACK;
    }
    
    fragColor = vec4(color, 1.0);
}