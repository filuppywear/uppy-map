export const CONTINENT_CENTERS: Record<string, { lng: number; lat: number; zoom: number }> = {
  Europe: { lng: 15, lat: 50, zoom: 3.5 },
  "North America": { lng: -100, lat: 45, zoom: 3 },
  "South America": { lng: -60, lat: -15, zoom: 3 },
  Asia: { lng: 100, lat: 35, zoom: 3 },
  Africa: { lng: 20, lat: 5, zoom: 3 },
  Oceania: { lng: 135, lat: -25, zoom: 3.5 },
};

export const TILE_IMAGES: Record<string, string> = {
  Europe: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=500&fit=crop",
  "North America": "https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=400&h=500&fit=crop",
  "South America": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=500&fit=crop",
  Asia: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=500&fit=crop",
  Africa: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=500&fit=crop",
  Oceania: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=500&fit=crop",
  Italy: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=500&fit=crop",
  France: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=500&fit=crop",
  Spain: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&h=500&fit=crop",
  Germany: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=500&fit=crop",
  UK: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=500&fit=crop",
  Japan: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=500&fit=crop",
  USA: "https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=400&h=500&fit=crop",
  Portugal: "https://images.unsplash.com/photo-1555881400-74d7acaacd6b?w=400&h=500&fit=crop",
  Netherlands: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=500&fit=crop",
  Denmark: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&h=500&fit=crop",
  Sweden: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&h=500&fit=crop",
  London: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=500&fit=crop",
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=500&fit=crop",
  Milan: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=400&h=500&fit=crop",
  Rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=500&fit=crop",
  Tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=500&fit=crop",
  "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=500&fit=crop",
  Barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=500&fit=crop",
  Berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=500&fit=crop",
  Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=500&fit=crop",
  Copenhagen: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&h=500&fit=crop",
  Stockholm: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&h=500&fit=crop",
  Budapest: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=400&h=500&fit=crop",
  Vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=400&h=500&fit=crop",
  Lisbon: "https://images.unsplash.com/photo-1555881400-74d7acaacd6b?w=400&h=500&fit=crop",
  Prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&h=500&fit=crop",
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=500&fit=crop",
];

export function getTileImage(name: string, index: number): string {
  return TILE_IMAGES[name] || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}
