const float PI = 3.14159265359;

const float DOMAIN_SCALE = 3.0;

// Color palette
const vec3 WHITE = vec3(0.95, 0.95, 0.95);
const vec3 LIGHT_GRAY = vec3(0.82, 0.82, 0.82);
const vec3 BLACK = vec3(0.02, 0.02, 0.03);

const vec3 DOMAIN_FILL = vec3(0.72, 0.52, 0.52);
const vec3 DOMAIN_EDGE = vec3(0.03);

// Grid parameters (used for both tiling and domain grid)
const float GRID_H_DIVISIONS = 6.0;
const float GRID_V_DIVISIONS = 8.0;
const float GRID_WIDTH = 0.02;
const vec3 GRID_COLOR = vec3(0.45, 0.30, 0.30);

// Pseudosphere domain bounds
const float PS_LEFT = -PI;
const float PS_RIGHT = PI;
const float PS_BOTTOM = 0.75;
const float PS_TOP = 20.0;

// Line weights (hyperbolic distance)
const float DOMAIN_EDGE_WIDTH = 0.08;
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

float distToHorocycle(vec2 z, float c) {
    return abs(log(z.y / c));
}

//-----------
// Rectangular Tiling (Parabolic + Hyperbolic)
//-----------

vec3 drawRectangularTiling(vec2 z) {
    float width = PS_RIGHT - PS_LEFT;
    float logBottom = log(PS_BOTTOM);
    float logTop = log(PS_TOP);
    float vSpacing = (logTop - logBottom) / GRID_V_DIVISIONS;
    float hSpacing = width / GRID_H_DIVISIONS;
    
    // Fold horizontally (parabolic)
    float xShifted = z.x - PS_LEFT;
    float cellX = floor(xShifted / hSpacing);
    float xFolded = mod(xShifted, hSpacing) + PS_LEFT;
    
    // Fold vertically (hyperbolic - work in log space)
    float logY = log(z.y);
    float cellY = floor((logY - logBottom) / vSpacing);
    float logYFolded = mod(logY - logBottom, vSpacing) + logBottom;
    float yFolded = exp(logYFolded);
    
    vec2 zFolded = vec2(xFolded, yFolded);
    
    // Checkerboard
    float parity = mod(cellX + cellY, 2.0);
    vec3 color = (parity < 0.5) ? WHITE : LIGHT_GRAY;
    
    // Grid edges
    float dVert = distToVerticalGeodesic(zFolded, PS_LEFT);
    float dHoro = distToHorocycle(zFolded, PS_BOTTOM);
    float minEdge = min(dVert, dHoro);
    
    if (minEdge < TILING_EDGE_WIDTH) {
        color = LIGHT_GRAY * 0.8;
    }
    
    return color;
}

//-----------
// Grid (for domain interior)
//-----------

float distToGrid(vec2 z) {
    float dMin = 1e10;
    
    float hSpacing = (PS_RIGHT - PS_LEFT) / GRID_H_DIVISIONS;
    float nearestX = PS_LEFT + round((z.x - PS_LEFT) / hSpacing) * hSpacing;
    if (nearestX > PS_LEFT + 0.01 && nearestX < PS_RIGHT - 0.01) {
        dMin = min(dMin, distToVerticalGeodesic(z, nearestX));
    }
    
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
    float dLeft = distToVerticalGeodesic(z, PS_LEFT);
    float dRight = distToVerticalGeodesic(z, PS_RIGHT);
    float dBottom = distToHorocycle(z, PS_BOTTOM);
    float dTop = distToHorocycle(z, PS_TOP);
    return min(min(dLeft, dRight), min(dBottom, dTop));
}

vec3 drawDomain(vec2 z, vec3 baseColor) {
    vec3 color = baseColor;
    
    if (inDomain(z)) {
        color = DOMAIN_FILL;
        
        if (distToGrid(z) < GRID_WIDTH) {
            color = GRID_COLOR;
        }
        
        if (domainEdgeDist(z) < DOMAIN_EDGE_WIDTH) {
            color = DOMAIN_EDGE;
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
        
        // Apply same scaling to both
        z = DOMAIN_SCALE * z;
        
        color = drawRectangularTiling(z);
        color = drawDomain(z, color);
    }
    
    if (diskDist > DISK_RADIUS - DISK_BORDER && diskDist < DISK_RADIUS) {
        color = BLACK;
    }
    
    fragColor = vec4(color, 1.0);
}