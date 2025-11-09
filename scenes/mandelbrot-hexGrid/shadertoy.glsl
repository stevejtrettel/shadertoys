
//---HEXAGON STUFF-----


const float hex_factor = 0.8660254037844386;

#define HEX_FROM_CART(p) vec2(p.x / hex_factor, p.y)
#define CART_FROM_HEX(g) vec2(g.x * hex_factor, g.y)
#define LINECOLOR vec3(0.75, 0.75, 0.75)

vec2 nearestHexCell(in vec2 pos) {

    // integer coords in hex center grid -- will need to be adjusted
    vec2 gpos = HEX_FROM_CART(pos);
    vec2 hex_int = floor(gpos);

    // adjust integer coords
    float sy = step(2.0, mod(hex_int.x+1.0, 4.0));
    hex_int += mod(vec2(hex_int.x, hex_int.y + sy), 2.0);

    // difference vector
    vec2 gdiff = gpos - hex_int;

    // figure out which side of line we are on and modify
    // hex center if necessary
    if (dot(abs(gdiff), vec2(hex_factor*hex_factor, 0.5)) > 1.0) {
        vec2 delta = sign(gdiff) * vec2(2.0, 1.0);
        hex_int += delta;
    }

    return hex_int;

}


vec2 relPosHex(in vec2 pos){
    vec2 center = nearestHexCell(pos);
    return pos-CART_FROM_HEX(center);
}






//---JULIA SET STUFF-----



vec2 complexMult(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

float testJulia(vec2 coord) {
    vec2 mouse = 2.0*iMouse.xy/iResolution.xy -1.0;
    const int iterations = 100;
    vec2 testPoint = coord;
    for (int i = 0; i < iterations; i++){
        testPoint = complexMult(testPoint,testPoint) + mouse;
        float ndot = dot(testPoint,testPoint);
        if (ndot > 45678.0) {
            float sl = float(i) - log2(log2(ndot))+4.0;
            return sl/float(iterations);
        }
    }
    return 0.0;
}


float testJulia(vec2 coord, vec2 center) {
    const int iterations = 100;
    vec2 testPoint = coord;
    for (int i = 0; i < iterations; i++){
        testPoint = complexMult(testPoint,testPoint) + center;
        float ndot = dot(testPoint,testPoint);
        if (ndot > 45678.0) {
            float sl = float(i) - log2(log2(ndot))+4.0;
            return sl/float(iterations);
        }
    }
    return 0.0;
}



vec4 mapColor(float mcol) {
    if(mcol==0.){
        return vec4(0,0,0,1);
    }
    else{
        return vec4(1.-vec3(mcol),1.);
    }
    //return vec4(0.5 + 0.5*cos(2.7+mcol*30.0 + vec3(0.0,.6,1.0)),1.0);
}




//---WINDOW RESIZING STUFF


vec4 relCoords(vec2 uv,float res){

    uv *= res;

    vec2 center = floor(uv);
    vec2 rel = uv-center;
    rel -= vec2(0.5);
    rel *= 2.;

    //rescale the center:
    center /= res;

    //relcoords.zw is the center point of the cell
    //relcoords.xy is the relative coordinates

    return vec4(rel,center);

}




//---MAIN IMAGE

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 aspect = vec2(1,iResolution.y/iResolution.x);
    vec2 fragment = 1.*(fragCoord/iResolution.xy - vec2(0.6,0.5));


    vec2 uv =  300.*aspect * fragment;
    vec2 center = nearestHexCell(uv)/70.;
    vec2 rel =1.25*relPosHex(uv);


    // vec2 uv = 4.*aspect*fragment;
    // vec4 coords = relCoords(uv,20.);
    // vec2 rel = 1.5*coords.xy;
    //vec2 center = coords.zw;

    fragColor = mapColor(testJulia(rel,center));
}
