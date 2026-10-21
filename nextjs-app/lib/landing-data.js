import 'server-only';

function selectProperties(properties) {
  return (properties || []).filter(p => p.isActive !== false).map(p => ({
    id: String(p._id), title: p.title, price: p.price, location: p.location,
    area: p.area, areaKey: p.areaKey, propertyType: p.propertyType, isPlot: p.isPlot === true,
    image: p.images?.[0] || null, description: p.description,
  }));
}

function selectContent(areas, properties, available) {
  const areaRows = Object.entries(areas || {}).map(([key, area]) => ({
    key,
    name: area.name,
    description: area.description,
    subAreas: (area.subAreas || []).map(sub => ({
      id: sub.id,
      title: sub.title,
      description: sub.description,
      image: sub.mapImage || (sub.image !== '/assets/map.webp' ? sub.image : null) || null,
      societies: (sub.societies || []).filter(s => s.isActive !== false).map(s => ({
        id: s.id,
        name: s.name,
        image: s.images?.[s.featuredImageIndex || 0] || s.mapImage || null,
      })),
    })),
  }));

  return {
    areas: areaRows,
    properties: selectProperties(properties),
    available,
  };
}

// An uncached, read-only refresh for already-open landing pages.
export async function getLandingProperties() {
  const source = process.env.LANDING_CONTENT_API_URL?.replace(/\/+$/, '');
  if (source) {
    const response = await fetch(`${source}/properties`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Properties unavailable');
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) throw new Error('Properties unavailable');
    return selectProperties(result.data);
  }
  const [{ connectDB }, { default: Property }] = await Promise.all([import('./db'), import('./models/Property')]);
  await connectDB();
  return selectProperties(await Property.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean());
}

export async function getLandingData() {
  const source = process.env.LANDING_CONTENT_API_URL?.replace(/\/+$/, '');
  if (source) {
    const load = async endpoint => {
      const response = await fetch(`${source}/${endpoint}`, {
        next: { revalidate: 300 }, signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Public content unavailable');
      const result = await response.json();
      if (!result.success) throw new Error('Invalid public content response');
      return result.data;
    };
    const [areas, properties] = await Promise.allSettled([load('areas'), load('properties')]);
    return selectContent(
      areas.status === 'fulfilled' ? areas.value : {},
      properties.status === 'fulfilled' && Array.isArray(properties.value) ? properties.value : [],
      { areas: areas.status === 'fulfilled', properties: properties.status === 'fulfilled' },
    );
  }

  try {
    const [{ connectDB }, { default: Area }, { default: Property }] = await Promise.all([
      import('./db'), import('./models/Area'), import('./models/Property'),
    ]);
    await connectDB();
    const [areas, properties] = await Promise.all([
      Area.find({ isActive: true }).sort({ order: 1 }).lean(),
      Property.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean(),
    ]);
    return selectContent(Object.fromEntries(areas.map(a => [a.key, a])), properties, { areas: true, properties: true });
  } catch {
    return selectContent({}, [], { areas: false, properties: false });
  }
}
