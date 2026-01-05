// BufferA: Persistent painting
// Reads its own previous frame to keep what was drawn

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Read what was here last frame
    vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0);

    // Check distance to mouse
    float d = length(fragCoord - iMouse.xy);

    // If mouse is pressed (z > 0) and we're close, paint white
    if (iMouse.z > 0.0 && d < 10.0) {
        fragColor = vec4(1.0);
    } else {
        fragColor = prev;
    }
}
