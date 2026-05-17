'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { Search, MapPin, SlidersHorizontal, ChevronDown, X, Clock, Wifi, Coffee, Car, Wind, Filter } from 'lucide-react';

function ImageCarousel({ cover, interiors, tables }: { cover?: string, interiors?: string[], tables?: string[] }) {
  const allImages = [];
  if (cover) allImages.push(`http://localhost:5001${cover}`);
  if (interiors) interiors.forEach(img => allImages.push(`http://localhost:5001${img}`));
  if (tables) tables.forEach(img => { if (img) allImages.push(`http://localhost:5001${img}`) });

  if (allImages.length === 0) {
    return <div className="w-full h-48 bg-white/5 flex items-center justify-center text-gray-500 rounded-t-xl">No Images Available</div>;
  }

  return (
    <div className="w-full h-48 overflow-x-auto flex snap-x snap-mandatory hide-scrollbar rounded-t-xl relative group">
      {allImages.map((src, i) => (
        <div key={i} className="min-w-full h-full snap-center bg-cover bg-center" style={{ backgroundImage: `url('${src}')` }} />
      ))}
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
        Swipe
      </div>
    </div>
  );
}

const formatDistance = (distKm: number) => {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} meters away`;
  }
  return `${distKm.toFixed(1)} km away`;
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const COMMON_AMENITIES = ['Air Condition', 'Parking', 'Cafe', 'Wifi', 'Ball Boy'];

export default function ClientClubList({ initialClubs }: { initialClubs: any[] }) {
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>(initialClubs);

  // Filters State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [sortBy, setSortBy] = useState('');
  const [tableTypes, setTableTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [openNow, setOpenNow] = useState(false);
  const [is24_7, setIs24_7] = useState(false);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // UI State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Columns state for virtualization
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      fetch(`http://localhost:5001/api/clubs/suggestions?q=${encodeURIComponent(debouncedSearch)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSuggestions(data.data);
            setShowSuggestions(true);
          }
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearch]);

  const fetchClubs = useCallback(async (pageNum: number, isReset: boolean = false) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '12');

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (sortBy) params.append('sortBy', sortBy);
      if (tableTypes.length > 0) params.append('tableTypes', tableTypes.join(','));
      if (amenities.length > 0) params.append('amenities', amenities.join(','));
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (openNow) params.append('openNow', 'true');
      if (is24_7) params.append('is24_7', 'true');
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
      }

      const res = await fetch(`http://localhost:5001/api/clubs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (isReset) {
          setClubs(data.data);
        } else {
          setClubs(prev => {
            // Deduplicate items to prevent memory growth on strict-mode double calls
            const newClubs = data.data.filter((c: any) => !prev.some(p => p.id === c.id));
            return [...prev, ...newClubs];
          });
        }
        setHasMore(data.meta.page < data.meta.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch clubs', err);
      setError('Could not fetch clubs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, tableTypes, minPrice, maxPrice, userLocation, amenities, openNow, is24_7]);

  useEffect(() => {
    setPage(1);
    fetchClubs(1, true);
  }, [fetchClubs]);

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSortBy('distance');
        },
        (err) => {
          console.warn('Geolocation permission denied', err);
          setError('Location access denied.');
          setLoading(false);
        }
      );
    }
  };

  const toggleArrayItem = (item: string, stateArray: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    setState(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // --- Virtualization Setup ---
  const listRef = useRef<HTMLDivElement>(null);

  const rows: any[][] = [];
  for (let i = 0; i < clubs.length; i += columns) {
    rows.push(clubs.slice(i, i + columns));
  }

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 520, // increased for extra price rows
    overscan: 2,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(p => {
            const next = p + 1;
            fetchClubs(next, false);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [loading, hasMore, fetchClubs]);

  const filterSidebarContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center lg:block">
        <h2 className="text-lg font-bold text-white mb-0 lg:mb-4 flex items-center"><SlidersHorizontal className="w-5 h-5 mr-2 text-snookerGreen" /> Filters</h2>
        <button className="lg:hidden p-2 text-gray-400 hover:text-white" onClick={() => setIsMobileFilterOpen(false)}>
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Location Detection */}
      <div>
        <button
          onClick={detectLocation}
          className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${userLocation ? 'bg-snookerGreen/20 text-snookerGreen border border-snookerGreen/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {userLocation ? 'Location Active' : 'Detect My Location'}
        </button>
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Availability</label>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-gray-300 flex items-center"><Clock className="w-4 h-4 mr-2 text-goldAccent" /> Open Now</span>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${openNow ? 'bg-snookerGreen' : 'bg-white/10'}`}>
              <input type="checkbox" className="hidden" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${openNow ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-gray-300">24/7 Open</span>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${is24_7 ? 'bg-snookerGreen' : 'bg-white/10'}`}>
              <input type="checkbox" className="hidden" checked={is24_7} onChange={(e) => setIs24_7(e.target.checked)} />
              <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${is24_7 ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Sort By</label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full appearance-none bg-black/50 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-snookerGreen"
          >
            <option value="">Default</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            {userLocation && <option value="distance">Nearest to Me</option>}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table Types */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Table Type</label>
        <div className="space-y-2">
          {['Snooker Table', '8 Ball Pool Table'].map(type => (
            <label key={type} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tableTypes.includes(type)}
                onChange={() => toggleArrayItem(type, tableTypes, setTableTypes)}
                className="form-checkbox h-4 w-4 text-snookerGreen rounded border-gray-600 bg-black/50 focus:ring-snookerGreen focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Amenities</label>
        <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar">
          {COMMON_AMENITIES.map(amenity => (
            <label key={amenity} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => toggleArrayItem(amenity, amenities, setAmenities)}
                className="form-checkbox h-4 w-4 text-snookerGreen rounded border-gray-600 bg-black/50 focus:ring-snookerGreen focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Price per Hour (₹)</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-snookerGreen"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-snookerGreen"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (<div className="flex flex-col gap-6 lg:gap-8">
    {/* Sticky App-like Search Bar */}
    <div className="sticky top-20 z-40 bg-black/90 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:top-24 lg:pt-0 border-b border-white/5 lg:border-none shadow-sm">
      <div className="relative max-w-2xl mx-auto lg:mx-0 w-full">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for clubs, areas, or tables..."
          className="w-full bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 py-3 text-base text-white focus:outline-none focus:border-snookerGreen focus:ring-1 focus:ring-snookerGreen transition-all placeholder:text-gray-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-4 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex items-center justify-between transition-colors"
                onClick={() => router.push(`/club/${sug.id}`)}
              >
                <div>
                  <div className="text-base text-white font-bold">{sug.name}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {sug.location?.area}, {sug.location?.city}</div>
                </div>
                <div className="text-snookerGreen bg-snookerGreen/10 px-2 py-1 rounded text-xs font-medium">Book</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="lg:hidden flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="text-white font-medium">Found {clubs.length} clubs</div>
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center text-sm font-bold bg-snookerGreen text-white px-4 py-2 rounded-lg"
        >
          <Filter className="w-4 h-4 mr-2" /> Filters
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 bg-white/5 border border-white/10 p-5 rounded-xl h-fit sticky top-24">
        {filterSidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative w-4/5 max-w-sm h-full bg-[#111] p-6 overflow-y-auto transform transition-transform border-r border-white/10">
            {filterSidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0" ref={listRef}>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

        {clubs.length === 0 && !loading && (
          <div className="text-center py-24 bg-white/5 border border-white/10 rounded-xl mx-4 lg:mx-0">
            <div className="text-4xl mb-4">🎱</div>
            <h3 className="text-xl font-medium text-white mb-2">No clubs found</h3>
            <p className="text-gray-400">Try adjusting your filters or searching for something else.</p>
            <button
              onClick={() => {
                setSearch(''); setSortBy(''); setTableTypes([]); setMinPrice(''); setMaxPrice(''); setUserLocation(null); setAmenities([]); setOpenNow(false); setIs24_7(false);
              }}
              className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Virtualized Grid List */}
        {clubs.length > 0 && (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: '1.5rem',
                    paddingBottom: '1.5rem' // act as row gap
                  }}
                >
                  {row.map(club => {
                    const tableImages = club.tableCategories?.map((c: any) => c.image).filter(Boolean);

                    // Format Pricing nicely
                    const snookerTable = club.tableCategories?.find((t: any) => t.name.toLowerCase().includes('snooker'));
                    const poolTable = club.tableCategories?.find((t: any) => t.name.toLowerCase().includes('8 ball') || t.name.toLowerCase().includes('pool'));

                    return (
                      <div key={club.id} className="bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex flex-col h-full overflow-hidden shadow-lg">
                        <ImageCarousel cover={club.coverImage} interiors={club.interiorImages} tables={tableImages} />

                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white line-clamp-1" title={club.name}>{club.name}</h3>
                            <div className="flex items-center bg-black/50 px-2 py-1 rounded text-xs text-goldAccent font-medium whitespace-nowrap">
                              ⭐ {club.rating?.toFixed(1) || '0.0'}
                            </div>
                          </div>

                          <p className="text-gray-400 text-xs mb-3 line-clamp-2 min-h-[32px]">{club.fullAddress || club.description || 'A great place to play.'}</p>

                          {/* Pricing & Tables Area */}
                          <div className="bg-black/40 rounded-lg p-3 mb-4 space-y-2 border border-white/5">
                            {snookerTable ? (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-300">🎱 Snooker</span>
                                <span className="text-sm font-bold text-snookerGreen">₹{snookerTable.pricePerHour}/hr</span>
                              </div>
                            ) : null}
                            {poolTable ? (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-300">🔵 8-Ball Pool</span>
                                <span className="text-sm font-bold text-snookerGreen">₹{poolTable.pricePerHour}/hr</span>
                              </div>
                            ) : null}
                            {!snookerTable && !poolTable && (
                              <div className="text-xs text-gray-500">Pricing unavailable</div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 mb-4 space-y-1.5 flex flex-wrap gap-x-4 gap-y-2">
                            <p className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {club.openingTime} - {club.closingTime}</p>
                            {club.distance !== undefined && club.distance !== Infinity && (
                              <p className="text-snookerGreen font-medium flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {formatDistance(club.distance)}</p>
                            )}
                          </div>

                          <div className="mt-auto flex gap-2 pt-2">
                            <Link
                              href={`/club/${club.id}`}
                              className="flex-1 text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
                            >
                              Details
                            </Link>
                            <Link
                              href={`/club/${club.id}?booking=true`}
                              className="flex-1 text-center bg-snookerGreen hover:bg-snookerGreen/80 text-white text-xs font-bold py-2.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger & Loading Indicator */}
        <div ref={loadMoreRef} className="w-full h-10 mt-4 flex items-center justify-center">
          {loading && (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-snookerGreen"></div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  </div>
  );
}
