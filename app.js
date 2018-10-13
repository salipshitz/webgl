function Start() {
  const canvas = document.getElementById('triangle-canvas');
  const gl = canvas.getContext('webgl');
  if (gl === null) gl = canvas.getContext('experimental-webgl');
  if (gl === null) alert('Your browser does not support WebGL');
}
