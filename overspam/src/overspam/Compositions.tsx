import React from "react";
import {Composition} from "remotion";
import {Capsule, CAPSULES} from "./Capsule";
import {BossIntro, bossFrames, END_DEFAULTS, EndCard, endFrames} from "./EndCard";
import {
  Build, buildFrames, Heroes, heroesFrames, INSERT_DEFAULTS, Items, itemsFrames,
  Tomes, tomesFrames, Weapons, weaponsFrames, Worlds, worldsFrames,
} from "./Inserts";

/** Вставки для трейлера OVERSPAM: 1920×1080, 60 fps, длина зависит от bpm */
const INSERTS = [
  {id: "OS-Worlds", component: Worlds, frames: worldsFrames},
  {id: "OS-Heroes", component: Heroes, frames: heroesFrames},
  {id: "OS-Weapons", component: Weapons, frames: weaponsFrames},
  {id: "OS-Items", component: Items, frames: itemsFrames},
  {id: "OS-Cards", component: Tomes, frames: tomesFrames},
  {id: "OS-Build", component: Build, frames: buildFrames},
];

export const OverspamCompositions: React.FC = () => (
  <>
    {INSERTS.map(({id, component, frames}) => (
      <Composition
        key={id}
        id={id}
        component={component}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={frames(INSERT_DEFAULTS)}
        defaultProps={INSERT_DEFAULTS}
        calculateMetadata={({props}) => ({durationInFrames: frames(props)})}
      />
    ))}
    <Composition
      id="OS-End"
      component={EndCard}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={endFrames(END_DEFAULTS)}
      defaultProps={END_DEFAULTS}
      calculateMetadata={({props}) => ({durationInFrames: endFrames(props)})}
    />
    <Composition
      id="OS-Boss"
      component={BossIntro}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={bossFrames({bpm: 120})}
      defaultProps={{boss: 0, bpm: 120, sfx: true}}
      calculateMetadata={({props}) => ({durationInFrames: bossFrames(props)})}
    />
    <Composition
      id="OS-Capsule"
      component={Capsule}
      width={CAPSULES.header.width}
      height={CAPSULES.header.height}
      fps={60}
      durationInFrames={1}
      defaultProps={{kind: "header" as const, world: "moon"}}
      calculateMetadata={({props}) => CAPSULES[props.kind]}
    />
  </>
);
