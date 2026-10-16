'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, m, useReducedMotion, useScroll } from 'motion/react';
import { GuidanceKeys, LayeredMap, PropertyWorld } from './SpatialElements';
import styles from './Landing.module.css';
import PropertyMap from './PropertyMap';
import { Navigation, Footer, useSiteTheme } from '../SiteElements';
import { usePublishedProperties } from './usePublishedProperties';

const ArchitectureScene = dynamic(() => import('./ArchitectureScene'), { ssr: false });

function Icon({ name, className = '' }) {
  return <i className={`fa-solid fa-${name} ${className}`} aria-hidden="true" />;
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <m.div className={className} initial={false}
      whileInView={reduce ? undefined : { opacity: [0.65, 1] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </m.div>
  );
}


function ArchitecturalFallback() {
  return <div className={styles.fallback} aria-hidden="true">
    <div className={styles.fallbackPlot}>
      <div className={styles.fallbackHouse}><span /><span /><span /><span /></div>
      <div className={styles.fallbackUpper}><span /><span /><span /></div>
      <div className={styles.fallbackPool} />
      <div className={styles.fallbackTree} /><div className={styles.fallbackTree} />
    </div>
  </div>;
}

function Hero() {
  const track = useRef(null);
  const systemReduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const reduce = systemReduced;
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end start'] });

  return (
    <section ref={track} className={styles.heroTrack} aria-label="Find your next property">
      <div className={styles.heroSticky}>
        <div className={styles.heroGrid}>
          <m.div className={styles.heroCopy} >
            <p className={styles.eyebrow}>Real estate, rooted in NCR</p>
            <h1>A place to <span>build more.</span></h1>
            <p className={styles.heroDescription}>Discover residential plots and commercial spaces, with local guidance from your first shortlist to your next move.</p>
            <div className={styles.heroActions}>
              <a href="#areas" className={styles.primaryButton}>Explore areas <Icon name="arrow-down" /></a>
              <Link href="/properties" className={styles.textLink}>View properties <Icon name="arrow-up-right-from-square" /></Link>
            </div>
          </m.div>
          <figure className={styles.sceneFigure}>
            <div className={styles.sceneStage} role="group" aria-label="An illustrative modern home with a landscaped plot. Its upper floor gently separates as you move down the page.">
              <ArchitecturalFallback />
              <ArchitectureScene progress={scrollYProgress} reduceMotion={Boolean(reduce)} paused={paused} />
            </div>
            <m.figcaption className={styles.sceneCaption} >
              <span><span className={styles.captionLine} />Drag to turn · double-click to reset</span>
              {!systemReduced && <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>
                <Icon name={paused ? 'play' : 'pause'} />{paused ? 'Resume 3D motion' : 'Pause 3D motion'}
              </button>}
            </m.figcaption>
          </figure>
        </div>
        <div className={styles.heroBottom} aria-hidden="true" />
      </div>
    </section>
  );
}

function imageUrl(url, width = 1200) {
  if (!url) return null;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`)
    : url;
}

function ContentImage({ src, alt, className, eager = false, fallback }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback;
  return <img className={className} src={imageUrl(src)} alt={alt} width="1200" height="900"
    loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}

function AreaExplorer({ areas, available }) {
  const [areaKey, setAreaKey] = useState(areas[0]?.key || '');
  const [subId, setSubId] = useState(areas[0]?.subAreas?.[0]?.id || null);
  const [query, setQuery] = useState('');
  const area = areas.find(a => a.key === areaKey) || areas[0];
  const selected = area?.subAreas.find(s => s.id === subId) || area?.subAreas[0];
  const subareas = (area?.subAreas || []).filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  const selectedImage = selected?.image || selected?.societies.find(s => s.image)?.image;
  const totalCommunities = areas.reduce((n, a) => n + a.subAreas.reduce((sum, s) => sum + s.societies.length, 0), 0);
  const selectArea = e => { setAreaKey(e.target.value); setSubId(null); setQuery(''); };

  return (
    <section id="areas" className={`${styles.section} ${styles.areas}`} aria-labelledby="areas-heading">
      <Reveal className={styles.sectionHeading}>
        <span className={styles.sectionKicker}>Our areas</span>
        <h2 id="areas-heading">A better feel<br />for your next address.</h2>
        <p>Get to know the locations, sectors and communities before you make your move.</p>
      </Reveal>
      {!area ? <div className={styles.emptyState}><Icon name="map-location-dot" /><h3>{available ? 'New areas are on the way.' : 'Let’s find the right area together.'}</h3><p>Contact our team for current locations and availability.</p><Link href="/contact" className={styles.textLink}>Contact <Icon name="arrow-right" /></Link></div> :
        <Reveal className={styles.explorer}>
          <div className={styles.areaSidebar}>
            <div className={styles.areaTitle}>
              <Icon name="location-dot" />
              {areas.length > 1 ? <label className={styles.areaSelect}>Select an area<select value={area.key} onChange={selectArea}>{areas.map(a => <option key={a.key} value={a.key}>{a.name}</option>)}</select></label> : <h3>{area.name}</h3>}
            </div>
            <label className={styles.searchLabel} htmlFor="area-search">Find a sector or community</label>
            <div className={styles.searchInput}><Icon name="magnifying-glass" /><input id="area-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search locations" autoComplete="off" /></div>
            <div className={styles.sectorList} aria-label="Locations">
              {subareas.map(sub => <button type="button" key={sub.id} className={`${styles.sectorButton} ${selected?.id === sub.id ? styles.sectorActive : ''}`}
                aria-pressed={selected?.id === sub.id} onClick={() => setSubId(sub.id)}>
                <span>{sub.title}</span><Icon name="arrow-up-right-from-square" />
              </button>)}
              {subareas.length === 0 && <p className={styles.noResults} role="status">No matching locations. Try another name.</p>}
            </div>
            <Link href={`/properties?area=${encodeURIComponent(area.key)}`} className={styles.areaProperties}>View properties <Icon name="arrow-right" /></Link>
          </div>
          <div className={styles.areaDetail}>
            <LayeredMap>
              <div className={styles.mapFrame}>
                <ContentImage key={selectedImage || selected?.id} src={selectedImage} alt={`${selected?.title || area.name} area reference`} className={styles.areaImage}
                  fallback={<div className={styles.mapUnavailable}><Icon name="map-location-dot" /><span>Explore {selected?.title || area.name}</span></div>} />
              </div>
            </LayeredMap>
            <div className={styles.areaDetailCaption} aria-live="polite" aria-atomic="true">
              <div><span className={styles.areaParent}>{area.name}</span><h3>{selected?.title || area.name}</h3></div>
              {selected && <Link href={`/societies/${encodeURIComponent(area.key)}/${selected.id}`} className={styles.roundLink} aria-label={`Explore ${selected.title}`}><Icon name="arrow-up-right-from-square" /></Link>}
            </div>
            {selected?.description && <p className={styles.areaDescription}>{selected.description}</p>}
          </div>
        </Reveal>}
      {totalCommunities > 0 && <div className={styles.areaNote}><span>{totalCommunities} communities to explore</span><p>Real places. A clearer perspective.</p></div>}
    </section>
  );
}

function Properties({ properties: initialProperties, available: initiallyAvailable }) {
  const { properties, available } = usePublishedProperties(initialProperties, initiallyAvailable);
  return <section id="properties" className={`${styles.section} ${styles.propertySection}`} aria-labelledby="properties-heading">
    <Reveal className={styles.sectionHeading}><h2 id="properties-heading">Find your place.<br />Take a look around.</h2><p>A winding route through our available properties. Pick a marker and see where it takes you.</p></Reveal>
    {properties.length > 0 && <PropertyMap properties={properties} />}
    {properties.length === 0 && <div className={styles.emptyState}><h3>{available ? 'Your next opportunity is on its way.' : 'Looking for something specific?'}</h3><p>Our team can help with the latest property availability.</p><Link href="/contact" className={styles.textLink}>Contact <Icon name="arrow-right" /></Link></div>}
    <Reveal className={styles.propertiesFooter}><Link href="/properties" className={styles.secondaryButton}>View all properties <Icon name="arrow-right" /></Link></Reveal>
  </section>;
}

function Guidance() {
  const [active, setActive] = useState(0);
  const steps = [
    { title: 'Start with your plans.', body: 'A home, a plot, a commercial space. Tell us what you are looking for and what matters most to you.', icon: 'compass-drafting' },
    { title: 'Get to know the place.', body: 'Explore the area, review property details and arrange a visit with our team. Bring your questions.', icon: 'map-location-dot' },
    { title: 'Make an informed move.', body: 'Discuss availability and the next steps with local people who know the area.', icon: 'key' },
  ];
  return <section className={`${styles.section} ${styles.guidance}`} aria-labelledby="guidance-heading">
    <div className={styles.guidanceVisual}><GuidanceKeys /></div>
    <div className={styles.guidanceContent}>
    <Reveal className={styles.guidanceIntro}><span className={styles.sectionKicker}>The Pawan Buildhome approach</span><h2 id="guidance-heading">Property is personal.<br />So is our guidance.</h2><p>From your first question to a site visit, we help you see the whole picture.</p></Reveal>
    <Reveal className={styles.guidanceSteps}>
      {steps.map((step, index) => <div key={step.title} className={`${styles.guidanceStep} ${active === index ? styles.guidanceActive : ''}`}>
        <h3><button type="button" onClick={() => setActive(active === index ? null : index)} aria-expanded={active === index} aria-controls={`guidance-${index}`}><Icon name={step.icon} /><span>{step.title}</span><Icon name={active === index ? 'minus' : 'plus'} /></button></h3>
        <div id={`guidance-${index}`} hidden={active !== index}><p>{step.body}</p></div>
      </div>)}
    </Reveal>
    <Link href="/contact" className={styles.textLink}>Talk about your next move <Icon name="arrow-up-right-from-square" /></Link>
    </div>
  </section>;
}

export default function LandingPage({ content }) {
  const { theme, changeTheme } = useSiteTheme();
  return <LazyMotion features={domAnimation} strict>
    <div id="top" className={styles.landing} data-theme={theme}>
      <Navigation theme={theme} onThemeChange={changeTheme} />
      <main id="landing-content">
        <Hero />
        <AreaExplorer areas={content.areas} available={content.available.areas} />
        <PropertyWorld />
        <Properties properties={content.properties} available={content.available.properties} />
        <Guidance />
      </main>
      <Footer />
    </div>
  </LazyMotion>;
}
