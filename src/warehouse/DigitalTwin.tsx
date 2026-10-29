import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Html, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { WarehouseContainer } from './types';

const COLUMN_GAP = 2.62;
const LEVEL_HEIGHTS = [1.28, 3.08, 4.88];
const CONTAINER_SIZE: [number, number, number] = [2.28, 1.08, 1.34];
const CONTAINER_INNER_SIZE: [number, number, number] = [2.05, 0.96, 1.1];
const BOX_SLOTS = 200;
const BOX_GRID = { x: 5, z: 4, y: 10 };

function SmoothCamera({ distance, viewKey, controlsRef }: { distance: number; viewKey: string; controlsRef: RefObject<any> }) {
  const { camera, invalidate } = useThree();
  const destination = useRef(new THREE.Vector3(0.6, 7.2, distance));
  const previousKey = useRef(viewKey);
  const transitioning = useRef(false);
  useLayoutEffect(() => {
    if (previousKey.current !== viewKey) {
      destination.current.set(0.6, distance > 20 ? 8.2 : 7.2, distance);
      previousKey.current = viewKey;
      transitioning.current = true;
    }
  }, [distance, viewKey]);
  useFrame((_, delta) => {
    if (!transitioning.current) return;
    invalidate();
    camera.position.lerp(destination.current, 1 - Math.exp(-3.4 * delta));
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(0, 2.75, 0), 1 - Math.exp(-3.4 * delta));
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(destination.current) < 0.025) transitioning.current = false;
  });
  return null;
}

function occupancyTone(container: WarehouseContainer) {
  if (container.currentStock === 0) return '#65737b';
  if (container.status === 'CRITICAL' || container.occupancyPercentage >= 90) return '#c75542';
  if (container.status === 'NEAR_CAPACITY' || container.occupancyPercentage >= 78) return '#ffb500';
  if (container.status === 'LOW' || container.occupancyPercentage <= 30) return '#4e9873';
  return '#0a9a88';
}

function Beam({ position, size, color = '#66747b', emissive = '#000000' }: { position: [number, number, number]; size: [number, number, number]; color?: string; emissive?: string }) {
  return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} metalness={0.8} roughness={0.35} emissive={emissive} /></mesh>;
}

function Bolt({ position, color = '#aebbc0' }: { position: [number, number, number]; color?: string }) {
  return <mesh position={position} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.046, 0.046, 0.045, 8]} /><meshStandardMaterial color={color} metalness={0.78} roughness={0.32} /></mesh>;
}

function SafetyFootplate({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 0.09, 0]}><boxGeometry args={[0.34, 0.18, 0.48]} /><meshStandardMaterial color="#d9a739" metalness={0.55} roughness={0.38} /></mesh>
    <Beam position={[0, 0.194, 0]} size={[0.22, 0.015, 0.32]} color="#292f32" />
    {[-0.11, 0.11].map((x) => <Bolt key={x} position={[x, 0.17, 0.2]} color="#27343a" />)}
  </group>;
}

const RackStructure = memo(function RackStructure({ aisle, aisleIndex, aisleCount }: { aisle: string; aisleIndex: number; aisleCount: number }) {
  const aisleSpacing = 3.45;
  const aisleZ = (aisleIndex - (aisleCount - 1) / 2) * aisleSpacing;
  const boundaryXs = Array.from({ length: 6 }, (_, index) => (index - 2.5) * COLUMN_GAP);
  const railYs = [0.57, 2.37, 4.17, 5.97];
  return <group position={[0, 0, aisleZ]}>
    {boundaryXs.flatMap((x) => [-0.88, 0.88].map((z) => <group key={`upright-${x}-${z}`}>
      <Beam position={[x, 3.25, z]} size={[0.14, 6.5, 0.16]} color="#48565c" />
      <SafetyFootplate position={[x, 0, z]} />
      {[0.92, 2.72, 4.52].map((y) => <Beam key={y} position={[x, y, z]} size={[0.19, 0.09, 0.18]} color="#77848a" />)}
      {railYs.slice(0, 3).map((y) => <Bolt key={y} position={[x, y + 0.13, z + 0.105]} />)}
    </group>))}
    {railYs.map((y) => <group key={`shelf-level-${y}`}>
      <Beam position={[0, y, -0.88]} size={[COLUMN_GAP * 5, 0.16, 0.16]} color="#68777e" />
      <Beam position={[0, y, 0.88]} size={[COLUMN_GAP * 5, 0.16, 0.16]} color="#69787f" />
      {boundaryXs.map((x) => <Bolt key={x} position={[x, y + 0.105, 1.005]} />)}
      {Array.from({ length: 5 }, (_, index) => <Beam key={index} position={[(index - 2) * COLUMN_GAP, y + 0.01, 0]} size={[0.07, 0.075, 1.72]} color="#526168" />)}
    </group>)}
    {boundaryXs.map((x) => <group key={`brace-${x}`}>
      <Beam position={[x, 1.52, 0]} size={[0.055, 1.86, 0.055]} color="#536168" />
      <mesh position={[x, 1.52, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.065, 2.5, 0.065]} /><meshStandardMaterial color="#39464c" metalness={0.76} roughness={0.42} /></mesh>
      <mesh position={[x, 3.78, 0]} rotation={[0, 0, -Math.PI / 4]}><boxGeometry args={[0.065, 2.5, 0.065]} /><meshStandardMaterial color="#39464c" metalness={0.76} roughness={0.42} /></mesh>
    </group>)}
    {Array.from({ length: 5 }, (_, index) => {
      const x = (index - 2) * COLUMN_GAP;
      const column = `${aisle}-${String(index + 1).padStart(2, '0')}`;
      return <group key={column}>
        <Text position={[x, 6.64, 0.89]} fontSize={0.24} color="#c4d1d5" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#10191e">{column}</Text>
        <mesh position={[x, 6.34, 0.9]}><boxGeometry args={[0.6, 0.04, 0.04]} /><meshBasicMaterial color="#e0b347" /></mesh>
      </group>;
    })}
    {[-6.9, 6.9].map((x) => <Beam key={x} position={[x, 6.64, 0]} size={[0.14, 0.1, 2.18]} color="#4d5b61" />)}
  </group>;
});

const CapacityFill = memo(function CapacityFill({ container }: { container: WarehouseContainer }) {
  const tone = occupancyTone(container);
  const fillRatio = Math.min(1, Math.max(0, container.currentStock / container.maxCapacity));
  const fillHeight = CONTAINER_INNER_SIZE[1] * fillRatio;
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: tone,
    roughness: 0.38,
    metalness: 0.08,
    transparent: true,
    opacity: 0.76,
    emissive: tone,
    emissiveIntensity: 0.16,
    depthWrite: false,
  }), [tone]);

  if (fillHeight <= 0) return null;
  return <mesh position={[0, -CONTAINER_INNER_SIZE[1] / 2 + fillHeight / 2, 0]} material={material}>
    <boxGeometry args={[CONTAINER_INNER_SIZE[0], fillHeight, CONTAINER_INNER_SIZE[2]]} />
  </mesh>;
});

const ProductBoxes = memo(function ProductBoxes({ container }: { container: WarehouseContainer }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tone = occupancyTone(container);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.35, 0.09, 0.265), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: tone, roughness: 0.31, metalness: 0.16, emissive: tone, emissiveIntensity: 0.11 }), [tone]);
  const boxCount = Math.min(BOX_SLOTS, Math.round((container.currentStock / container.maxCapacity) * BOX_SLOTS));

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const transform = new THREE.Object3D();
    let slot = 0;
    for (let y = 0; y < BOX_GRID.y && slot < boxCount; y++) {
      for (let z = 0; z < BOX_GRID.z && slot < boxCount; z++) {
        for (let x = 0; x < BOX_GRID.x && slot < boxCount; x++) {
          transform.position.set(-0.78 + x * 0.39, -0.465 + y * 0.096, -0.42 + z * 0.28);
          transform.rotation.set(0, 0, 0);
          transform.updateMatrix();
          mesh.setMatrixAt(slot++, transform.matrix);
        }
      }
    }
    mesh.count = boxCount;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [boxCount]);

  return <instancedMesh ref={meshRef} args={[geometry, material, BOX_SLOTS]} frustumCulled={false} />;
});

function ContainerFrame({ active }: { active: boolean }) {
  const tone = active ? '#ffb500' : '#4f6067';
  const emissive = active ? '#493000' : '#000000';
  const [width, height, depth] = CONTAINER_SIZE;
  return <group>
    {[-1, 1].flatMap((xSide) => [-1, 1].map((zSide) => <Beam key={`${xSide}-${zSide}`} position={[xSide * (width / 2 - 0.05), 0, zSide * (depth / 2 - 0.055)]} size={[0.075, height + 0.12, 0.075]} color={tone} emissive={emissive} />))}
    {[-1, 1].flatMap((ySide) => [-1, 1].map((zSide) => <Beam key={`cross-${ySide}-${zSide}`} position={[0, ySide * (height / 2), zSide * (depth / 2 - 0.055)]} size={[width, 0.075, 0.075]} color={tone} emissive={emissive} />))}
    {[-1, 1].flatMap((ySide) => [-1, 1].map((xSide) => <Beam key={`depth-${ySide}-${xSide}`} position={[xSide * (width / 2 - 0.05), ySide * (height / 2), 0]} size={[0.075, 0.075, depth]} color={tone} emissive={emissive} />))}
    {[-1, 1].flatMap((xSide) => [-1, 1].map((zSide) => <Bolt key={`bolt-${xSide}-${zSide}`} position={[xSide * (width / 2 - 0.05), height / 2 - 0.12, zSide * (depth / 2 + 0.01)]} color={active ? '#62d8e8' : '#a8b4b8'} />))}
  </group>;
}

interface ContainerObjectProps {
  container: WarehouseContainer;
  selected: boolean;
  hovered: boolean;
  onSelect: (shelfId: string) => void;
  onHover: (shelfId: string | null) => void;
}

const StorageContainer = memo(function StorageContainer({ container, selected, hovered, aisleIndex, aisleCount, onSelect, onHover }: ContainerObjectProps & { aisleIndex: number; aisleCount: number }) {
  const colIndex = Number(container.columnCode.slice(-2)) - 1;
  const aisleSpacing = 3.45;
  const aisleZ = (aisleIndex - (aisleCount - 1) / 2) * aisleSpacing;
  const positionY = LEVEL_HEIGHTS[container.level - 1] ?? LEVEL_HEIGHTS[0];
  const x = (colIndex - 2) * COLUMN_GAP;
  const color = occupancyTone(container);
  const active = selected || hovered;
  return <group position={[x, positionY, aisleZ]} onPointerOver={(event) => { event.stopPropagation(); onHover(container.shelfId); }} onPointerOut={(event) => { event.stopPropagation(); onHover(null); }} onClick={(event) => { event.stopPropagation(); onSelect(container.shelfId); }}>
    <ContainerFrame active={active} />
    <mesh>
      <boxGeometry args={CONTAINER_SIZE} />
    <meshStandardMaterial color="#e7c49e" transparent opacity={0.12} roughness={0.24} metalness={0.04} depthWrite={false} side={THREE.DoubleSide} />
      <Edges color={selected ? '#ffb500' : hovered ? '#ffe1a0' : '#b9a28a'} threshold={18} />
    </mesh>
    <CapacityFill container={container} />
    <ProductBoxes container={container} />
    {(selected || hovered) && <mesh scale={[1.025, 1.035, 1.04]}>
      <boxGeometry args={CONTAINER_SIZE} />
      <meshBasicMaterial color="#ffb500" wireframe transparent opacity={selected ? 0.9 : 0.45} depthTest={false} />
    </mesh>}
    <Html position={[0, 0.69, 0.7]} center distanceFactor={8} zIndexRange={[30, 0]}>
      <div className={`shelf-tag ${selected ? 'is-selected' : ''}`} style={{ '--tag-color': color } as CSSProperties}>
        <span>{container.columnCode}-L{container.level}</span><b>{Math.round(container.occupancyPercentage)}%</b>
      </div>
    </Html>
    {container.currentStock === 0 && <Html position={[0, 0, 0.7]} center distanceFactor={8} zIndexRange={[20, 0]}><span className="empty-tag">EMPTY</span></Html>}
    {hovered && <Html position={[0, 0.79, 0.72]} center distanceFactor={7.5} zIndexRange={[50, 0]}>
      <div className="scene-tooltip">
        <strong>{container.columnCode}-L{container.level}</strong><span>{container.product.name}</span>
        <small>{container.currentStock} / {container.maxCapacity} units · {container.occupancyPercentage.toFixed(0)}% occupied</small>
      </div>
    </Html>}
  </group>;
});

function WarehouseEnvironment({ centerZ, aisleCount }: { centerZ: number; aisleCount: number }) {
  const floorDepth = Math.max(40, aisleCount * 7.5);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
      <planeGeometry args={[60, floorDepth]} /><meshStandardMaterial color="#c7bbae" roughness={0.78} metalness={0.04} />
    </mesh>
    <gridHelper args={[floorDepth, Math.max(80, aisleCount * 24), '#a99d8f', '#b7aa9c']} position={[0, -0.065, 0]}>
      <lineBasicMaterial attach="material" color="#9f9386" transparent opacity={0.18} />
    </gridHelper>
    {[-7.35, 7.35].map((x) => <group key={`floor-mark-${x}`}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.049, 0]}>
        <planeGeometry args={[0.1, 16.4]} /><meshBasicMaterial color="#d7a943" transparent opacity={0.83} />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x + Math.sign(x) * 0.17, -0.048, -7.4 + index * 2.95]}>
        <planeGeometry args={[0.16, 0.78]} /><meshBasicMaterial color="#d7a943" transparent opacity={0.68} />
      </mesh>)}
    </group>)}
    {[-5.4, 0, 5.4].map((x) => <mesh key={`nav-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.045, 0]}>
      <planeGeometry args={[0.04, 14.8]} /><meshBasicMaterial color="#ffb500" transparent opacity={0.24} />
    </mesh>)}
  </group>;
}

interface DigitalTwinProps {
  containers: WarehouseContainer[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (shelfId: string) => void;
  onHover: (shelfId: string | null) => void;
  activeAisle?: string;
}

export default function DigitalTwin({ containers, selectedId, hoveredId, onSelect, onHover, activeAisle = 'ALL' }: DigitalTwinProps) {
  const controlsRef = useRef<any>(null);
  const aisleCodes = [...new Set(containers.map((container) => container.columnCode.split('-')[0]))].sort();
  const visibleAisles = activeAisle === 'ALL' ? aisleCodes : aisleCodes.filter((aisle) => aisle === activeAisle);
  const visibleContainers = containers.filter((container) => visibleAisles.includes(container.columnCode.split('-')[0]));
  const aisleCount = Math.max(visibleAisles.length, 1);
  const centerZ = 0;
  const cameraDistance = Math.max(18.4, 18.4 + (aisleCount - 1) * 2.5);
  return <Canvas frameloop="demand" dpr={[1, 1.25]} camera={{ position: [0.6, 7.2 + (aisleCount > 3 ? 1 : 0), centerZ + cameraDistance], fov: 38, near: 0.1, far: Math.max(90, cameraDistance * 4) }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1; }}>
    <color attach="background" args={['#dfd6ca']} />
    <fog attach="fog" args={['#dfd6ca', 28, 58]} />
    <ambientLight intensity={0.82} color="#f1dfc8" />
    <hemisphereLight args={['#f3e6d5', '#29211d', 1.4]} />
    <spotLight position={[-7, 13, 9]} angle={0.65} penumbra={0.7} intensity={1500} color="#fff1dd" />
    <spotLight position={[7, 10, -3]} angle={0.62} penumbra={0.8} intensity={900} color="#dfb77a" />
    <pointLight position={[0, 4.5, 7]} intensity={26} distance={20} color="#ffb500" />
    <SmoothCamera distance={cameraDistance} viewKey={`${activeAisle}-${aisleCount}`} controlsRef={controlsRef} />
    <WarehouseEnvironment centerZ={centerZ} aisleCount={aisleCount} />
    {visibleAisles.map((aisle, index) => <RackStructure key={aisle} aisle={aisle} aisleIndex={index} aisleCount={aisleCount} />)}
    {visibleContainers.map((container) => <StorageContainer key={container.shelfId} container={container} aisleIndex={visibleAisles.indexOf(container.columnCode.split('-')[0])} aisleCount={aisleCount} selected={selectedId === container.shelfId} hovered={hoveredId === container.shelfId} onSelect={onSelect} onHover={onHover} />)}
    <OrbitControls ref={controlsRef} makeDefault target={[0, 2.75, centerZ]} enableDamping dampingFactor={0.12} rotateSpeed={0.62} zoomSpeed={0.8} panSpeed={0.62} minDistance={9} maxDistance={Math.max(31, cameraDistance + 14)} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.02} screenSpacePanning />
  </Canvas>;
}
