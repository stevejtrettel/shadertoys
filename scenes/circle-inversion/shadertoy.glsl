struct Circle{
    vec2 center;
    float radius;
};

vec2 inversion(vec2 pos, Circle circ){
    vec2 diff = pos-circ.center;
    float rho = length(diff);
    vec2 dir = diff/rho;

    float rhoTilde = circ.radius*circ.radius / rho;

    return rhoTilde*dir;

}


float grid( vec2 pos ){
    float x = mod(pos.x,1.);
    float y = mod(pos.y,1.);

    if(x<0.5&&y<0.5|| x>0.5&&y>0.5){
        return 1.;
    }
    return 0.;
}


vec2 setDomain( vec2 fragCoord ){
    vec2 uv = fragCoord/iResolution.xy;
    uv -= vec2(0.5);
    uv *= vec2(1,iResolution.y/iResolution.x);
    uv *= 5.;
    return uv;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 uv =setDomain(fragCoord);
    vec2 mouse = setDomain(iMouse.xy);

    Circle circ;
    circ.radius =1.;
    circ.center=mouse;

    vec2 pos = inversion(uv,circ);


    // Time varying pixel color
    vec3 col = grid(pos-mouse)*vec3(1,1,1);

    if(abs(length(uv-circ.center)-circ.radius)<0.01){
        col=vec3(1,0,0);
    }

    // Output to screen
    fragColor = vec4(col,1.0);
}
