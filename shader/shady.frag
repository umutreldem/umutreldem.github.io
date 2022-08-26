precision highp float;

		varying vec2 vUV;

		uniform sampler2D tex;
		uniform float time;
		uniform float frequency;
		uniform float amplitude;

		void main() {
			vec2 uv = vec2(1.0, 1.0) - vUV;
			//flip the image so its the right way around
			uv.x = uv.x * -1.0;

			// lets create a sine wave to distort our texture coords
			// we will use the built in sin() function in glsl
			// sin() returns the sine of an angle in radians
			// first will multiply our uv * frequency -- frequency will control how many hills and valleys will be in the wave
			// then we add some time to our sine, this will make it move 
			// lastly multiply the whole thing by amplitude -- amplitude controls how tall the hills and valleys are, in this case it will be how much to distort the image
			// *try changing uv.y to uv.x and see what happens

			float sineWave = sin(uv.y * frequency + time) * amplitude;

			// create a vec2 with our sine
			// what happens if you put sineWave in the y slot? in Both slots?
			vec2 distort = vec2(sineWave, sineWave);

			// use mod() to wrap our texcoords back to 0.0 if they go over 1.0
			vec4 texColor = texture2D(tex, mod(uv - distort, 1.0));

			gl_FragColor = texColor;
		}