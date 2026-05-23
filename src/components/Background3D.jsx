import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox, ContactShadows, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// 60% Keyboard Layout approximations (width multipliers)
const layout = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]
];

// Mac Keyboard exact labels mapped to the layout
const macLabels = [
  ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'del'],
  ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'return'],
  ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
  ['ctrl', 'opt', 'cmd', '<ajinkya>', 'cmd', 'opt', 'fn', 'ctrl']
];

// Global set to track active keystrokes
const activeKeys = new Set();

// Global scroll state to avoid React renders
const scrollState = { progress: 0 };

const KeyCap = ({ position, width, rowIdx, colIdx, theme }) => {
  const meshRef = useRef(null);
  const tetherRef = useRef(null);
  
  const isTargetKey = rowIdx === 2 && colIdx === 12; // return
  const isEsc = rowIdx === 0 && colIdx === 0; // esc
  const isAccent = isTargetKey || isEsc;

  const label = macLabels[rowIdx]?.[colIdx] || '';

  const matRef = useRef(null);
  const textRef = useRef(null);
  const isHovered = useRef(false);
  const hoverLiftRef = useRef(0);

  const windLines = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      xOff: (Math.random() - 0.5) * 1.8,
      zOff: (Math.random() - 0.5) * 0.8,
      speed: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      thickness: 0.01 + Math.random() * 0.02
    }));
  }, []);

  const mappedKey = useMemo(() => {
    const l = label.toLowerCase();
    if (l === 'ajinkya') return ' ';
    if (l === 'del') return 'backspace';
    if (l === 'return') return 'enter';
    if (l === 'cmd') return 'meta';
    if (l === 'opt') return 'alt';
    if (l === 'ctrl') return 'control';
    return l;
  }, [label]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Pluck animation from 0 to 1 progress (Hero to Experience)
    const animProgress = Math.min(Math.max(scrollState.progress, 0), 1);
    const ease = 1 - Math.pow(1 - animProgress, 3);
    
    if (isTargetKey) {
      // Float up and down based on time
      const floatY = Math.sin(state.clock.elapsedTime * 2) * 0.15;
      
      const liftY = ease * 3; // Lift by 3 units vertically
      meshRef.current.position.y = position[1] + liftY + floatY;
      
      // Wind lines logic
      if (tetherRef.current) {
        const height = meshRef.current.position.y - position[1];
        if (height > 0.1) {
          tetherRef.current.visible = true;
          tetherRef.current.position.x = position[0];
          tetherRef.current.position.z = position[2];
          
          tetherRef.current.children.forEach((child, i) => {
            const line = windLines[i];
            const t = (state.clock.elapsedTime * line.speed + line.phase) % 1; // 0 to 1 loop
            
            const lineScaleY = height * 0.3 * (line.thickness * 50); 
            child.scale.y = lineScaleY;
            
            child.position.y = position[1] + (t * height);
            
            const fade = Math.sin(t * Math.PI); // Fade in middle
            child.material.opacity = ease * fade * 0.8;
          });
        } else {
          tetherRef.current.visible = false;
        }
      }
    } else {
      const isKeyPressed = activeKeys.has(mappedKey);
      const isActive = isHovered.current || isKeyPressed;

      // Hover Lift Logic
      hoverLiftRef.current = THREE.MathUtils.lerp(
        hoverLiftRef.current, 
        isActive ? 0.4 : 0, 
        0.15
      );
      
      // General wave animation for all non-target keys
      const waveOffset = Math.sin(state.clock.elapsedTime * 1.5 + position[0] * 0.5) * 0.05;
      meshRef.current.position.y = position[1] + waveOffset + hoverLiftRef.current;
    }
    
    const isKeyPressed = activeKeys.has(mappedKey);
    const isActive = isHovered.current || isKeyPressed;

    // RGB Breathing Effect for ALL keys
    if (textRef.current && matRef.current) {
      if (isActive) {
        textRef.current.color = new THREE.Color('#ffffff');
        matRef.current.emissive = new THREE.Color('#333333');
        matRef.current.emissiveIntensity = 1;
      } else if (!isAccent) {
        const hue = (state.clock.elapsedTime * 0.4 + position[0] * 0.05) % 1;
        textRef.current.color = new THREE.Color().setHSL(hue, 1, theme === 'light' ? 0.4 : 0.6);
        matRef.current.emissive = new THREE.Color(theme === 'light' ? '#ffffff' : '#000000');
        matRef.current.emissiveIntensity = 0;
      } else {
        textRef.current.color = new THREE.Color('#ffffff'); // White text on red keys
        matRef.current.emissive = new THREE.Color('#E50914');
        matRef.current.emissiveIntensity = 0.4;
      }
    }
  });

  return (
    <group>
      <group 
        ref={meshRef} 
        position={position}
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          isHovered.current = true; 
          document.body.style.cursor = 'pointer'; 
          if (navigator.vibrate) navigator.vibrate(15);
        }}
        onPointerOut={() => { isHovered.current = false; document.body.style.cursor = 'auto'; }}
      >
        <RoundedBox 
          args={[width - 0.1, 0.4, 0.9]} 
          radius={0.02} // Brutalist sharp edges
          smoothness={2}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial 
            ref={matRef}
            color={isAccent ? '#E50914' : (theme === 'light' ? '#e5e5e5' : '#000000')} 
            roughness={1} 
            metalness={0} 
            emissive={isAccent ? '#E50914' : (theme === 'light' ? '#ffffff' : '#000000')}
            emissiveIntensity={isAccent ? 0.4 : 0}
          />
        </RoundedBox>
        
        <Text
          ref={textRef}
          position={width > 2 ? [0, 0.201, 0] : [-(width - 0.1)/2 + 0.15, 0.201, -0.2]} // Center spacebar, others top-left
          rotation={[-Math.PI / 2, 0, 0]} // Face upwards
          fontSize={0.2}
          anchorX={width > 2 ? "center" : "left"}
          anchorY="middle"
        >
          {label}
        </Text>
      </group>
      
      {isTargetKey && (
        <group ref={tetherRef} visible={false}>
          {windLines.map((line, i) => (
            <mesh key={i} position={[line.xOff, 0, line.zOff]}>
              <cylinderGeometry args={[line.thickness, line.thickness, 1, 8]} />
              <meshBasicMaterial color="#E50914" transparent opacity={0} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

const KeyboardScene = ({ theme }) => {
  const groupRef = useRef();

  const keys = useMemo(() => {
    const keyData = [];
    const keySize = 1;
    let zOffset = -2;

    layout.forEach((row, rIdx) => {
      let xOffset = -7;
      row.forEach((widthMultiplier, cIdx) => {
        const actualWidth = widthMultiplier * keySize;
        const xPos = xOffset + actualWidth / 2;
        
        keyData.push({
          id: `${rIdx}-${cIdx}`,
          position: [xPos, 0, zOffset],
          width: actualWidth,
          rowIdx: rIdx,
          colIdx: cIdx
        });
        
        xOffset += actualWidth;
      });
      zOffset += keySize;
    });
    
    return keyData;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const isMobile = window.innerWidth < 768;
    const p = scrollState.progress;
    
    // Slow down the scroll progress on mobile because the page is much longer vertically
    const effectiveP = isMobile ? p * 0.6 : p;

    // Phase 1: 0 to 1 (Hero to Experience)
    const phase1Progress = Math.min(Math.max(effectiveP, 0), 1);
    const ease1 = 1 - Math.pow(1 - phase1Progress, 3);
    
    // Initial home page angle: upright. Transitions to side profile.
    const rotX = THREE.MathUtils.lerp(Math.PI / 2, 0, ease1); 
    const rotY = THREE.MathUtils.lerp(0, -Math.PI / 2, ease1);
    const rotZ = THREE.MathUtils.lerp(0, 0, ease1); 
    
    // Anchor point: center on home page, move to the left on the second page
    const posX = THREE.MathUtils.lerp(0, isMobile ? -3 : -6, ease1); 
    
    // Zoom in heavily on home page so it looks big (-4), zoom out on internship (-12)
    // On mobile, start much further away (-10) so it fits in the narrow screen
    const posZ = THREE.MathUtils.lerp(isMobile ? -11 : -4, isMobile ? -18 : -12, ease1); 
    
    // Phase 2: > 1.2 (Scroll away completely before About section)
    const phase3Start = isMobile ? 0.6 : 1.2;
    const phase3Progress = Math.max(0, effectiveP - phase3Start);
    const scrollOffsetY = phase3Progress * 20; 
    
    const baseY = -1;
    
    groupRef.current.rotation.x = rotX;
    groupRef.current.rotation.y = rotY;
    groupRef.current.rotation.z = rotZ;
    groupRef.current.position.x = posX;
    groupRef.current.position.z = posZ;
    groupRef.current.position.y = baseY + scrollOffsetY + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
  });

  return (
    <group ref={groupRef} position={[0, -1, -3]}>
      {/* The Base */}
      <RoundedBox args={[16, 0.8, 6]} radius={0.05} smoothness={4} position={[0.5, -0.4, 0]}>
        <meshStandardMaterial color={theme === 'light' ? '#d4d4d4' : '#000000'} roughness={1} metalness={0} />
      </RoundedBox>
      
      {/* The Keys */}
      <group>
        {keys.map(key => (
          <KeyCap key={key.id} {...key} theme={theme} />
        ))}
      </group>
      
      {/* Red Underglow */}
      <rectAreaLight 
        width={16} 
        height={6} 
        color="#E50914" 
        intensity={2} 
        position={[0.5, -0.6, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
      />
    </group>
  );
};

const Background3D = () => {
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      scrollState.progress = window.scrollY / window.innerHeight;
    };
    
    const handleKeyDown = (e) => {
      activeKeys.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e) => {
      activeKeys.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (location.pathname !== '/') return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'auto' }}>
      <Canvas gl={{ alpha: true }} eventSource={document.body} eventPrefix="client">
        <ambientLight intensity={0.1} /> 
        
        {/* Soft fill light from the front */}
        <directionalLight position={[0, 10, 5]} intensity={0.4} color="#ffffff" />
        
        {/* Strong Cinematic Backlight placed right behind the top edge of the keyboard */}
        <pointLight position={[0, 8, -12]} intensity={theme === 'light' ? 50 : 200} color="#ffffff" distance={50} castShadow />
        
        <Suspense fallback={null}>
          <KeyboardScene theme={theme} />
          <ContactShadows position={[0, -2, -3]} opacity={theme === 'light' ? 0.2 : 0.6} scale={30} blur={2.5} far={10} color="#000000" />
          <Environment preset={theme === 'light' ? "city" : "studio"} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Background3D;
