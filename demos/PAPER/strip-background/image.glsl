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
const float EQ_RADIUS = 1.;

// Truncation
const float TRUNC_A = 2.;

// Grid parameters
const float GRID_H_DIVISIONS = 4.0;
const float GRID_V_DIVISIONS = 6.0;
const float GRID_WIDTH = 0.02;

// Line weights (hyperbolic distance)
const float EDGE_WIDTH = 0.06;
const float TILING_EDGE_WIDTH = 0.015;

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
// Strip Region
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
    
    // Equidistant curves (rays from origin at constant hyperbolic distance from central geodesic)
    float distFromCenter = distToVerticalGeodesic(z, EQ_CENTER);
    float hSpacing = EQ_RADIUS / GRID_H_DIVISIONS;
    float nearestEqDist = round(distFromCenter / hSpacing) * hSpacing;
    if (nearestEqDist > 0.01 && nearestEqDist < EQ_RADIUS - 0.01) {
        dMin = min(dMin, abs(distFromCenter - nearestEqDist));
    }
    
    // Circular geodesics (centered at origin, evenly spaced in log-radius)
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
// Rectangular Tiling for Strip
//-----------

vec3 drawStripTiling(vec2 z) {
    float hSpacing = EQ_RADIUS / GRID_H_DIVISIONS;
    float vSpacing = 2.0 * TRUNC_A / GRID_V_DIVISIONS;
    
    // Fold by equidistance (distance from central geodesic)
    float distFromCenter = distToVerticalGeodesic(z, EQ_CENTER);
    float cellX = floor(distFromCenter / hSpacing);
    
    // Fold by log-radius (position along geodesic)
    float logR = log(length(z));
    float shiftedLogR = logR + TRUNC_A;
    float cellY = floor(shiftedLogR / vSpacing);
    
    // Checkerboard
    float parity = mod(cellX + cellY, 2.0);
    vec3 color = (parity < 0.5) ? WHITE : LIGHT_GRAY;
    
    // Grid edges
    float nearestLogR = round(logR / vSpacing) * vSpacing;
    float nearestR = exp(nearestLogR);
    float dToCircle = distToCircularGeodesic(z, nearestR);
    
    float dEq = mod(distFromCenter, hSpacing);
    dEq = min(dEq, hSpacing - dEq);
    
    if (dEq < TILING_EDGE_WIDTH || dToCircle < TILING_EDGE_WIDTH) {
        color = LIGHT_GRAY * 0.8;
    }
    
    return color;
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
    
    // Edges along equidistant boundaries (only within truncation)
    if (inT) {
        float edgeDist = abs(distToVerticalGeodesic(z, EQ_CENTER) - EQ_RADIUS);
        if (edgeDist < EDGE_WIDTH) {
            color = REGION_EDGE;
        }
    }
    
    // Edges along truncating geodesics (only within strip)
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
        
        color = drawStripTiling(z);
        color = drawStripRegion(z, color);
    }
    
    if (diskDist > DISK_RADIUS - DISK_BORDER && diskDist < DISK_RADIUS) {
        color = BLACK;
    }
    
    fragColor = vec4(color, 1.0);
}