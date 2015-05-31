//==============================================================================
//
// piLibs 2015 - http://www.iquilezles.org/www/material/piLibs/piLibs.htm
//
// piRenderer
//
//==============================================================================

function piRenderer()
{
    this.mGL = null;
    this.mBindedShader = null;

    this.piCLEAR_Color = 1;
    this.piCLEAR_Zbuffer = 2;
    this.piCLEAR_Stencil = 4;

    this.piTEXFMT_C4I8 = 0;
    this.piTEXFMT_C1I8 = 1;
    this.piTEXFMT_C1F16 = 2;
    this.piTEXFMT_C4F16 = 3;
    this.piTEXFMT_Z16 = 4;

    this.piTEXWRP_CLAMP = 0;
    this.piTEXWRP_REPEAT = 1;

    this.piBUFTYPE_STATIC = 0;
    this.piBUFTYPE_DYNAMIC = 1;

    this.piPRIMTYPE_POINTS = 0;
    this.piPRIMTYPE_LINES = 1;
    this.piPRIMTYPE_LINE_LOOP = 2;
    this.piPRIMTYPE_LINE_STRIP = 3;
    this.piPRIMTYPE_TRIANGLES = 4;
    this.piPRIMTYPE_TRIANGLE_STRIP = 5;

    this.piRENDSTGATE_WIREFRAME = 0;
    this.piRENDSTGATE_FRONT_FACE = 1;
    this.piRENDSTGATE_CULL_FACE = 2;
    this.piRENDSTGATE_DEPTH_TEST = 3;

    this.piFILTER_NEAREST = 0;
    this.piFILTER_LINEAR = 1;
    this.piFILTER_MIPMAP = 2;
}

piRenderer.prototype.Initialize = function( gl )
{
    this.mGL = gl;

    var maxTexSize = gl.getParameter( gl.MAX_TEXTURE_SIZE );
    var maxCubeSize = gl.getParameter( gl.MAX_CUBE_MAP_TEXTURE_SIZE );
    var maxRenderbufferSize = gl.getParameter( gl.MAX_RENDERBUFFER_SIZE );
    var extensions = gl.getSupportedExtensions();
    var textureUnits = gl.getParameter( gl.MAX_TEXTURE_IMAGE_UNITS );

    this.mFloat32Textures = gl.getExtension('OES_texture_float');
    this.mFloat16Textures = gl.getExtension('OES_texture_half_float');
    this.mDrawBuffers     = gl.getExtension('WEBGL_draw_buffers');
    this.mDepthTextures   = gl.getExtension('WEBGL_depth_texture');
/*
    console.log("Story Studio Web Renderer:" +
                "\n   Float32 Textures: " + ((this.mFloat32Textures != null) ? "yes" : "no") +
                "\n   Float16 Textures: " + ((this.mFloat16Textures != null) ? "yes" : "no") +
                "\n   Multiple Render Targets: " + ((this.mDrawBuffers != null) ? "yes" : "no") +
                "\n   Depth Textures: " + ((this.mDepthTextures != null) ? "yes" : "no") +
                "\n   Texture Units: " + textureUnits +
                "\n   Max Texture Size: " + maxTexSize +
                "\n   Max Render Buffer Size: " + maxRenderbufferSize +
                "\n   Max Cubemap Size: " + maxCubeSize);

    console.log("\n" + extensions);
*/
    return true;
}

piRenderer.prototype.CheckErrors = function()
{
    var gl = this.mGL;
    var error = gl.getError();
    if( error != gl.NO_ERROR )
        console.log( "GL Error: " + error );
}

piRenderer.prototype.Clear = function( flags, ccolor, cdepth, cstencil )
{
    var gl = this.mGL;

    var mode = 0;

    if( flags & 1 ) { mode |= gl.COLOR_BUFFER_BIT;   gl.clearColor( ccolor[0], ccolor[1], ccolor[2], ccolor[3] ); }
    if( flags & 2 ) { mode |= gl.DEPTH_BUFFER_BIT;   gl.clearDepth( cdepth ); }
    if( flags & 3 ) { mode |= gl.STENCIL_BUFFER_BIT; gl.clearStencil( cstencil ); }

    gl.clear( mode );
}

piRenderer.prototype.CreateTexture = function (image, format, filter, wrap)
{
    var gl = this.mGL;

    var id = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_2D, id );

    var glFormat = gl.RGBA;
    var glType = gl.UNSIGNED_BYTE;
         if (format === this.piTEXFMT_C4I8) { glFormat = gl.RGBA; glType = gl.UNSIGNED_BYTE; }
    else if (format === this.piTEXFMT_C1I8) { glFormat = gl.ALPHA; glType = gl.UNSIGNED_BYTE; }
    else if (format === this.piTEXFMT_C1F16) { glFormat = gl.ALPHA; glType = gl.FLOAT; }
    else if (format === this.piTEXFMT_C4F16) { glFormat = gl.RGBA; glType = gl.FLOAT; }
    else if (format === this.piTEXFMT_Z16) { glFormat = gl.DEPTH_COMPONENT; glType = gl.UNSIGNED_SHORT; }
    
    var glWrap = gl.REPEAT;
    if (wrap == this.piTEXWRP_CLAMP) glWrap = gl.CLAMP_TO_EDGE;

    gl.texImage2D(gl.TEXTURE_2D, 0, glFormat, image.mXres, image.mYres, 0, glFormat, glType, image.mBuffer);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrap);

    if (filter == this.piFILTER_NEAREST)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    else if (filter == this.piFILTER_LINEAR)
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    else
    {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D)
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    return { mObjectID: id, mXres: image.mXres, mYres: image.mYres };
}

piRenderer.prototype.CreateTexture2 = function (image, format, filter, wrap) 
{
    var gl = this.mGL;

    var id = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, id);

    var glFormat = gl.RGBA;
    var glType = gl.UNSIGNED_BYTE;
         if (format === this.piTEXFMT_C4I8)  { glFormat = gl.RGB;   glType = gl.UNSIGNED_BYTE; }
    else if (format === this.piTEXFMT_C1I8)  { glFormat = gl.ALPHA; glType = gl.UNSIGNED_BYTE; }
    else if (format === this.piTEXFMT_C1F16) { glFormat = gl.ALPHA; glType = gl.FLOAT; }
    else if (format === this.piTEXFMT_C4F16) { glFormat = gl.RGBA;  glType = gl.FLOAT; }
    else if (format === this.piTEXFMT_Z16)   { glFormat = gl.DEPTH_COMPONENT; glType = gl.UNSIGNED_SHORT; }

    var glWrap = gl.REPEAT;
    if (wrap == this.piTEXWRP_CLAMP) glWrap = gl.CLAMP_TO_EDGE;

    gl.texImage2D(gl.TEXTURE_2D, 0, glFormat, glFormat, glType, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, glWrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, glWrap);

    if (filter == 0) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    else if (filter == 1) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D)
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    return { mObjectID: id, mXres: image.mXres, mYres: image.mYres };
}

piRenderer.prototype.CreateMipmaps = function (me)
{
    var gl = this.mGL;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, me.mObjectID);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


piRenderer.prototype.DestroyTexture = function (me)
{
    var gl = this.mGL;
    gl.deleteTexture( me.mObjectID );
}

piRenderer.prototype.AttachTextures = function( t0, t1, t2 )
{
    var gl = this.mGL;

    if( typeof t0 === "undefined" || t0==null ) {} else
    {
        gl.activeTexture( gl.TEXTURE0 + 0 );
        gl.bindTexture( gl.TEXTURE_2D, t0.mObjectID );
    }

    if( typeof t1 === "undefined" || t1==null ) {} else
    {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, t1.mObjectID);
    }

    if( typeof t2 === "undefined" || t2==null ) {} else
    {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, t2.mObjectID);
    }

}

piRenderer.prototype.DettachTextures = function()
{
    var gl = this.mGL;
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

piRenderer.prototype.CreateRenderTarget = function ( color0, color1, color2, color3, depth )
{
    var gl = this.mGL;

    var id =  gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, id);

    if (depth == null)
    {
        var zb = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, zb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, color0.mXres, color0.mYres);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, zb);
    }
    else
    {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth.mObjectID, 0);
    }

    if( color0 !=null ) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color0.mObjectID, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
        return null;

    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { mObjectID: id };
}

piRenderer.prototype.SetRenderTarget = function (me)
{
    var gl = this.mGL;
    if( me==null )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    else
    gl.bindFramebuffer(gl.FRAMEBUFFER, me.mObjectID);
}

piRenderer.prototype.SetViewport = function( vp )
{
    var gl = this.mGL;

    gl.viewport( vp[0], vp[1], vp[2], vp[3] );
}

piRenderer.prototype.SetWriteMask = function( c0, c1, c2, c3, z )
{
    var gl = this.mGL;

    gl.depthMask(z);
    gl.colorMask(c0,c0,c0,c0);
}


piRenderer.prototype.SetState = function( stateName, stateValue )
{
    var gl = this.mGL;

    if (stateName == this.piRENDSTGATE_WIREFRAME)
	{
		if( stateValue ) gl.polygonMode( gl.FRONT_AND_BACK, gl.LINE );
		else        gl.polygonMode( gl.FRONT_AND_BACK, gl.FILL );
	}
    else if (stateName == this.piRENDSTGATE_FRONT_FACE)
    {
        if( stateValue ) gl.cullFace( gl.BACK );
        else             gl.cullFace( gl.FRONT );
    }
    else if (stateName == this.piRENDSTGATE_CULL_FACE)
	{
		if( stateValue ) gl.enable( gl.CULL_FACE );
		else             gl.disable( gl.CULL_FACE );
	}
    else if (stateName == this.piRENDSTGATE_DEPTH_TEST)
	{
		if( stateValue ) gl.enable( gl.DEPTH_TEST );
		else             gl.disable( gl.DEPTH_TEST );
	}

}

piRenderer.prototype.CreateShader = function( vsSource, fsSource, errorStr )
{
    var gl = this.mGL;

    var me = { mProgram: null };

    var vs = gl.createShader(gl.VERTEX_SHADER);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vs, vsSource);
    gl.shaderSource(fs, fsSource);

    gl.compileShader(vs);
    gl.compileShader(fs);
    //-------------
    if( !gl.getShaderParameter(vs, gl.COMPILE_STATUS) )
    {
        var infoLog = gl.getShaderInfoLog(vs);
        errorStr = "VS ERROR: " + infoLog;;
        console.log( errorStr );
        return null;
    }

    if( !gl.getShaderParameter(fs, gl.COMPILE_STATUS) )
    {
        var infoLog = gl.getShaderInfoLog(fs);
        errorStr = "FS ERROR: " + infoLog;
        console.log( errorStr );
        return null;
    }
    //-------------

    me.mProgram = gl.createProgram();

    gl.attachShader( me.mProgram, vs);
    gl.attachShader( me.mProgram, fs);

    gl.linkProgram( me.mProgram );

    if( !gl.getProgramParameter( me.mProgram, gl.LINK_STATUS ) )
    {
        var infoLog = gl.getProgramInfoLog( me.mProgram );
        gl.deleteProgram( me.mProgram );
        errorStr = "LK ERROR: " + infoLog;
        console.log( errorStr );
        return null;
    }

    errorStr = "Shader compiled successfully";

    return me;
}

piRenderer.prototype.AttachShader = function( shader )
{
    var gl = this.mGL;
    this.mBindedShader = shader;
    gl.useProgram( shader.mProgram );
}

piRenderer.prototype.DestroyShader = function( me )
{
    var gl = this.mGL;
    gl.deleteProgram( me.mProgram );
}

piRenderer.prototype.GetAttribLocation = function (shader, name)
{
    var gl = this.mGL;
    return gl.getAttribLocation(shader.mProgram, name);
}

piRenderer.prototype.SetShaderConstantMat4F = function( uname, params, istranspose )
{
    var gl = this.mGL;

    var program = this.mBindedShader;

    var pos = gl.getUniformLocation( program.mProgram, uname );
    if( pos==null )
        return false;

    if( istranspose==false )
    {
        var tmp = new Float32Array( [ params[0], params[4], params[ 8], params[12],
                                      params[1], params[5], params[ 9], params[13],
                                      params[2], params[6], params[10], params[14],
                                      params[3], params[7], params[11], params[15] ] );
	    gl.uniformMatrix4fv(pos,gl.FALSE,tmp);
    }
    else
        gl.uniformMatrix4fv(pos,gl.FALSE,new Float32Array(params) );
    return true;
}


piRenderer.prototype.SetShaderConstant1F = function (uname, x)
{
    var gl = this.mGL;
    var pos = gl.getUniformLocation(this.mBindedShader.mProgram, uname);
    if (pos == null)
        return false;

    gl.uniform1f(pos, x);
    return true;
}

piRenderer.prototype.SetShaderConstant2F = function (uname, x)
{
    var gl = this.mGL;
    var pos = gl.getUniformLocation(this.mBindedShader.mProgram, uname);
    if (pos == null)
        return false;

    gl.uniform2fv(pos, x);
    return true;
}

piRenderer.prototype.SetShaderConstant3F = function (uname, x, y, z)
{
    var gl = this.mGL;
    var pos = gl.getUniformLocation(this.mBindedShader.mProgram, uname);
    if (pos == null)
        return false;

    gl.uniform3f(pos, x, y, z);
    return true;
}

piRenderer.prototype.SetShaderConstant3FV = function (uname, x) {
    var gl = this.mGL;
    var pos = gl.getUniformLocation(this.mBindedShader.mProgram, uname);
    if (pos == null)
        return false;

    gl.uniform3fv(pos, new Float32Array(x) );
    return true;
}

piRenderer.prototype.SetShaderTextureUnit = function( uname, unit )
{
    var gl = this.mGL;
    var program = this.mBindedShader;
    var pos = gl.getUniformLocation( program.mProgram, uname );
    if (pos == null)
        return false;

    gl.uniform1i(pos, unit);
    return true;
}

piRenderer.prototype.CreateVertexArray = function( data, mode )
{
    var gl = this.mGL;
    var id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, id);
    if (mode === this.piBUFTYPE_STATIC)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    else
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    return { mObject: id };
}

piRenderer.prototype.CreateIndexArray = function( data, mode )
{
    var gl = this.mGL;
    var id = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id );
    if (mode === this.piBUFTYPE_STATIC)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    else
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    return { mObject: id };
}

piRenderer.prototype.DestroyArray = function( me )
{
    var gl = this.mGL;
    gl.destroyBuffer(me.mObject);
}

piRenderer.prototype.AttachVertexArray = function( me, attribs, pos )
{
    var gl = this.mGL;
    var shader = this.mBindedShader;

    gl.bindBuffer( gl.ARRAY_BUFFER, me.mObject);

    var num = attribs.mChannels.length;
    var stride = attribs.mStride;

    var offset = 0;
    for (var i = 0; i < num; i++)
    {
        var id = pos[i];
        gl.enableVertexAttribArray(id);
        gl.vertexAttribPointer(id, attribs.mChannels[i], gl.FLOAT, false, stride, offset);
        offset += attribs.mChannels[i] * 4;
    }

}

piRenderer.prototype.AttachIndexArray = function( me )
{
    var gl = this.mGL;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, me.mObject);
}

piRenderer.prototype.DetachVertexArray = function (me, attribs)
{
    var gl = this.mGL;
    var num = attribs.mChannels.length;
    for (var i = 0; i < num; i++)
        gl.disableVertexAttribArray(i);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

piRenderer.prototype.DetachIndexArray = function( me )
{
    var gl = this.mGL;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}


piRenderer.prototype.DrawPrimitive = function( typeOfPrimitive, num, useIndexArray )
{
    var gl = this.mGL;

    var glType = gl.POINTS;
    if( typeOfPrimitive==this.piPRIMTYPE_POINTS ) glType = gl.POINTS;
    if( typeOfPrimitive==this.piPRIMTYPE_LINES ) glType = gl.LINES;
    if( typeOfPrimitive==this.piPRIMTYPE_LINE_LOOP ) glType = gl.LINE_LOOP;
    if( typeOfPrimitive==this.piPRIMTYPE_LINE_STRIP ) glType = gl.LINE_STRIP;
    if( typeOfPrimitive==this.piPRIMTYPE_TRIANGLES ) glType = gl.TRIANGLES;
    if( typeOfPrimitive==this.piPRIMTYPE_TRIANGLE_STRIP ) glType = gl.TRIANGLE_STRIP;

  	if( useIndexArray )
		gl.drawElements( glType, num, gl.UNSIGNED_SHORT, 0 );
	else
		gl.drawArrays( glType, 0, num );
}

piRenderer.prototype.SetBlend = function( enabled )
{
    var gl = this.mGL;
    if( enabled )
    {
        gl.enable( gl.BLEND );
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    else
    {
        gl.disable( gl.BLEND );
    }

}

//==============================================================================
//
// piLibs 2015 - http://www.iquilezles.org/www/material/piLibs/piLibs.htm
//
// piShading
//
//==============================================================================

function smoothstep(a, b, x)
{
    x = (x - a) / (b - a);
    if (x < 0) x = 0; else if (x > 1) x = 1;
    return x * x * (3.0 - 2.0 * x);
}

function clamp01(x)
{
    if( x < 0.0 ) x = 0.0;
    if( x > 1.0 ) x = 1.0;
    return x;
}

function clamp(x, a, b)
{
    if( x < a ) x = a;
    if( x > b ) x = b;
    return x;
}

function screen(a, b)
{
    return 1.0 - (1.0 - a) * (1.0 - b);
}

function parabola(x)
{
    return 4.0 * x * (1.0 - x);
}

function max(a, b)
{
    return (a > b) ? a : b;
}

function noise( x )
{
    function grad(i, j, x, y)
    {
        h = 7 * i + 131 * j;
        h = (h << 13) ^ h;
        h = (h * (h * h * 15731 + 789221) + 1376312589);

        var rx = (h & 0x20000000) ? x : -x;
        var ry = (h & 0x10000000) ? y : -y;

        return rx + ry;
    }

    var i = [ Math.floor(x[0]), Math.floor(x[1]) ];
    var f = [ x[0] - i[0], x[1] - i[1] ];
    var w = [ f[0]*f[0]*(3.0-2.0*f[0]), f[1]*f[1]*(3.0-2.0*f[1]) ];

    var a = grad( i[0]+0, i[1]+0, f[0]+0.0, f[1]+0.0 );
    var b = grad( i[0]+1, i[1]+0, f[0]-1.0, f[1]+0.0 );
    var c = grad( i[0]+0, i[1]+1, f[0]+0.0, f[1]-1.0 );
    var d = grad( i[0]+1, i[1]+1, f[0]-1.0, f[1]-1.0 );

    return a + (b-a)*w[0] + (c-a)*w[1] + (a-b-c+d)*w[0]*w[1];
}
//==============================================================================
//
// piLibs 2015 - http://www.iquilezles.org/www/material/piLibs/piLibs.htm
//
// piWebUtils
//
//==============================================================================


window.requestAnimFrame = ( function () { return window.requestAnimationFrame    || window.webkitRequestAnimationFrame ||
                                                 window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
                                                 window.msRequestAnimationFrame  || function( cb ) { window.setTimeout(cb,1000/60); };
                                        }
                           )();

window.URL = window.URL || window.webkitURL;


navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

function piDisableTouch()
{
    document.body.addEventListener('touchstart', function(e){ e.preventDefault(); });
}

function piGetCoords( obj )
{
    var x = y = 0; 
    do
    {
         x += obj.offsetLeft;
         y += obj.offsetTop;
    }while( obj = obj.offsetParent );

    return { mX:x, mY:y };
}

function piGetMouseCoords( ev, canvasElement )
{
    var pos = piGetCoords(canvasElement );
    var mcx =                        (ev.pageX - pos.mX) * canvasElement.width / canvasElement.offsetWidth;
    var mcy = canvasElement.height - (ev.pageY - pos.mY) * canvasElement.height / canvasElement.offsetHeight;

    return { mX: mcx, mY: mcy };

}


piIsFullScreen = function()
{
    return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement || false;
}


piCreateGlContext = function (cv)
{
    var gl = cv.getContext("webgl", { alpha: false, depth: true });
    if( gl == null)
        gl = cv.getContext("experimental-webgl", { alpha: false, depth: true });
    return gl;
}


function piHexColorToRGB(str) // "#ff3041"
{
    var rgb = parseInt(str.slice(1), 16);
    var r = (rgb >> 16) & 255;
    var g = (rgb >> 8) & 255;
    var b = (rgb >> 0) & 255;
    return [r, g, b];
}

