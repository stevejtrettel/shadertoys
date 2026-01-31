const float PI = 3.14159265359;

// Model selection: 0 = Poincaré disk, 1 = Klein disk, 2 = Upper Half Plane
const int MODEL = 2;

// Color palette
const vec3 WHITE = vec3(0.95, 0.95, 0.95);
const vec3 LIGHT_GRAY = vec3(0.82, 0.82, 0.82);
const vec3 BLACK = vec3(0.03, 0.03, 0.03);

// Disk colors (cool to warm, inside to outside)
const vec3 DISK1_FILL = vec3(0.35, 0.55, 0.85);  // blue
const vec3 DISK2_FILL = vec3(0.30, 0.75, 0.55);  // green
const vec3 DISK3_FILL = vec3(0.90, 0.80, 0.35);  // yellow
const vec3 DISK4_FILL = vec3(0.85, 0.40, 0.30);  // orange-red

const float DARKEN = 0.6;

// Disk radii
const float R1 = 1.0;
const float R2 = 2.0;
const float R3 = 3.0;
const float R4 = 4.0;

// Grid parameters
const float GRID_RADIALS = 12.0;
const float GRID_CIRCLES = 0.5;
const float GRID_WIDTH = 0.02;

// Line weights
const float BORDER_WIDTH = 0.06;
const float TILING_EDGE_WIDTH = 0.015;

// Disk border (Euclidean)
const float DISK_RADIUS = 0.995;
const float DISK_BORDER = 0.004;

// UHP view window
const float UHP_SCALE = 2.5;
const vec2 UHP_CENTER = vec2(0.0, 1.5);

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

vec2 kleinToDisk(vec2 k) {
    float k2 = dot(k, k);
    if (k2 >= 1.0) return vec2(1e10);
    return k / (1.0 + sqrt(1.0 - k2));
}

vec2 kleinToUHP(vec2 k) {
    return diskToUHP(kleinToDisk(k));
}

vec2 screenToUHP(vec2 uv, out bool valid) {
    valid = true;
    
    if (MODEL == 0) {
        vec2 w = uv * 2.4;
        if (length(w) >= DISK_RADIUS) {
            valid = false;
            return vec2(0.0);
        }
        return diskToUHP(w);
    }
    else if (MODEL == 1) {
        vec2 k = uv * 2.4;
        if (length(k) >= DISK_RADIUS) {
            valid = false;
            return vec2(0.0);
        }
        return kleinToUHP(k);
    }
    else {
        vec2 z = uv * UHP_SCALE + UHP_CENTER;
        if (z.y <= 0.0) {
            valid = false;
            return vec2(0.0);
        }
        return z;
    }
}

float modelBoundaryDist(vec2 uv) {
    if (MODEL == 0 || MODEL == 1) {
        return DISK_RADIUS - length(uv * 2.4);
    }
    else {
        vec2 z = uv * UHP_SCALE + UHP_CENTER;
        return z.y;
    }
}

//-----------
// Hyperbolic Distance
//-----------

float distToPoint(vec2 z, vec2 pt) {
    vec2 d = z - pt;
    return acosh(1.0 + dot(d,d) / (2.0 * z.y * pt.y));
}

//-----------
// Grid around center point
//-----------

float distToPolarGrid(vec2 z, vec2 center, float maxRadius) {
    float dMin = 1e10;
    
    float d = distToPoint(z, center);
    if (d > maxRadius) return 1e10;
    
    // Concentric circles
    float nearestCircle = round(d / GRID_CIRCLES) * GRID_CIRCLES;
    if (nearestCircle > 0.01 && nearestCircle < maxRadius - 0.01) {
        dMin = min(dMin, abs(d - nearestCircle));
    }
    
    // Radial geodesics
    vec2 wMapped = cdiv(vec2(z.x - center.x, z.y - center.y), vec2(z.x - center.x, z.y + center.y));
    float angle = atan(wMapped.y, wMapped.x);
    float radialSpacing = PI / GRID_RADIALS;
    float nearestAngle = round(angle / radialSpacing) * radialSpacing;
    float angleDiff = abs(angle - nearestAngle);
    
    float radialDist = angleDiff * sinh(d);
    dMin = min(dMin, radialDist);
    
    return dMin;
}

//-----------
// Polar Tiling (Background)
//-----------

vec3 drawPolarTiling(vec2 z, vec2 center) {
    float d = distToPoint(z, center);
    
    // Radial geodesics - get cell index
    vec2 wMapped = cdiv(vec2(z.x - center.x, z.y - center.y), vec2(z.x - center.x, z.y + center.y));
    float angle = atan(wMapped.y, wMapped.x);
    float radialSpacing = PI / GRID_RADIALS;
    float cellAngle = floor(angle / radialSpacing);
    
    // Concentric circles - get cell index
    float cellRadius = floor(d / GRID_CIRCLES);
    
    // Checkerboard
    float parity = mod(cellAngle + cellRadius, 2.0);
    vec3 color = (parity < 0.5) ? WHITE : LIGHT_GRAY;
    
    // Grid edges
    float nearestCircle = round(d / GRID_CIRCLES) * GRID_CIRCLES;
    float dCircle = abs(d - nearestCircle);
    
    float nearestAngle = round(angle / radialSpacing) * radialSpacing;
    float angleDiff = abs(angle - nearestAngle);
    float dRadial = angleDiff * sinh(d);
    
    if (dCircle < TILING_EDGE_WIDTH || dRadial < TILING_EDGE_WIDTH) {
        color = LIGHT_GRAY * 0.8;
    }
    
    return color;
}

//-----------
// Hyperbolic Disks
//-----------

vec3 drawDisks(vec2 z, vec3 baseColor) {
    vec3 color = baseColor;
    
    vec2 center = vec2(0.0, 1.0);
    float d = distToPoint(z, center);
    float gridDist = distToPolarGrid(z, center, R4);
    
    // Disk 4 (outermost, orange-red)
    if (d < R4) {
        color = DISK4_FILL;
        if (gridDist < GRID_WIDTH || d > R4 - BORDER_WIDTH) {
            color = DISK4_FILL * DARKEN;
        }
    }
    
    // Disk 3 (yellow)
    if (d < R3) {
        color = DISK3_FILL;
        if (gridDist < GRID_WIDTH || d > R3 - BORDER_WIDTH) {
            color = DISK3_FILL * DARKEN;
        }
    }
    
    // Disk 2 (green)
    if (d < R2) {
        color = DISK2_FILL;
        if (gridDist < GRID_WIDTH || d > R2 - BORDER_WIDTH) {
            color = DISK2_FILL * DARKEN;
        }
    }
    
    // Disk 1 (innermost, blue)
    if (d < R1) {
        color = DISK1_FILL;
        if (gridDist < GRID_WIDTH || d > R1 - BORDER_WIDTH) {
            color = DISK1_FILL * DARKEN;
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
    
    if (MODEL == 2) {
        uv *= 25.0;
        uv.y += 10.5;
    }
    
    vec3 color = WHITE;
    
    bool valid;
    vec2 z = screenToUHP(uv, valid);
    
    if (valid) {
        vec2 center = vec2(0.0, 1.0);
        color = drawPolarTiling(z, center);
        color = drawDisks(z, color);
    }
    
    // Model boundary
    float boundaryDist = modelBoundaryDist(uv);
    if (MODEL == 0 || MODEL == 1) {
        if (boundaryDist < DISK_BORDER && boundaryDist > 0.0) {
            color = BLACK;
        }
    }
    else {
        if (boundaryDist < 0.02 && boundaryDist > 0.0) {
            color = BLACK;
        }
    }
    
    fragColor = vec4(color, 1.0);
}