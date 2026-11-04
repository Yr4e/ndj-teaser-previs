import React from "react";
import {Composition} from "remotion";
import {Capsule, CAPSULES} from "./Capsule";
import {BossIntro, bossFrames, END_DEFAULTS, EndCard, endFrames} from "./EndCard";
import {
  Build, buildFrames, Heroes, heroesFrames, INSERT_DEFAULTS, Items, itemsFrames,
  Tomes, tomesFrames, Weapons, weaponsFrames, Worlds, worldsFrames,
} from "./Inserts";
import {
  Cards, cardsFrames, Chests, chestsFrames, HeroTag, heroTagFrames, MapTag, mapTagFrames, Title, TITLE_DEFAULTS, titleFrames,
  Opener, OPENER_DEFAULTS, openerFrames,
} from "./Trailer";
import {Overtime, overtimeFrames} from "./Overtime";
import {TitleOverlay, titleOverlayFrames, WorldsSplit, worldsSplitFrames} from "./TeaserInserts";
import {BossLineup, bossLineupFrames, BossPath, bossPathFrames} from "./Bosses";
import {Shrines, shrinesFrames} from "./Shrines";
import {ChestsOpen, chestsOpenFrames} from "./ChestsOpen";
import {OpenerCuts, OPENER_CUTS_DEFAULTS, openerCutsFrames} from "./OpenerCuts";
import {CardsPick, CARDS_PICK_DEFAULTS, cardsPickFrames} from "./CardsPick";

/** Вставки для трейлера OVERSPAM: 1920×1080, 60 fps, длина зависит от bpm */
const INSERTS = [
  {id: "OS-Worlds", component: Worlds, frames: worldsFrames},
  {id: "OS-Heroes", component: Heroes, frames: heroesFrames},
  {id: "OS-Weapons", component: Weapons, frames: weaponsFrames},
  {id: "OS-Items", component: Items, frames: itemsFrames},
  {id: "OS-CardsFan", component: Tomes, frames: tomesFrames},
  {id: "OS-Cards", component: Cards, frames: cardsFrames},
  {id: "OS-Chests", component: Chests, frames: chestsFrames},
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
      id="OS-Title"
      component={Title}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={titleFrames(TITLE_DEFAULTS)}
      defaultProps={TITLE_DEFAULTS}
      calculateMetadata={({props}) => ({durationInFrames: titleFrames(props)})}
    />
    <Composition
      id="OS-WorldsSplit"
      component={WorldsSplit}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={worldsSplitFrames({bpm: 130})}
      defaultProps={{bpm: 130, sfx: true}}
      calculateMetadata={({props}) => ({durationInFrames: worldsSplitFrames(props)})}
    />
    <Composition
      id="OS-TitleOverlay"
      component={TitleOverlay}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={titleOverlayFrames({bpm: 168})}
      defaultProps={{bpm: 168}}
      calculateMetadata={({props}) => ({durationInFrames: titleOverlayFrames(props)})}
    />
    <Composition id="OS-Overtime" component={Overtime} width={1920} height={1080} fps={60} durationInFrames={overtimeFrames} />
    <Composition id="OS-BossPath" component={BossPath} width={1920} height={1080} fps={60} durationInFrames={bossPathFrames} />
    <Composition id="OS-BossLineup" component={BossLineup} width={1920} height={1080} fps={60} durationInFrames={bossLineupFrames} />
    <Composition id="OS-Shrines" component={Shrines} width={1920} height={1080} fps={60} durationInFrames={shrinesFrames} />
    <Composition id="OS-ChestsOpen" component={ChestsOpen} width={1920} height={1080} fps={60} durationInFrames={chestsOpenFrames} />
    <Composition
      id="OS-OpenerCuts"
      component={OpenerCuts}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={openerCutsFrames(OPENER_CUTS_DEFAULTS.extend)}
      defaultProps={OPENER_CUTS_DEFAULTS}
      calculateMetadata={({props}) => ({durationInFrames: openerCutsFrames(props.extend)})}
    />
    <Composition
      id="OS-CardsPick"
      component={CardsPick}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={cardsPickFrames}
      defaultProps={CARDS_PICK_DEFAULTS}
    />
    <Composition
      id="OS-Opener"
      component={Opener}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={openerFrames(OPENER_DEFAULTS)}
      defaultProps={OPENER_DEFAULTS}
      calculateMetadata={({props}) => ({durationInFrames: openerFrames(props)})}
    />
    <Composition
      id="OS-HeroTag"
      component={HeroTag}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={heroTagFrames(INSERT_DEFAULTS)}
      defaultProps={{...INSERT_DEFAULTS, hero: "grindbone"}}
      calculateMetadata={({props}) => ({durationInFrames: heroTagFrames(props)})}
    />
    <Composition
      id="OS-MapTag"
      component={MapTag}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={mapTagFrames(INSERT_DEFAULTS)}
      defaultProps={{...INSERT_DEFAULTS, tag: "SHRINES"}}
      calculateMetadata={({props}) => ({durationInFrames: mapTagFrames(props)})}
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
