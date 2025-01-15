"use client";

import { Canvas as DefaultCanvas, useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface ShaderMaterialType extends THREE.ShaderMaterial {
  uniforms: {
    time: { value: number };
    target: { value: number };
    resolution: { value: THREE.Vector2 };
    mainTexture: { value: THREE.Texture | null };
    UIText: { value: THREE.Texture | null };
    scale: { value: number };
  };
}

interface ShaderEffectProps {
  margin?: number;
}

interface TextureData extends THREE.Texture {
  userData: {
    name: string;
    description: string;
  };
}

const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #define PI 3.14159265359
  #define TWO_PI 6.28318530718
  
  varying vec2 vUv;
  uniform vec2 resolution;
  uniform float time;
  uniform float target;
  uniform float scale;
  uniform sampler2D mainTexture;
  uniform sampler2D UIText;

  float random(float value){
    return fract(sin(value) * 43758.5453123);
  }

  float random(vec2 tex){
    return fract(sin(dot(tex.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float random(vec3 tex){
    return fract(sin(dot(tex.xyz, vec3(12.9898, 78.233, 12.9898))) * 43758.5453123);
  }

  vec4 addGrain(vec2 uv, float time, float grainIntensity){
    float grain = random(fract(uv * time)) * grainIntensity;
    return vec4(vec3(grain), 1.0);
  }

  float addStreamLine(vec2 uv, float rows, float height, float smooth_){
    vec2 uvstream = uv * vec2(1.0, rows);
    float distFromCenter = abs(0.5 - fract(uvstream.y));
    float edge = smoothstep(height - smooth_*0.5, height + smooth_*0.5, distFromCenter);
    return edge;
  }

  vec2 lensDistort(vec2 uv, float power, float radInc) {
    float theta  = atan(uv.y, uv.x);
    float radius = length(uv);
    radius = pow(radius, power) * radInc;
    uv.x = radius * cos(theta);
    uv.y = radius * sin(theta);
    return 0.5 * (uv + 1.0);
  }

  float rect(vec2 uv, vec2 length, float smooth_){
    float dx = abs(uv.x - 0.5);
    float dy = abs(uv.y - 0.5);
    float lenx = 1.0 - smoothstep(length.x - smooth_, length.x + smooth_, dx);
    float leny = 1.0 - smoothstep(length.y - smooth_, length.y + smooth_, dy);
    return lenx * leny;
  }
  
  void main(){
    vec2 uv = vUv;
    
    // Scale UV coordinates from center
    vec2 center = vec2(0.5, 0.5);
    uv = center + (uv - center) * scale;
    
    uv = lensDistort(uv.xy * 2.0 - 1.0, 1.25, 1.2);
  
    vec2 offset = vec2(random(time) * 0.0035, 0.0);
    vec2 nuv = uv + vec2(0.0, fract(time * 0.1));
    vec2 nuvThick = uv + vec2(0.0, fract(time * 0.15));

    float numberOfline = 100.0;
    vec2 iuv = floor(uv * numberOfline) / numberOfline;

    float amplitude = 0.00025 + random(time) * 0.001;
    float period = 20.0;
    float wave = sin(TWO_PI * period * (iuv.y + time + random(iuv.y) * 0.5 + 0.5)) * amplitude;
    uv.x += wave;

    float amplitudeBig = 0.005;
    float periodBig = 0.75;
    float waveBig = sin(TWO_PI * periodBig * uv.y + time) * amplitudeBig;
    uv.x += waveBig;

    // Clamp UV coordinates to prevent sampling outside texture
    uv = clamp(uv, 0.0, 1.0);

    float distanceTex = texture2D(mainTexture, uv).r;
    
    vec3 DepthSlice = vec3(0.0);
    #define iteration 5
    float smoothing = 0.2 / float(iteration);
    float thickness = 0.6 / float(iteration);
    for(int i=0; i<iteration; i++){
      float fi = float(i) / float(iteration);
      float targeti = fract(fi + target) * pow(distanceTex, 0.005);

      float df1 = smoothstep((targeti - thickness * 0.5) - smoothing, (targeti - thickness * 0.5) + smoothing, 1.0 - distanceTex);
      float df2 = smoothstep((targeti + thickness * 0.5) - smoothing, (targeti + thickness * 0.5) + smoothing, 1.0 - distanceTex);
      float df = df1 - df2;

      DepthSlice += vec3(df);
    }

    vec4 grain = addGrain(uv, time, 0.1);

    float streamLines = addStreamLine(nuv, 3.0, 0.2, 0.25);
    streamLines = clamp(streamLines, 0.7, 1.0);

    float streamLinesThick = addStreamLine(nuvThick, 80.0, 0.15, 0.01);
    streamLinesThick = clamp(streamLinesThick, 0.8, 1.0);

    vec4 stream = vec4(streamLines, streamLines, streamLines, 1.0);
    vec3 RGB = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), DepthSlice.r * pow(distanceTex, 1.5)) * pow(DepthSlice.r, 1.5);
    vec4 RGB4 = vec4(RGB + vec3(0.0, 0.0, 0.0), 1.0) * 1.25;

    float cols = 100.0;
    float ratio = resolution.x / resolution.y;
    vec2 colsrows = vec2(cols, cols / ratio);
    nuv = uv * colsrows;
    vec2 fuv = fract(nuv);
    iuv = floor(nuv);
    vec2 modiuv = step(mod(iuv, 4.0), vec2(0));
    float randDistribution = (modiuv.x * modiuv.y) * step(random(vec3(iuv, floor(mod(time, 1000.0)))), 0.1);

    float rectH = rect(fuv, vec2(1.0, 0.035), 0.0);
    vec4 rectH4 = vec4(vec3(rectH), 1.0);
    float rectV = rect(fuv, vec2(0.035, 1.0), 0.0);
    vec4 rectV4 = vec4(vec3(rectV), 1.0);

    vec4 frect = ((rectH4 + rectV4) * randDistribution) * 0.75;

    vec4 UItexture = texture2D(UIText, uv) * 0.;
    
    gl_FragColor = (UItexture.a * vec4(1.0) + RGB4 + grain + frect) * streamLines * streamLinesThick;
  }
`;

// Utility function to create texture from base64
const createTextureFromBase64 = (base64Data: string): THREE.Texture => {
  const image = new Image();
  image.src = base64Data;
  const texture = new THREE.Texture(image);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat; // Ensure alpha channel support
  image.onload = () => {
    texture.needsUpdate = true;
  };
  return texture;
};

const createTextureWithMetadata = (
  base64Data: string,
  name: string,
  description: string
): TextureData => {
  const texture = createTextureFromBase64(base64Data) as TextureData;
  texture.userData = { name, description };
  return texture;
};

const ShaderEffect: React.FC<ShaderEffectProps> = ({ margin = 50 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<ShaderMaterialType>(null);
  const startTime = useRef(Date.now());
  const lastIndex = useRef(-1);
  const [textures, setTextures] = useState<TextureData[]>([]);

  // Create uniforms ref with scale
  const uniformsRef = useRef({
    time: { value: 0.0 },
    target: { value: 0.5 },
    resolution: { value: new THREE.Vector2() },
    mainTexture: { value: null as THREE.Texture | null },
    UIText: { value: null as THREE.Texture | null },
    scale: { value: 1.25 }
  });

  // Animation loop
  useFrame(() => {
    if (materialRef.current && textures.length > 0) {
      const elapsedSeconds = (Date.now() - startTime.current) / 2500.0;
      const maxTime = 6.0;
      const normTime = (elapsedSeconds % maxTime) / maxTime;
      const index = Math.floor((elapsedSeconds * 0.25) % textures.length);

      // Debug current texture index with name
      if (index !== lastIndex.current) {
        const currentTexture = textures[index];
        console.log(`Switching to texture: ${currentTexture.userData.name}`);
        lastIndex.current = index;
      }

      uniformsRef.current.time.value = elapsedSeconds * 0.5;
      uniformsRef.current.target.value = 1.0 - normTime;
      uniformsRef.current.mainTexture.value = textures[index];

      materialRef.current.needsUpdate = true;
    }
  });

  // Fetch texture data
  useEffect(() => {
    const fetchTextures = async () => {
      try {
        const response = await fetch(
          "https://www.arivaux.com/prototype/codevember2017/DepthUI/texData.js"
        );
        const text = await response.text();

        // Parse the JS file content to extract texture data
        const textureMatches = text.match(/var tex\d+ = "(data:image\/jpeg;base64,[^"]+)"/g);

        // Look for UI texture
        const uiMatch = text.match(/var UI = "(data:image\/[^"]+;base64,[^"]+)"/);

        if (textureMatches) {
          // Extract and create textures with metadata
          const textureData = textureMatches
            .map(match => {
              const nameMatch = match.match(/var (tex\d+)/);
              const base64Match = match.match(/"(data:image\/jpeg;base64,[^"]+)"/);
              if (base64Match && base64Match[1] && nameMatch) {
                const textureName = nameMatch[1];
                // Add descriptions for each texture
                let description = "";
                switch (textureName) {
                  case "tex0":
                    description = "Face depth map - primary texture for face visualization";
                    break;
                  case "tex1":
                    description = "Secondary depth map for transition effects";
                    break;
                  case "tex2":
                    description = "Additional depth map for layering";
                    break;
                  case "tex3":
                    description = "Supplementary depth map for animation";
                    break;
                  case "tex4":
                    description = "Final depth map in the sequence";
                    break;
                  default:
                    description = "Unknown texture type";
                }
                return createTextureWithMetadata(base64Match[1], textureName, description);
              }
              return null;
            })
            .filter((texture): texture is TextureData => texture !== null);

          // Sort textures by their original order
          const sortedTextures = textureData.sort((a, b) => {
            const aNum = parseInt(a.userData.name.replace("tex", ""));
            const bNum = parseInt(b.userData.name.replace("tex", ""));
            return aNum - bNum;
          });

          setTextures(sortedTextures);
        }

        // Create UI texture if found
        if (uiMatch && uiMatch[1]) {
          const uiTexture = createTextureWithMetadata(
            uiMatch[1],
            "UI",
            "Interface overlay texture with transparency"
          );
          uiTexture.format = THREE.RGBAFormat;
          uiTexture.needsUpdate = true;
          uniformsRef.current.UIText.value = uiTexture;
        } else {
          // Fallback to our canvas-generated UI texture
          const canvas = document.createElement("canvas");
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Create a grid pattern
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            const gridSize = 40;
            for (let x = 0; x < canvas.width; x += gridSize) {
              for (let y = 0; y < canvas.height; y += gridSize) {
                if ((x / gridSize + y / gridSize) % 2 === 0) {
                  ctx.fillRect(x, y, gridSize, gridSize);
                }
              }
            }

            // Add some lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 2;
            for (let y = 0; y < canvas.height; y += canvas.height / 10) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
          }

          const texture = new THREE.CanvasTexture(canvas);
          texture.format = THREE.RGBAFormat;
          texture.needsUpdate = true;
          uniformsRef.current.UIText.value = texture;
        }
      } catch (error) {
        console.error("Failed to fetch textures:", error);
      }
    };

    fetchTextures();
  }, []);

  // Update uniforms when textures change
  useEffect(() => {
    if (textures.length > 0) {
      uniformsRef.current.mainTexture.value = textures[0];
      if (materialRef.current) {
        materialRef.current.needsUpdate = true;
      }
    }
  }, [textures]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current) {
        const mainHeight = window.innerHeight - margin * 6.0;
        const resPoster = window.innerWidth / window.innerHeight;
        const mainWidth = mainHeight * resPoster;

        // Update resolution with proper aspect ratio
        uniformsRef.current.resolution.value.set(mainWidth, mainHeight);
        materialRef.current.needsUpdate = true;
      }
    };

    handleResize(); // Call immediately
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [margin]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniformsRef.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

// Add UI shader
const uiVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// UI Overlay component
const UIOverlay = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTime = useRef(Date.now());
  const textureRef = useRef<THREE.Texture | null>(null);

  // Create text texture
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "white";
      ctx.textBaseline = "top";

      // Draw left text (repeated)
      ctx.textAlign = "left";
      const phrase = "AN EXPERIMENTAL PRACTICE ";
      const repeatedPhrase = phrase.repeat(1);
      ctx.fillText(repeatedPhrase, 50, canvas.height / 2);

      const phrase2 = "VOLUME 1";
      const repeatedPhrase2 = phrase2.repeat(1);
      ctx.fillText(repeatedPhrase2, canvas.width / 2 + 500, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      textureRef.current = texture;
    }
  }, []);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      textTexture: { value: null as THREE.Texture | null }
    }),
    []
  );

  // Update texture when it's created
  useEffect(() => {
    if (textureRef.current) {
      uniforms.textTexture.value = textureRef.current;
    }
  }, [uniforms]);

  useFrame(() => {
    if (materialRef.current) {
      const elapsedSeconds = (Date.now() - startTime.current) / 1000.0;
      materialRef.current.uniforms.time.value = elapsedSeconds;
    }
  });

  const fragmentShader = `
    varying vec2 vUv;
    uniform float time;
    uniform sampler2D textTexture;

    vec2 lensDistort(vec2 uv, float power, float radInc) {
      float theta  = atan(uv.y, uv.x);
      float radius = length(uv);
      radius = pow(radius, power) * radInc;
      uv.x = radius * cos(theta);
      uv.y = radius * sin(theta);
      return 0.5 * (uv + 1.0);
    }
    
    void main() {
      vec2 uv = vUv;
      uv = lensDistort(uv.xy * 2.0 - 1.0, 1.0, 1.1);
      
      // Scroll UV for left text
      vec2 leftUV = uv;
      leftUV.y = fract(leftUV.y - time * 0.05 + 1.0);
      
      // Sample texture
      vec4 textColor = texture2D(textTexture, vec2(leftUV.x, uv.y));
      
      // Add scan lines
      float scanline = step(0.4, fract(uv.y * 100.0 + time));
      
      // Fade based on time
      // float fade = sin(time * 0.5) * 0.5 + 0.5;
      
      // Final color
      gl_FragColor = vec4(vec3(1.0), textColor.r * 1.0 * scanline * 0.75);
    }
  `;

  return (
    <mesh renderOrder={1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={uiVertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export const Canvas = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ padding: "25px" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "calc(100vh * 1.777778)", // 16:9 aspect ratio
          position: "relative"
        }}
      >
        <DefaultCanvas
          camera={{ position: [0, 0, 1], fov: 45 }}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        >
          <ShaderEffect />
          <UIOverlay />
        </DefaultCanvas>
      </div>
    </div>
  );
};
