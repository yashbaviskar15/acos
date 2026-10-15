import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Radio, Zap, Activity, Globe2, Eye, RefreshCw, Cpu } from 'lucide-react';

interface SovereignNode {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  latency: string;
  tier: string;
  status: string;
  activeWorkloads: string;
  color: string;
}

const SOVEREIGN_NODES: SovereignNode[] = [
  {
    id: 'mumbai',
    name: 'Mumbai Sovereign Hub',
    code: 'ap-south-1',
    lat: 19.076,
    lon: 72.877,
    latency: '7.8ms',
    tier: 'Tier-IV Core',
    status: 'Operational',
    activeWorkloads: 'Compute, K8s, S3 NVMe',
    color: '#C6923B',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru Tech Hub',
    code: 'ap-south-2',
    lat: 12.971,
    lon: 77.594,
    latency: '11.2ms',
    tier: 'Tier-III+ Edge',
    status: 'Operational',
    activeWorkloads: 'Compute, DB Clusters',
    color: '#D4A347',
  },
  {
    id: 'delhi',
    name: 'Delhi-NCR Capital Core',
    code: 'ap-north-1',
    lat: 28.704,
    lon: 77.102,
    latency: '13.6ms',
    tier: 'Tier-IV Core',
    status: 'Operational',
    activeWorkloads: 'Govt Enterprise, Cold S3',
    color: '#10B981',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad Cyber Hub',
    code: 'ap-south-3',
    lat: 17.385,
    lon: 78.486,
    latency: '10.4ms',
    tier: 'Tier-III+ Edge',
    status: 'Operational',
    activeWorkloads: 'High-Density Compute',
    color: '#0EA5E9',
  },
  {
    id: 'chennai',
    name: 'Chennai Coastal Gateway',
    code: 'ap-south-4',
    lat: 13.082,
    lon: 80.270,
    latency: '12.1ms',
    tier: 'Tier-IV Subsea Landing',
    status: 'Operational',
    activeWorkloads: 'Cross-Connect, Transit',
    color: '#F59E0B',
  },
  {
    id: 'pune',
    name: 'Pune Industrial DC',
    code: 'ap-west-1',
    lat: 18.520,
    lon: 73.856,
    latency: '9.2ms',
    tier: 'Tier-III Enterprise',
    status: 'Operational',
    activeWorkloads: 'FinTech Failover, Redis',
    color: '#C6923B',
  },
];

// Node-to-node dark fiber mesh connections
const MESH_LINKS: [string, string][] = [
  ['mumbai', 'pune'],
  ['mumbai', 'bengaluru'],
  ['mumbai', 'delhi'],
  ['bengaluru', 'hyderabad'],
  ['bengaluru', 'chennai'],
  ['delhi', 'hyderabad'],
  ['hyderabad', 'chennai'],
  ['pune', 'hyderabad'],
];

interface Sovereign3DCanvasProps {
  className?: string;
  onSelectNode?: (node: SovereignNode) => void;
  selectedNodeId?: string;
}

export const Sovereign3DCanvas: React.FC<Sovereign3DCanvasProps> = ({
  className = '',
  onSelectNode,
  selectedNodeId = 'mumbai',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction State
  const [activeNode, setActiveNode] = useState<SovereignNode>(
    SOVEREIGN_NODES.find((n) => n.id === selectedNodeId) || SOVEREIGN_NODES[0]
  );
  const [hoveredNode, setHoveredNode] = useState<SovereignNode | null>(null);
  const [activeMode, setActiveMode] = useState<'mesh' | 'latency' | 'vpc' | 'fabric'>('mesh');
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Rotation & Physics state (stored in ref for 60fps rendering without React re-renders)
  const rotationRef = useRef({
    rotX: -0.22,
    rotY: 0,
    targetRotX: -0.22,
    targetRotY: 0,
    velX: 0,
    velY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    time: 0,
  });

  const projectedNodesRef = useRef<{ node: SovereignNode; x: number; y: number; z: number; visible: boolean }[]>([]);

  // Update activeNode when prop changes
  useEffect(() => {
    const node = SOVEREIGN_NODES.find((n) => n.id === selectedNodeId);
    if (node) setActiveNode(node);
  }, [selectedNodeId]);

  // Handle Drag / Rotate
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    rotationRef.current.lastMouseX = e.clientX;
    rotationRef.current.lastMouseY = e.clientY;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDragging) {
        const deltaX = e.clientX - rotationRef.current.lastMouseX;
        const deltaY = e.clientY - rotationRef.current.lastMouseY;
        rotationRef.current.targetRotY += deltaX * 0.008;
        rotationRef.current.targetRotX = Math.max(-0.8, Math.min(0.8, rotationRef.current.targetRotX + deltaY * 0.008));
        rotationRef.current.lastMouseX = e.clientX;
        rotationRef.current.lastMouseY = e.clientY;
      } else {
        // Hit test projected nodes
        let found: SovereignNode | null = null;
        for (const p of projectedNodesRef.current) {
          if (p.visible) {
            const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
            if (dist < 18) {
              found = p.node;
              break;
            }
          }
        }
        setHoveredNode(found);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      setActiveNode(hoveredNode);
      onSelectNode?.(hoveredNode);
    }
  }, [hoveredNode, onSelectNode]);

  // Main 3D Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Handle high-dpi sizing
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width > 20 ? rect.width : (parent?.clientWidth && parent.clientWidth > 20 ? parent.clientWidth : 460);
      const h = rect.height > 20 ? rect.height : (parent?.clientHeight && parent.clientHeight > 20 ? parent.clientHeight : 280);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Scroll listener for 3D tilt
    const handleScroll = () => {
      const scrollY = window.scrollY;
      rotationRef.current.targetRotY += scrollY * 0.00003;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Generate wireframe sphere vertices
    const sphereRadius = 105;
    const fov = 300;
    const cameraZ = 340;

    // Convert lat/lon to 3D sphere coordinate
    const latLonTo3D = (lat: number, lon: number, r: number) => {
      // Center on Indian subcontinent (~21N, 78E)
      const phi = (lat * Math.PI) / 180;
      const theta = ((lon - 78) * Math.PI) / 180;
      const x = r * Math.cos(phi) * Math.sin(theta);
      const y = -r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.cos(theta);
      return { x, y, z };
    };

    // Precompute lat/lon wireframe rings
    const wireframeRings: { x: number; y: number; z: number }[][] = [];
    // Latitude rings
    [-60, -30, 0, 30, 60].forEach((lat) => {
      const ring: { x: number; y: number; z: number }[] = [];
      for (let lon = -180; lon <= 180; lon += 12) {
        ring.push(latLonTo3D(lat, lon + 78, sphereRadius));
      }
      wireframeRings.push(ring);
    });
    // Longitude lines
    for (let lon = -180; lon < 180; lon += 30) {
      const ring: { x: number; y: number; z: number }[] = [];
      for (let lat = -80; lat <= 80; lat += 10) {
        ring.push(latLonTo3D(lat, lon + 78, sphereRadius));
      }
      wireframeRings.push(ring);
    }

    // Floating orbital cloud particles
    const particleCount = 48;
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 160 + (i % 5) * 8;
      const tilt = (i % 2 === 0 ? 1 : -1) * 0.42;
      return {
        baseAngle: angle,
        radius,
        tilt,
        speed: 0.008 + (i % 3) * 0.004,
        size: 1.2 + (i % 3) * 0.8,
      };
    });

    // ── ANIMATION FRAME ──
    const render = () => {
      const state = rotationRef.current;
      state.time += 0.016;

      // Auto rotation when idle
      if (autoRotate && !isDragging) {
        state.targetRotY += 0.0025;
      }

      // Smooth inertia
      state.rotX += (state.targetRotX - state.rotX) * 0.08;
      state.rotY += (state.targetRotY - state.rotY) * 0.08;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const cx = width / 2;
      const cy = height / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 3D Rotation Transform Helper
      const cosX = Math.cos(state.rotX);
      const sinX = Math.sin(state.rotX);
      const cosY = Math.cos(state.rotY);
      const sinY = Math.sin(state.rotY);

      const project = (p: { x: number; y: number; z: number }) => {
        // Rotate Y
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective
        const scale = fov / (cameraZ + z2);
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          scale,
          visible: z2 > -180,
        };
      };

      // ── AMBIENT CORE GLOW ──
      const coreGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 180);
      coreGrad.addColorStop(0, 'rgba(198, 146, 59, 0.12)');
      coreGrad.addColorStop(0.5, 'rgba(11, 15, 23, 0.05)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fill();

      // ── 1. DRAW WIREFRAME GLOBE RINGS ──
      ctx.lineWidth = 0.75;
      wireframeRings.forEach((ring) => {
        ctx.beginPath();
        let first = true;
        ring.forEach((pt) => {
          const pr = project(pt);
          if (pr.visible) {
            // Fade back hemisphere
            const alpha = Math.max(0.04, Math.min(0.22, (pr.z + 120) / 240));
            ctx.strokeStyle = `rgba(198, 146, 59, ${alpha})`;
            if (first) {
              ctx.moveTo(pr.x, pr.y);
              first = false;
            } else {
              ctx.lineTo(pr.x, pr.y);
            }
          }
        });
        ctx.stroke();
      });

      // ── 2. DRAW 3D MESH ARCS BETWEEN NODES ──
      const nodeMap = new Map<string, SovereignNode>();
      SOVEREIGN_NODES.forEach((n) => nodeMap.set(n.id, n));

      MESH_LINKS.forEach(([fromId, toId], linkIdx) => {
        const fromNode = nodeMap.get(fromId);
        const toNode = nodeMap.get(toId);
        if (!fromNode || !toNode) return;

        const pA = latLonTo3D(fromNode.lat, fromNode.lon, sphereRadius);
        const pB = latLonTo3D(toNode.lat, toNode.lon, sphereRadius);

        const prA = project(pA);
        const prB = project(pB);

        if (prA.visible || prB.visible) {
          // Calculate lofted midpoint above the sphere
          const midX = (pA.x + pB.x) * 0.5 * 1.22;
          const midY = (pA.y + pB.y) * 0.5 * 1.22;
          const midZ = (pA.z + pB.z) * 0.5 * 1.22;
          const prMid = project({ x: midX, y: midY, z: midZ });

          // Render Arc
          ctx.beginPath();
          ctx.moveTo(prA.x, prA.y);
          ctx.quadraticCurveTo(prMid.x, prMid.y, prB.x, prB.y);

          const arcAlpha = Math.max(0.15, Math.min(0.7, (prMid.z + 140) / 280));
          ctx.strokeStyle =
            activeMode === 'latency'
              ? `rgba(16, 185, 129, ${arcAlpha})`
              : activeMode === 'vpc'
              ? `rgba(14, 165, 233, ${arcAlpha})`
              : `rgba(198, 146, 59, ${arcAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Animated energy pulse traveling along the arc
          const pulseT = ((state.time * 0.8 + linkIdx * 0.28) % 1);
          // Quadratic bezier interpolation for pulse position
          const pulseX = (1 - pulseT) * (1 - pulseT) * prA.x + 2 * (1 - pulseT) * pulseT * prMid.x + pulseT * pulseT * prB.x;
          const pulseY = (1 - pulseT) * (1 - pulseT) * prA.y + 2 * (1 - pulseT) * pulseT * prMid.y + pulseT * pulseT * prB.y;

          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = activeMode === 'latency' ? '#10B981' : '#F59E0B';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#F59E0B';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // ── 3. ORBITAL PARTICLES ──
      particles.forEach((pt) => {
        const curAngle = pt.baseAngle + state.time * pt.speed;
        const rawX = Math.cos(curAngle) * pt.radius;
        const rawZ = Math.sin(curAngle) * pt.radius;
        // Apply tilt
        const rawY = Math.sin(curAngle) * pt.radius * pt.tilt;

        const pr = project({ x: rawX, y: rawY, z: rawZ });
        if (pr.visible) {
          const depthAlpha = Math.max(0.1, Math.min(0.85, (pr.z + 160) / 320));
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, pt.size * (pr.scale * 0.9), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 163, 71, ${depthAlpha})`;
          ctx.fill();
        }
      });

      // ── 4. DRAW SOVEREIGN DATACENTER NODES ──
      const projectedNodes: { node: SovereignNode; x: number; y: number; z: number; visible: boolean }[] = [];

      SOVEREIGN_NODES.forEach((node) => {
        const pos = latLonTo3D(node.lat, node.lon, sphereRadius);
        const pr = project(pos);
        projectedNodes.push({ node, x: pr.x, y: pr.y, z: pr.z, visible: pr.visible });

        if (pr.visible) {
          const isSelected = activeNode.id === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const nodeAlpha = Math.max(0.3, Math.min(1, (pr.z + 100) / 200));

          // Outer radiating pulse on active/hovered node
          if (isSelected || isHovered) {
            const pulseR = 8 + Math.sin(state.time * 4) * 4;
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(198, 146, 59, ${0.45 * nodeAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Node core dot
          ctx.beginPath();
          const baseSize = isSelected ? 5.5 : isHovered ? 4.8 : 3.6;
          ctx.arc(pr.x, pr.y, baseSize, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#F59E0B' : node.color;
          ctx.shadowBlur = isSelected ? 12 : 6;
          ctx.shadowColor = isSelected ? '#F59E0B' : node.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner white center
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, baseSize * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Node Monospace Label / Radar Badge
          if (isSelected || isHovered) {
            const city = node.name.split(' ')[0];
            const label = `${city} • ${node.latency}`;
            ctx.font = `bold 10px 'JetBrains Mono', Consolas, monospace`;
            const textWidth = ctx.measureText(label).width;
            const pillW = textWidth + 16;
            const pillH = 20;
            const pillX = pr.x + 8;
            const pillY = pr.y - 10;

            // Draw Dark HUD Pill Background
            ctx.fillStyle = 'rgba(7, 11, 18, 0.94)';
            ctx.strokeStyle = '#C6923B';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if ((ctx as any).roundRect) {
              (ctx as any).roundRect(pillX, pillY, pillW, pillH, 5);
            } else {
              ctx.rect(pillX, pillY, pillW, pillH);
            }
            ctx.fill();
            ctx.stroke();

            // Status Green Dot
            ctx.beginPath();
            ctx.arc(pillX + 7, pillY + 10, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#10B981';
            ctx.fill();

            // White text inside pill
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(label, pillX + 15, pillY + 14);
          } else {
            // Subtle 3-letter region code for inactive nodes
            const code = node.id === 'mumbai' ? 'BOM' :
                         node.id === 'bengaluru' ? 'BLR' :
                         node.id === 'delhi' ? 'DEL' :
                         node.id === 'hyderabad' ? 'HYD' :
                         node.id === 'chennai' ? 'MAA' : 'PNQ';
            ctx.font = `600 8.5px 'JetBrains Mono', Consolas, monospace`;
            ctx.fillStyle = `rgba(203, 213, 225, ${0.75 * nodeAlpha})`;
            ctx.fillText(code, pr.x + 7, pr.y + 3);
          }
        }
      });

      projectedNodesRef.current = projectedNodes;

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [autoRotate, isDragging, activeMode, activeNode, hoveredNode]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl border border-slate-200/90 dark:border-brandGold-500/30 bg-slate-900/95 dark:bg-[#070b12]/95 shadow-2xl backdrop-blur-2xl overflow-hidden ring-1 ring-brandGold-500/20 select-none h-[390px] sm:h-[430px] lg:h-[460px] flex flex-col justify-between ${className}`}
    >
      {/* ── AMBIENT GLASS CORNER LIGHTING ── */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brandGold-500/15 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent pointer-events-none rounded-bl-3xl" />

      {/* ── TOP HUD HEADER: ACTIVE SOVEREIGN REGION STATUS ── */}
      <div className="relative z-10 px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between gap-2 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
          <span className="font-bold text-slate-100 tracking-wide uppercase text-[11px]">
            {activeNode.code} Core Mesh
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-brandGold-400 font-bold text-[10px]">{activeNode.tier}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-bold">
            <Radio className="w-2.5 h-2.5 text-emerald-500" />
            <span>P95: {activeNode.latency}</span>
          </div>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pause 3D Orbit' : 'Resume 3D Orbit'}
            className={`p-1 rounded-md border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-brandGold-500/15 border-brandGold-500/40 text-brandGold-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE 3D CANVAS VIEWPORT ── */}
      <div
        className="relative w-full flex-1 min-h-0 cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* ── INTERACTION WATERMARK / GUIDE ── */}
        <div className="absolute top-2.5 left-3.5 pointer-events-none text-[9px] font-mono text-slate-500 tracking-wider flex items-center gap-1.5">
          <Globe2 className="w-3 h-3 text-brandGold-500/70" />
          <span>DRAG TO ROTATE 3D MESH • CLICK NODE TO INSPECT</span>
        </div>

        {/* ── ACTIVE REGION FLOATING TELEMETRY CHIP (Lower Left) ── */}
        <div className="absolute bottom-2.5 left-3 z-10 p-2.5 rounded-xl bg-slate-950/90 border border-brandGold-500/30 text-white shadow-xl backdrop-blur-xl max-w-[210px] space-y-1">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
            <span className="text-brandGold-400 font-bold truncate">{activeNode.name.split(' ')[0]} Hub</span>
            <span className="text-emerald-400 font-bold shrink-0">{activeNode.status}</span>
          </div>
          <div className="text-[10px] text-slate-300 font-medium truncate">
            {activeNode.activeWorkloads}
          </div>
          <div className="flex items-center gap-1.5 pt-1 text-[9px] font-mono text-slate-400 border-t border-slate-800/80">
            <span>DPDPA 2023</span>
            <span>•</span>
            <span className="text-emerald-400">Zero Egress</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM HUD CONTROLLER: MODES & REGION SELECTOR ── */}
      <div className="relative z-10 px-3.5 sm:px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md space-y-2 shrink-0">
        {/* Layer Mode Switcher */}
        <div className="flex items-center justify-between gap-1.5 overflow-hidden">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Eye className="w-3 h-3 text-brandGold-500" />
            <span className="hidden xs:inline">Mode:</span>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-mono overflow-x-auto max-w-full">
            {[
              { id: 'mesh', label: '3D Mesh', icon: Globe2 },
              { id: 'latency', label: 'RTT Ping', icon: Activity },
              { id: 'vpc', label: 'WireGuard', icon: Zap },
              { id: 'fabric', label: 'S3 NVMe', icon: Cpu },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id as any)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer font-bold shrink-0 ${
                    isActive
                      ? 'bg-brandGold-500 text-brandObsidian-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Node Switcher Chips (Grid of 6) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-0.5">
          {SOVEREIGN_NODES.map((node) => {
            const isSelected = activeNode.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  setActiveNode(node);
                  onSelectNode?.(node);
                }}
                className={`py-1 px-1 rounded-lg text-[9px] font-mono transition-all flex flex-col items-center justify-center border cursor-pointer ${
                  isSelected
                    ? 'bg-brandGold-500/20 border-brandGold-500 text-brandGold-300 font-bold ring-1 ring-brandGold-500/40'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title={`${node.name} (${node.latency})`}
              >
                <span className="w-1.5 h-1.5 rounded-full mb-0.5" style={{ backgroundColor: node.color }} />
                <span className="truncate w-full text-center">{node.code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
