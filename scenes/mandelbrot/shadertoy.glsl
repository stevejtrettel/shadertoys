
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


float smoothJulia(vec2 coord, vec2 center) {
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

    //inside the set
    return 1.0;
}


vec4 colorFromInterval(float val) {
    //color set black, background white:
    return vec4(1.-vec3(val),1.);
}




//--- Mandelbrot Distance
float mandelbrotDist(vec2 c)
{
    vec2 z = vec2(0.);
    vec2 dz = vec2(0.);
    float lz2 = 0.;
    int i = 0;
    while (i < 1024 && lz2 < 1024.)
    {
        dz = vec2(1., 0.) + 2. * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + dz.x * z.y);
        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + c;
        lz2 = dot(z, z);
        i++;
    }

    if (lz2 >= 1024.)
    {
        float lz = sqrt(lz2);
        //return sqrt(dot(z, z) / dot(dz, dz)) * log(sqrt(dot(z,z)));
        float pow2 = pow(2., 1. - float(i));
        return (1. - pow(lz, -pow2)) / (pow2 * length(dz) / lz);
    }
    else
    {
        return -1.;
    }
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


    float ratio =3.;
    float res = 300.;
    vec2 uv =  ratio*res*aspect * fragment;
    vec2 center = nearestHexCell(uv)/res;

    //SCALING CHOICE 0: CONSTANT
    float scale=1.15;

    //SCALING CHOICE 1:
    //what is the number in front? Should go from 1.25 to 2.5?
    //    float l = length(fragment/vec2(1.5,1)-vec2(-0.,0.));
    //    float scale = 1.25*(1.+3.*l*l-fragment.x/3.);
    //    vec2 rel =scale*relPosHex(uv);
    //
    //SCALING CHOICE 2: MANDELBROT DISTANCE
    // float d = mandelbrotDist(center);
    // float scale = 1.4+5.*max(d,0.);


    //in any case: rescale the relPos in hex coordinates to get your point:
    vec2 rel =scale*relPosHex(uv);


    // vec2 uv = 4.*aspect*fragment;
    // vec4 coords = relCoords(uv,20.);
    // vec2 rel = 1.5*coords.xy;
    //vec2 center = coords.zw;


    fragColor = colorFromInterval(smoothJulia(rel,center));

}
