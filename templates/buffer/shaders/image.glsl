void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Read from BufferA
    vec4 bufferData = texelFetch(iChannel0, ivec2(fragCoord), 0);

    // Use the buffer data as color
    vec3 col = bufferData.rgb;

    // Output to screen
    fragColor = vec4(col, 1.0);
}
