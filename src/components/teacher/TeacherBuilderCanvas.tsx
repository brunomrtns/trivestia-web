import React from 'react';
import { Stage, Layer, Circle, Rect, Ellipse, Path, Group } from 'react-konva';
import type { TeacherBuilderConfig } from '@/types/teacher-builder';

// Helper to slightly darken a hex color for ears/nose
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) - amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) - amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) - amt));

  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
};

interface TeacherBuilderCanvasProps {
  config: TeacherBuilderConfig;
}

const BackgroundLayer = () => {
  return (
    <Group>
      <Rect width={240} height={320} fill="#f1f5f9" />
      <Circle x={120} y={160} radius={110} fill="#e2e8f0" />
    </Group>
  );
};

const BodyLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  return (
    <Group>
      {/* Neck */}
      <Rect x={100} y={200} width={40} height={50} fill={config.skinTone} />
      {/* Shoulders / Body */}
      <Ellipse x={120} y={300} radiusX={90} radiusY={60} fill={config.skinTone} />
    </Group>
  );
};

const ClothesLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  return (
    <Group>
      {config.clothes === 'tshirt' && (
        <Group>
          <Ellipse x={120} y={305} radiusX={92} radiusY={60} fill={config.clothesColor} />
          {/* Collar cutout */}
          <Path
            data="M 90 245 Q 120 280 150 245 L 150 245"
            fill={config.skinTone}
          />
        </Group>
      )}
      {config.clothes === 'shirt' && (
        <Group>
          <Ellipse x={120} y={305} radiusX={92} radiusY={60} fill={config.clothesColor} />
          {/* Collar */}
          <Path
            data="M 95 240 L 120 270 L 145 240 L 120 250 Z"
            fill={darkenColor(config.clothesColor, 20)}
          />
          {/* Buttons */}
          <Circle x={120} y={285} radius={3} fill="#ffffff" />
          <Circle x={120} y={305} radius={3} fill="#ffffff" />
        </Group>
      )}
      {config.clothes === 'blazer' && (
        <Group>
          {/* Inner shirt (always white or light) */}
          <Ellipse x={120} y={305} radiusX={92} radiusY={60} fill="#f8fafc" />
          {/* Blazer */}
          <Path
            data="M 28 305 Q 40 240 95 240 L 120 290 L 145 240 Q 200 240 212 305 Z"
            fill={config.clothesColor}
          />
          {/* Tie or details */}
          <Path
            data="M 115 250 L 125 250 L 120 290 Z"
            fill="#334155"
          />
        </Group>
      )}
    </Group>
  );
};

const HeadLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  return (
    <Group>
      {/* Base Head */}
      <Ellipse x={120} y={130} radiusX={65} radiusY={75} fill={config.skinTone} />
    </Group>
  );
};

const EarsLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  const darkSkin = darkenColor(config.skinTone, 10);
  return (
    <Group>
      <Ellipse x={55} y={140} radiusX={10} radiusY={15} fill={darkSkin} />
      <Ellipse x={185} y={140} radiusX={10} radiusY={15} fill={darkSkin} />
    </Group>
  );
};

const HairLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  if (config.hairStyle === 'bald') return null;

  return (
    <Group>
      {config.hairStyle === 'short' && (
        <Path
          data="M 50 120 Q 50 40 120 45 Q 190 40 190 120 Q 185 85 150 70 Q 120 85 80 70 Q 55 85 50 120 Z"
          fill={config.hairColor}
        />
      )}
      {config.hairStyle === 'medium' && (
        <Path
          data="M 45 150 Q 30 50 120 40 Q 210 50 195 150 Q 170 180 175 120 Q 150 65 120 80 Q 90 65 65 120 Q 70 180 45 150 Z"
          fill={config.hairColor}
        />
      )}
      {config.hairStyle === 'long' && (
        <Group>
          {/* Back hair */}
          <Path
            data="M 40 130 L 40 240 Q 120 270 200 240 L 200 130 Z"
            fill={darkenColor(config.hairColor, 10)}
          />
          {/* Front hair */}
          <Path
            data="M 45 150 Q 30 50 120 40 Q 210 50 195 150 Q 170 100 120 80 Q 70 100 45 150 Z"
            fill={config.hairColor}
          />
        </Group>
      )}
    </Group>
  );
};

const EyesLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  const isNarrow = config.eyeType === 'narrow';
  const isAlmond = config.eyeType === 'almond';

  const leftEyeData = isNarrow 
    ? "M 85 130 Q 95 122 105 130 Q 95 135 85 130 Z"
    : isAlmond 
    ? "M 82 130 Q 95 118 108 130 Q 95 138 82 130 Z"
    : "M 85 130 A 10 10 0 1 1 105 130 A 10 10 0 1 1 85 130 Z";
    
  const rightEyeData = isNarrow 
    ? "M 135 130 Q 145 122 155 130 Q 145 135 135 130 Z"
    : isAlmond 
    ? "M 132 130 Q 145 118 158 130 Q 145 138 132 130 Z"
    : "M 135 130 A 10 10 0 1 1 155 130 A 10 10 0 1 1 135 130 Z";

  return (
    <Group>
      {/* Sclera */}
      {isNarrow || isAlmond ? (
        <>
          <Path data={leftEyeData} fill="#ffffff" />
          <Path data={rightEyeData} fill="#ffffff" />
        </>
      ) : (
        <>
          <Ellipse x={95} y={130} radiusX={12} radiusY={14} fill="#ffffff" />
          <Ellipse x={145} y={130} radiusX={12} radiusY={14} fill="#ffffff" />
        </>
      )}

      {/* Iris */}
      <Circle x={95} y={130} radius={isNarrow ? 3 : 5} fill="#475569" />
      <Circle x={145} y={130} radius={isNarrow ? 3 : 5} fill="#475569" />

      {/* Pupil */}
      <Circle x={95} y={130} radius={2} fill="#0f172a" />
      <Circle x={145} y={130} radius={2} fill="#0f172a" />
    </Group>
  );
};

const EyebrowsLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  return (
    <Group>
      <Path
        data="M 80 110 Q 95 102 110 112"
        stroke={config.hairColor}
        strokeWidth={4}
        lineCap="round"
      />
      <Path
        data="M 130 112 Q 145 102 160 110"
        stroke={config.hairColor}
        strokeWidth={4}
        lineCap="round"
      />
    </Group>
  );
};

const NoseLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  const darkSkin = darkenColor(config.skinTone, 15);
  return (
    <Group>
      <Path
        data="M 120 135 Q 125 155 115 160 Q 120 165 125 160"
        stroke={darkSkin}
        strokeWidth={2.5}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
};

const MouthLayer = () => {
  return (
    <Group>
      <Path
        data="M 100 175 Q 120 195 140 175 Q 120 205 100 175 Z"
        fill="#f43f5e"
      />
      {/* Teeth line */}
      <Path
        data="M 103 178 Q 120 188 137 178"
        stroke="#ffffff"
        strokeWidth={3}
      />
    </Group>
  );
};

const AccessoriesLayer = ({ config }: { config: TeacherBuilderConfig }) => {
  return (
    <Group>
      {config.accessories === 'glasses' && (
        <Group>
          {/* Frames */}
          <Rect x={75} y={115} width={40} height={30} rx={5} stroke="#0f172a" strokeWidth={3} />
          <Rect x={125} y={115} width={40} height={30} rx={5} stroke="#0f172a" strokeWidth={3} />
          {/* Bridge */}
          <Path data="M 115 125 L 125 125" stroke="#0f172a" strokeWidth={3} />
          {/* Arms */}
          <Path data="M 75 125 L 55 120" stroke="#0f172a" strokeWidth={3} />
          <Path data="M 165 125 L 185 120" stroke="#0f172a" strokeWidth={3} />
        </Group>
      )}
      {config.accessories === 'earrings' && (
        <Group>
          <Circle x={55} y={155} radius={4} fill="#fbbf24" />
          <Circle x={185} y={155} radius={4} fill="#fbbf24" />
        </Group>
      )}
    </Group>
  );
};

export const TeacherBuilderCanvas: React.FC<TeacherBuilderCanvasProps> = ({ config }) => {
  return (
    <Stage width={240} height={320} className="overflow-hidden rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
      <Layer>
        <BackgroundLayer />
        <EarsLayer config={config} />
        <BodyLayer config={config} />
        <ClothesLayer config={config} />
        <HeadLayer config={config} />
        <HairLayer config={config} />
        <EyesLayer config={config} />
        <EyebrowsLayer config={config} />
        <NoseLayer config={config} />
        <MouthLayer />
        <AccessoriesLayer config={config} />
      </Layer>
    </Stage>
  );
};
