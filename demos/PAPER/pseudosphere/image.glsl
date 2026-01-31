const float PI = 3.14159265359;

// Color palette
const vec3 WHITE = vec3(0.95, 0.95, 0.95);
const vec3 LIGHT_GRAY = vec3(0.82, 0.82, 0.82);
const vec3 BLACK = vec3(0.02, 0.02, 0.03);

const vec3 DOMAIN_FILL = vec3(0.72, 0.52, 0.52);
const vec3 DOMAIN_EDGE = vec3(0.03);

// Grid parameters
const float GRID_H_DIVISIONS = 10.0;
const float GRID_V_DIVISIONS = 14.0;
const float GRID_WIDTH = 0.02;
const vec3 GRID_COLOR = vec3(0.45, 0.30, 0.30);

// Pseudosphere domain bounds
const float PS_LEFT = -PI;
const float PS_RIGHT = PI;
const float PS_BOTTOM = 0.75;
const float PS_TOP = 20.0;

// Line weights (hyperbolic distance)
const float DOMAIN_EDGE_WIDTH = 0.08;
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

float distToPoint(vec2 z, vec2 pt) {
    vec2 d = z - pt;
    return acosh(1.0 + dot(d,d) / (2.0 * z.y * pt.y));
}

float distToVerticalGeodesic(vec2 z, float x0) {
    vec2 rel = vec2(z.x - x0, z.y);
    return acosh(length(rel) / z.y);
}

float distToHorocycle(vec2 z, float c) {
    return abs(log(z.y / c));
}

//-----------
// Truncated Segment Distances
//-----------

float distToVertSegment(vec2 z, float x0, float yMin, float yMax) {
    if (z.y < yMin || z.y > yMax) return 1e10;
    return distToVerticalGeodesic(z, x0);
}

float distToHoroSegment(vec2 z, float c, float xMin, float xMax) {
    if (z.x < xMin || z.x > xMax) return 1e10;
    return distToHorocycle(z, c);
}

//-----------
// Grid
//-----------

float distToGrid(vec2 z) {
    float dMin = 1e10;
    
    // Vertical geodesics: evenly spaced in x
    float hSpacing = (PS_RIGHT - PS_LEFT) / GRID_H_DIVISIONS;
    float nearestX = PS_LEFT + round((z.x - PS_LEFT) / hSpacing) * hSpacing;
    if (nearestX > PS_LEFT + 0.01 && nearestX < PS_RIGHT - 0.01) {
        dMin = min(dMin, distToVerticalGeodesic(z, nearestX));
    }
    
    // Horocycles: evenly spaced in hyperbolic distance
    float logBottom = log(PS_BOTTOM);
    float logTop = log(PS_TOP);
    float vSpacing = (logTop - logBottom) / GRID_V_DIVISIONS;
    
    float logY = log(z.y);
    float nearestLogY = logBottom + round((logY - logBottom) / vSpacing) * vSpacing;
    float nearestY = exp(nearestLogY);
    if (nearestY > PS_BOTTOM * 1.01 && nearestY < PS_TOP * 0.99) {
        dMin = min(dMin, distToHorocycle(z, nearestY));
    }
    
    return dMin;
}



//-----------
// Pseudosphere Domain
//-----------

bool inDomain(vec2 z) {
    return z.x > PS_LEFT && z.x < PS_RIGHT && 
           z.y > PS_BOTTOM && z.y < PS_TOP;
}

float domainEdgeDist(vec2 z) {
    float dLeft   = distToVertSegment(z, PS_LEFT, PS_BOTTOM, PS_TOP);
    float dRight  = distToVertSegment(z, PS_RIGHT, PS_BOTTOM, PS_TOP);
    float dBottom = distToHoroSegment(z, PS_BOTTOM, PS_LEFT, PS_RIGHT);
    float dTop    = distToHoroSegment(z, PS_TOP, PS_LEFT, PS_RIGHT);
    return min(min(dLeft, dRight), min(dBottom, dTop));
}

vec3 drawDomain(vec2 z, vec3 baseColor) {
    vec3 color = baseColor;
    
    if (inDomain(z)) {
        color = DOMAIN_FILL;
        
        // Grid
        if (distToGrid(z) < GRID_WIDTH) {
            color = GRID_COLOR;
        }
        
        // Edges (drawn on top of grid)
        if (domainEdgeDist(z) < DOMAIN_EDGE_WIDTH) {
            color = DOMAIN_EDGE;
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
        
        z = 3.0 * z;
        color = drawDomain(z, color);
    }
    
    if (diskDist > DISK_RADIUS - DISK_BORDER && diskDist < DISK_RADIUS) {
        color = BLACK;
    }
    
    fragColor = vec4(color, 1.0);
}