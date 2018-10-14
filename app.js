var keys = {};
var rotateSpeed = 0.5;
document.onkeydown = function(event) { keys[event.key] = true; };
document.onkeyup = function(event) { console.log("KEYUP"); keys[event.key] = false; };

var vertexShaderText = [
'precision mediump float;',

'attribute vec3 vertPosition;',
'attribute vec2 vertTexCoord;',
'varying vec2 fragTexCoord;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProj;',

'void main() {',
  'fragTexCoord = vertTexCoord;',
  'gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');
var viewMatrix;
var fragmentShaderText = [
'precision mediump float;',

'varying vec2 fragTexCoord;',
'uniform sampler2D sampler;',

'void main() {',
  'gl_FragColor = texture2D(sampler, fragTexCoord);',
'}'
].join('\n');

var gl;

var Start = function () {
	console.log('This is working');

	var canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl');

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	//
	// Create shaders
	// 
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	//
	// Create buffer
	//
	var boxVerticesTB = 
	[ // X, Y, Z           U, V
		// Top
		-1.0, 1.0, -1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,
		1.0, 1.0, 1.0,     1, 1,
		1.0, 1.0, -1.0,    1, 0,
		
		// Bottom
		-1.0, -1.0, -1.0,   0, 0,
		-1.0, -1.0, 1.0,    0, 1,
		1.0, -1.0, 1.0,     1, 1,
		1.0, -1.0, -1.0,    1, 0,
	];

	var boxIndicesTB =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Bottom
		13, 12, 14,
		14, 12, 15
	];
	
	var boxVerticesLR = [
		// Left
		-1.0, 1.0, 1.0,    1, 1,
		-1.0, -1.0, 1.0,   0, 1,
		-1.0, -1.0, -1.0,  0, 0,
		-1.0, 1.0, -1.0,   1, 0,

		// Right
		1.0, 1.0, 1.0,     1, 1,
		1.0, -1.0, 1.0,    0, 1,
		1.0, -1.0, -1.0,   0, 0,
		1.0, 1.0, -1.0,    1, 0,
	];
	
	var boxIndicesLR = [
		// Left
		1, 0, 2,
		2, 0, 3,

		// Right
		4, 5, 6,
		4, 6, 7
	];
	
	var boxVerticesFB = [
		// Front
		1.0, 1.0, 1.0,     1, 1,
		1.0, -1.0, 1.0,    1, 0,
		-1.0, -1.0, 1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,

		// Back
		1.0, 1.0, -1.0,     1, 1,
		1.0, -1.0, -1.0,    1, 0,
		-1.0, -1.0, -1.0,   0, 0,
		-1.0, 1.0, -1.0,    0, 1,
	];
	
	var boxIndicesFB = [
		// Front
		1, 0, 2,
		3, 2, 0,

		// Back
		4, 5, 6,
		4, 6, 7,
	];

	var boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	var boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);

	
	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');

	//
	// Create texture
	//
	const boxTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, boxTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	// Tell OpenGL state machine which program should be active.
	gl.useProgram(program);

	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	var worldMatrix = new Float32Array(16);
	viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var xRotationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);

	//
	// Main render loop
	//
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	var angle = 0;
	var tick = function () {
		angle = performance.now() / 1000 / 6 * 2 * Math.PI;
		mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
		mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
		mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

	};
	var draw = function () {
		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		
		//Front/Back
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVerticesFB), gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndicesFB), gl.STATIC_DRAW);
		gl.texImage2D(
			gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
			gl.UNSIGNED_BYTE,
			document.getElementById('brick-image')
		);
		gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(positionAttribLocation);
		gl.enableVertexAttribArray(texCoordAttribLocation);
		gl.activeTexture(gl.TEXTURE0);
		gl.drawElements(gl.TRIANGLES, boxIndicesFB.length, gl.UNSIGNED_SHORT, 0);
		
		//Left/Right
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVerticesLR), gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndicesLR), gl.STATIC_DRAW);
		gl.texImage2D(
			gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
			gl.UNSIGNED_BYTE,
			document.getElementById('brick1-image')
		);
		gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(positionAttribLocation);
		gl.enableVertexAttribArray(texCoordAttribLocation);
		gl.activeTexture(gl.TEXTURE0);
		gl.drawElements(gl.TRIANGLES, boxIndicesLR.length, gl.UNSIGNED_SHORT, 0);
		
		//Top/Bottom
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVerticesTB), gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndicesTB), gl.STATIC_DRAW);
		gl.texImage2D(
			gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
			gl.UNSIGNED_BYTE,
			document.getElementById('brick2-image')
		);
		gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(positionAttribLocation);
		gl.enableVertexAttribArray(texCoordAttribLocation);
		gl.activeTexture(gl.TEXTURE0);
		gl.drawElements(gl.TRIANGLES, boxIndicesTB.length, gl.UNSIGNED_SHORT, 0);

	};
	var loop = function () {
		if (keys['ArrowUp']) {}
		if (!keys[' ']) {
			tick();
			draw();
		}
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};
