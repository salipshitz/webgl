const vertexShader_t = [
'precision mediump float;',

'uniform mat4 matWorld;',
'uniform mat4 matView;',
'uniform mat4 matProj;',

'attribute vec3 vertPosition;',
'attribute vec2 vertTexCoord;',

'varying vec2 fragTexCoord;',

'void main() {',
  'fragTexCoord = vertTexCoord;',
  'gl_Position = matProj * matView * matWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

const fragmentShader_t = [
'precision mediump float;',

'varying vec2 fragTexCoord;',
'uniform sampler2D sampler;',

'void main() {',
  'gl_FragColor = texture2D(sampler, fragTexCoord);', 
'}'
].join('\n');

function Start() {
  //(s) WebGL
  const canvas = document.getElementById('triangle-canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl === null) {
    alert('Your browser does not support WebGL');
    return;
  }
  
  gl.enable(gl.DEPTH_TEST);
  
  //(s) Shaders:
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShader_t);
  gl.compileShader(vertexShader);
  
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShader_t);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  //(g) Cube:
  const cubeVertices = [
  //  X    Y    Z     U   V

    //TOP
    -1.0, 1.0,-1.0,  0.0,0.0,
    -1.0, 1.0, 1.0,  0.0,1.0,
     1.0, 1.0, 1.0,  1.0,1.0,
     1.0, 1.0,-1.0,  1.0,0.0,
    
    //RIGHT
     1.0, 1.0, 1.0,  1.0,1.0,
     1.0,-1.0, 1.0,  0.0,1.0,
     1.0,-1.0,-1.0,  0.0,0.0,
     1.0, 1.0,-1.0,  1.0,0.0,
    
    //FRONT
     1.0, 1.0, 1.0,  1.0,1.0,
     1.0,-1.0, 1.0,  1.0,0.0,
    -1.0,-1.0, 1.0,  0.0,0.0,
    -1.0, 1.0, 1.0,  0.0,1.0,

    //BOTTOM
    -1.0,-1.0,-1.0,  0.0,0.0,
    -1.0,-1.0, 1.0,  0.0,1.0,
     1.0,-1.0, 1.0,  1.0,1.0,
     1.0,-1.0,-1.0,  1.0,0.0,
    
    //LEFT
    -1.0, 1.0, 1.0,  1.0,1.0,
    -1.0,-1.0, 1.0,  0.0,1.0,
    -1.0,-1.0,-1.0,  0.0,0.0,
    -1.0, 1.0,-1.0,  1.0,0.0,
    
    //BACK
     1.0, 1.0,-1.0,  1.0,1.0,
     1.0,-1.0,-1.0,  1.0,0.0,
    -1.0,-1.0,-1.0,  0.0,0.0,
    -1.0, 1.0,-1.0,  1.0,0.0
  ];
  const cubeIndices = [
    //TOP
     0, 1, 2,
     0, 2, 3,
    
    //RIGHT
     4, 5, 6,
     4, 6, 7,
    
    //FRONT
     8, 9,10,
     8,10,11,
    
    //BOTTOM
    12,13,14,
    12,14,15,
    
    //LEFT
    16,17,18,
    16,18,19,
    
    //BACK
    20,21,22,
    20,22,23
  ];
  
  const cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);
  
  const cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
  
  const position_a = gl.getAttribLocation(program, 'vertPosition');
  gl.vertexAttribPointer(
    position_a, //Attribute
    3, //Number of elements
    gl.FLOAT, //Type of elements
    gl.FALSE, //Normalize
    5*Float32Array.BYTES_PER_ELEMENT, //Size of vertex
    0 //Offset: vertex beginning-attribute
  );
  gl.enableVertexAttribArray(position_a);
  
  const texCoord_a = gl.getAttribLocation(program, 'vertTexCoord');
  gl.vertexAttribPointer(
    texCoord_a,
    2 ,
    gl.FLOAT,
    gl.FALSE,
    5*Float32Array.BYTES_PER_ELEMENT,
    3*Float32Array.BYTES_PER_ELEMENT
  );
  gl.enableVertexAttribArray(texCoord_a);
  
  const cubeTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, cubeTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    document.getElementById('brick-tex')
  );
  gl.useProgram(program);
  
  const matWorldUnif = gl.getUniformLocation(program, 'matWorld');
  var worldMat = new Float32Array(16);
  mat4.identity(worldMat);
  gl.uniformMatrix4fv(matWorldUnif, gl.FALSE, worldMat);
  
  const matViewUnif = gl.getUniformLocation(program, 'matView');
  var viewMat = new Float32Array(16);
  mat4.lookAt(viewMat, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
  gl.uniformMatrix4fv(matViewUnif, gl.FALSE, viewMat);
  
  const matProjUnif = gl.getUniformLocation(program, 'matProj');
  var projMat = new Float32Array(16);
  mat4.perspective(projMat, glMatrix.toRadian(45), canvas.width/canvas.height, 0.1, 1000.0);
  gl.uniformMatrix4fv(matProjUnif, gl.FALSE, projMat);
  
  //(s) Render loop
  var xRot = new Float32Array(16);
  var yRot = new Float32Array(16);
  var identityMat = new Float32Array(16);
  mat4.identity(identityMat);
  var tick = function() {
    var angle = performance.now()/1000 * 2*Math.PI/6;
    mat4.rotate(yRot, identityMat, angle, [0, 1, 0]);
    mat4.rotate(xRot, identityMat, angle/4, [1, 0, 0]);
    mat4.mul(worldMat, yRot, xRot);
    gl.uniformMatrix4fv(matWorldUnif, gl.FALSE, worldMat);
  }
  var draw = function() {
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
  }
  var loop = function() {
    tick();
    
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw();
    
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
