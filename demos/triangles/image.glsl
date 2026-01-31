
vec2 normalizeCoords(vec2 fragCoord) {
    // Normalize coordinates to 0-1 range
    vec2 uv = (fragCoord - vec2(iResolution.x/2.,0.)) / iResolution.y;
    uv *= 8.;
    return uv;
}


float dist(vec2 p, vec2 q ){
    float num = length(p-q);
    float denom = 2.*sqrt(p.y*q.y);
    return 2.*asinh(num/denom);
}

vec3 angles(float a, float b, float c){

    float ca = cosh(a);
    float sa = sinh(a);
    float cb = cosh(b);
    float sb = sinh(b);
    float cc = cosh(c);
    float sc = sinh(c);

    float calpha = (cb*cc - ca)/(sb*sc);
    float cbeta = (ca*cc - cb)/(sa*sc);
    float cgamma = (ca*cb - cc)/(sa*sb);

    return vec3( acos(calpha), acos(cbeta), acos(cgamma));
}


float area(vec2 p, vec2 q, vec2 r){


    float a = dist(q,r);
    float b = dist(p,r);
    float c = dist(p,q);

    vec3 ang = angles(a,b,c);

    return 3.14159 - ang.x - ang.y - ang.z;

}

float eucMirror( vec2 p, vec2 q, vec2 r){

    return atan((r.y+p.y),(r.x-p.x))-atan((r.y+q.y),(r.x-q.x));

}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    vec2 uv = normalizeCoords(fragCoord);

    float t1 = 0.1;
    float t2= -t1;
    vec2 p = vec2(sin(t1),cos(t1));
    vec2 q = normalizeCoords(iMouse.xy);
    //vec2(sin(t2),cos(t2));
    
    vec3 col = vec3(0.);

    if(dist(uv,p)<0.05|| dist(uv,q)<0.05){
        col = vec3(1,0,0);
    }


    float a = area(p,q,uv);
    float a0 = area(p,q,vec2(0.,2.));
    float diff = abs(a-a0);

    if(fract(5.*diff)<0.1){
        col=vec3(1.);
    }




    float euc = abs(eucMirror(p,q,uv));

    if(fract(5.*euc)<0.1){
       col=vec3(1.,0,0);
    }

    // Output the final color
    fragColor = vec4(col, 1.0);
}



// H2 Area Level Sets with Geodesic Drawing
// // Upper Half-Plane Model

// const float PI = 3.14159265359;
// const float THICKNESS = 0.02;  // Line thickness in screen coords
// const float POINT_RAD = 0.08;  // Point radius in hyperbolic distance

// // ============================================
// // Coordinate utilities
// // ============================================

// vec2 normalizeCoords(vec2 fragCoord) {
//     vec2 uv = (fragCoord - vec2(iResolution.x / 2., 0.)) / iResolution.y;
//     uv *= 8.;
//     return uv;
// }

// // ============================================
// // Hyperbolic geometry functions
// // ============================================

// // Hyperbolic distance in upper half-plane
// float hdist(vec2 p, vec2 q) {
//     float num = length(p - q);
//     float denom = 2. * sqrt(p.y * q.y);
//     return 2. * asinh(num / denom);
// }

// // Triangle angles from side lengths (hyperbolic law of cosines)
// vec3 angles(float a, float b, float c) {
//     float ca = cosh(a), sa = sinh(a);
//     float cb = cosh(b), sb = sinh(b);
//     float cc = cosh(c), sc = sinh(c);
    
//     float cosAlpha = (cb * cc - ca) / (sb * sc);
//     float cosBeta  = (ca * cc - cb) / (sa * sc);
//     float cosGamma = (ca * cb - cc) / (sa * sb);
    
//     // Clamp to avoid NaN from numerical issues
//     cosAlpha = clamp(cosAlpha, -1., 1.);
//     cosBeta  = clamp(cosBeta, -1., 1.);
//     cosGamma = clamp(cosGamma, -1., 1.);
    
//     return vec3(acos(cosAlpha), acos(cosBeta), acos(cosGamma));
// }

// // Hyperbolic area via angle defect
// float area(vec2 p, vec2 q, vec2 r) {
//     float a = hdist(q, r);
//     float b = hdist(p, r);
//     float c = hdist(p, q);
//     vec3 ang = angles(a, b, c);
//     return PI - ang.x - ang.y - ang.z;
// }

// // ============================================
// // Geodesic geometry in UHP
// // ============================================

// // For two points p, q in UHP, the geodesic is:
// // - A vertical line if p.x == q.x
// // - Otherwise, a semicircle centered on the real axis
// //
// // The semicircle passes through p and q, so its center (cx, 0)
// // satisfies |p - (cx,0)|^2 = |q - (cx,0)|^2 = r^2

// struct Geodesic {
//     bool isVertical;
//     float cx;      // Center x-coordinate (if not vertical)
//     float radius;  // Radius (if not vertical)
//     float x;       // x-coordinate (if vertical)
// };

// Geodesic geodesicThrough(vec2 p, vec2 q) {
//     Geodesic g;
    
//     if (abs(p.x - q.x) < 1e-6) {
//         g.isVertical = true;
//         g.x = p.x;
//         g.cx = 0.;
//         g.radius = 0.;
//     } else {
//         g.isVertical = false;
//         // Center lies on real axis, equidistant from p and q
//         // |p - c|^2 = |q - c|^2
//         // (p.x - cx)^2 + p.y^2 = (q.x - cx)^2 + q.y^2
//         // Solving: cx = ((p.x^2 + p.y^2) - (q.x^2 + q.y^2)) / (2(p.x - q.x))
//         g.cx = (dot(p, p) - dot(q, q)) / (2. * (p.x - q.x));
//         g.radius = length(p - vec2(g.cx, 0.));
//         g.x = 0.;
//     }
    
//     return g;
// }

// // Euclidean distance from point to geodesic
// float distToGeodesic(vec2 pt, Geodesic g) {
//     if (g.isVertical) {
//         return abs(pt.x - g.x);
//     } else {
//         float d = length(pt - vec2(g.cx, 0.));
//         return abs(d - g.radius);
//     }
// }

// // Check if point is "between" p and q on the geodesic
// // For a semicircle, this means the angle is between the angles to p and q
// bool onGeodesicArc(vec2 pt, vec2 p, vec2 q, Geodesic g) {
//     if (g.isVertical) {
//         float minY = min(p.y, q.y);
//         float maxY = max(p.y, q.y);
//         return pt.y >= minY && pt.y <= maxY;
//     } else {
//         vec2 center = vec2(g.cx, 0.);
//         float angleP = atan(p.y, p.x - g.cx);
//         float angleQ = atan(q.y, q.x - g.cx);
//         float anglePt = atan(pt.y, pt.x - g.cx);
        
//         // Ensure angles are in [0, PI] since we're in UHP
//         float minAngle = min(angleP, angleQ);
//         float maxAngle = max(angleP, angleQ);
        
//         return anglePt >= minAngle && anglePt <= maxAngle;
//     }
// }

// // ============================================
// // Drawing primitives
// // ============================================

// // Is pixel within hyperbolic distance 'rad' of point p?
// bool inPoint(vec2 uv, vec2 p, float rad) {
//     return hdist(uv, p) < rad;
// }

// // Is pixel on the geodesic segment from p to q (screen-space thickness)?
// bool onSegment(vec2 uv, vec2 p, vec2 q, float thickness) {
//     // Must be in upper half-plane
//     if (uv.y <= 0.) return false;
    
//     Geodesic g = geodesicThrough(p, q);
//     float d = distToGeodesic(uv, g);
    
//     return d < thickness && onGeodesicArc(uv, p, q, g);
// }

// // Is pixel inside the hyperbolic triangle with vertices p, q, r?
// // Uses winding number approach with geodesic "sidedness"
// bool inTriangle(vec2 uv, vec2 p, vec2 q, vec2 r) {
//     if (uv.y <= 0.) return false;
    
//     // For each edge, determine which side uv is on
//     // For a geodesic semicircle, "inside" means closer to center than radius
//     // For vertical, it's just left/right
    
//     Geodesic g1 = geodesicThrough(p, q);
//     Geodesic g2 = geodesicThrough(q, r);
//     Geodesic g3 = geodesicThrough(r, p);
    
//     // Signed distance: positive = outside the circle (away from center)
//     // We need consistent orientation
    
//     float s1, s2, s3;
    
//     if (g1.isVertical) {
//         s1 = (uv.x - g1.x) * sign(r.x - g1.x);
//     } else {
//         float dUV = length(uv - vec2(g1.cx, 0.)) - g1.radius;
//         float dR = length(r - vec2(g1.cx, 0.)) - g1.radius;
//         s1 = dUV * sign(dR);
//     }
    
//     if (g2.isVertical) {
//         s2 = (uv.x - g2.x) * sign(p.x - g2.x);
//     } else {
//         float dUV = length(uv - vec2(g2.cx, 0.)) - g2.radius;
//         float dP = length(p - vec2(g2.cx, 0.)) - g2.radius;
//         s2 = dUV * sign(dP);
//     }
    
//     if (g3.isVertical) {
//         s3 = (uv.x - g3.x) * sign(q.x - g3.x);
//     } else {
//         float dUV = length(uv - vec2(g3.cx, 0.)) - g3.radius;
//         float dQ = length(q - vec2(g3.cx, 0.)) - g3.radius;
//         s3 = dUV * sign(dQ);
//     }
    
//     return s1 >= 0. && s2 >= 0. && s3 >= 0.;
// }

// // ============================================
// // Main
// // ============================================

// void mainImage(out vec4 fragColor, in vec2 fragCoord) {
//     vec2 uv = normalizeCoords(fragCoord);
    
//     // Skip if below the real axis
//     if (uv.y <= 0.) {
//         fragColor = vec4(0.1, 0.1, 0.15, 1.);
//         return;
//     }
    
//     // Animated segment endpoints
//     float t = iTime * 0.3;
//     vec2 p = vec2(-1.5 + 0.5 * sin(t), 1.5 + 0.3 * cos(t * 1.3));
//     vec2 q = vec2(1.5 + 0.3 * cos(t * 0.7), 1.2 + 0.4 * sin(t * 0.9));
    
//     // Or use mouse for q:
//     // vec2 q = normalizeCoords(iMouse.xy);
//     // if (q.y <= 0.1) q = vec2(1.5, 1.2);
    
//     vec3 col = vec3(0.05, 0.05, 0.08);  // Dark background
    
//     // Draw level sets of area function
//     float a = area(p, q, uv);
//     float a0 = area(p, q, vec2(0., 2.5));  // Reference area
//     float diff = abs(a - a0);
    
//     // Smooth level set lines
//     float levelVal = fract(5. * a);
//     float levelLine = smoothstep(0.02, 0.0, abs(levelVal - 0.5) - 0.45);
//     col += vec3(0.15, 0.25, 0.4) * levelLine;
    
//     // Color by area value
//     col += vec3(0.1, 0.05, 0.15) * smoothstep(0., 2., a);
    
//     // Draw the geodesic segment
//     if (onSegment(uv, p, q, THICKNESS)) {
//         col = vec3(0.9, 0.7, 0.2);
//     }
    
//     // Draw a sample triangle
//     vec2 r = vec2(0., 2.5);  // Third vertex
    
//     // Fill triangle with subtle color
//     if (inTriangle(uv, p, q, r)) {
//         col = mix(col, vec3(0.2, 0.5, 0.4), 0.3);
//     }
    
//     // Draw triangle edges
//     if (onSegment(uv, p, r, THICKNESS * 0.7)) col = vec3(0.4, 0.8, 0.6);
//     if (onSegment(uv, q, r, THICKNESS * 0.7)) col = vec3(0.4, 0.8, 0.6);
    
//     // Draw vertices
//     if (inPoint(uv, p, POINT_RAD)) col = vec3(1., 0.3, 0.3);
//     if (inPoint(uv, q, POINT_RAD)) col = vec3(1., 0.3, 0.3);
//     if (inPoint(uv, r, POINT_RAD)) col = vec3(0.3, 1., 0.5);
    
//     // Draw real axis
//     if (abs(uv.y) < 0.02) col = vec3(0.3);
    
//     fragColor = vec4(col, 1.);
// }
