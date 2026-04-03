"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { AuthChangeEvent, AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';
import type {
  BodyProfile,
  StylePreferences,
  BudgetBrand,
  Recommendation,
} from '@repo/types/recommendations';
import { getSupabaseBrowserClient } from '../lib/supabase/client';
import { 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  Upload, 
  Check, 
  Sparkles,
  User as UserIcon,
  ShoppingBag,
  Heart,
  Share2,
  ArrowRight,
  Info
} from 'lucide-react';

// --- Types & Constants ---

type Step = 'profile' | 'photo' | 'preferences' | 'budget' | 'results';

const BODY_TYPES = [
  { id: 'slim', label: 'Slim', icon: '👤' },
  { id: 'athletic', label: 'Athletic', icon: '💪' },
  { id: 'regular', label: 'Regular', icon: '🧍' },
  { id: 'plus', label: 'Plus-size', icon: '🙌' },
];

const OCCASIONS = ['Casual', 'Office', 'Party', 'Gym', 'Ethnic'];
const SEASONS = ['Summer', 'Winter', 'Monsoon', 'All-season'];
const VIBES = ['Minimal', 'Bold', 'Streetwear', 'Classic', 'Trendy'];

const BUDGET_TIERS = [
  { id: 'low', label: 'Low', sub: 'Zudio-level', range: '₹299 – ₹999' },
  { id: 'medium', label: 'Medium', sub: 'Mid-market', range: '₹1,000 – ₹3,999' },
  { id: 'high', label: 'High', sub: 'Premium', range: '₹4,000 – ₹12,000' },
  { id: 'luxury', label: 'Luxury', sub: 'Designer', range: '₹12,000+' },
];

const BRANDS: Record<string, string[]> = {
  low: ['Zudio', 'Meesho', 'FBB', 'Reliance Trends'],
  medium: ['H&M', 'Uniqlo', 'Mango', 'Biba', 'W'],
  high: ['Zara', 'Tommy Hilfiger', 'Louis Philippe', 'Levi\'s', 'Massimo Dutti'],
  luxury: ['Armani', 'Calvin Klein', 'Burberry', 'Gucci'],
};

// --- Components ---

const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div 
        key={i} 
        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
          i < current ? 'bg-secondary' : 'bg-outline-variant/30'
        }`} 
      />
    ))}
  </div>
);

export default function App() {
  const supabase = getSupabaseBrowserClient();
  const [step, setStep] = useState<Step>('profile');
  const [profile, setProfile] = useState<BodyProfile>({
    height: '',
    weight: '',
    bodyType: 'regular',
    gender: 'Male',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<StylePreferences>({
    occasions: [],
    seasons: [],
    vibes: [],
  });
  const [budget, setBudget] = useState<BudgetBrand>({
    tier: 'medium',
    brands: [],
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }; error: AuthError | null }) => {
      if (!active) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      if (!active) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthLoading(false);
      setAuthActionLoading(false);
      setAuthError(null);

      if (!nextSession) {
        setStep("profile");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGoogleSignIn = async () => {
    setAuthActionLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
      setAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthActionLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      setAuthActionLoading(false);
      return;
    }

    setSession(null);
    setUser(null);
    setRecommendations([]);
    setSelectedRec(null);
    setShowTryOn(false);
    setStep("profile");
    setAuthActionLoading(false);
  };

  const handleNext = async () => {
    if (step === 'profile') setStep('photo');
    else if (step === 'photo') setStep('preferences');
    else if (step === 'preferences') setStep('budget');
    else if (step === 'budget') {
      setLoading(true);
      setStep('results');
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, preferences, budget }),
      });

      if (!res.ok) {
        throw new Error(`Recommendations request failed: ${res.status}`);
      }

      const recs: Recommendation[] = await res.json();
      setRecommendations(recs);
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'photo') setStep('profile');
    else if (step === 'preferences') setStep('photo');
    else if (step === 'budget') setStep('preferences');
    else if (step === 'results') setStep('budget');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePreference = (category: keyof StylePreferences, value: string) => {
    setPreferences((prev: StylePreferences) => {
      const current = prev[category] as string[];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  // --- Render Functions ---

  const renderAuthGate = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto text-center py-20 px-6"
    >
      <span className="font-label text-xs tracking-[0.3em] uppercase text-secondary font-bold mb-4 block">
        The Digital Atelier
      </span>
      <h1 className="text-6xl font-black tracking-tighter mb-6 leading-none">
        FitMe <br/> <span className="italic font-normal text-5xl">AI Stylist</span>
      </h1>
      <p className="text-on-surface-variant mb-12 text-lg leading-relaxed">
        Sign in with Supabase to save your styling profile and unlock personalized fashion curation.
      </p>
      {authError && (
        <p className="mb-6 text-sm text-red-400">{authError}</p>
      )}
      <button 
        onClick={handleGoogleSignIn}
        disabled={authActionLoading}
        className="cta-gradient text-on-primary px-12 py-5 rounded-full font-bold tracking-widest uppercase text-sm shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto disabled:opacity-60 disabled:hover:scale-100"
      >
        {authActionLoading ? 'Redirecting...' : 'Continue With Google'} <ArrowRight size={18} />
      </button>
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <StepIndicator current={1} total={5} />
      <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Body Profile</h2>
      <p className="text-on-surface-variant mb-12">Collection of physical attributes to determine your bespoke fit.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-2">
          <label className="font-label text-xs uppercase tracking-widest font-bold opacity-60">Height (cm)</label>
          <input 
            type="number" 
            placeholder="175"
            value={profile.height}
            onChange={e => setProfile({ ...profile, height: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-secondary outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="font-label text-xs uppercase tracking-widest font-bold opacity-60">Weight (kg)</label>
          <input 
            type="number" 
            placeholder="70"
            value={profile.weight}
            onChange={e => setProfile({ ...profile, weight: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-secondary outline-none transition-all"
          />
        </div>
      </div>

      <div className="mb-12">
        <label className="font-label text-xs uppercase tracking-widest font-bold opacity-60 mb-4 block">Physique</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BODY_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setProfile({ ...profile, bodyType: type.id })}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                profile.bodyType === type.id 
                ? 'border-secondary bg-secondary/5' 
                : 'border-transparent bg-surface-container-low hover:bg-surface-container-high'
              }`}
            >
              <span className="text-3xl">{type.icon}</span>
              <span className="font-bold text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Back</button>
        <button 
          onClick={handleNext}
          disabled={!profile.height || !profile.weight}
          className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs disabled:opacity-30"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );

  const renderPhoto = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <StepIndicator current={2} total={5} />
      <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Visual Capture</h2>
      <p className="text-on-surface-variant mb-12">Upload a portrait to enable virtual try-on. Your photo remains private.</p>

      <div className="aspect-[3/4] max-w-sm mx-auto bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center relative overflow-hidden mb-12 group">
        {photo ? (
          <>
            <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => setPhoto(null)}
                className="bg-white text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest"
              >
                Change Photo
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="text-on-surface-variant" size={32} />
            </div>
            <p className="font-bold mb-2">Take a Selfie or Upload</p>
            <p className="text-xs text-on-surface-variant mb-8">Portrait mode, good lighting preferred.</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 mx-auto"
            >
              <Upload size={16} /> Choose File
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Back</button>
        <button 
          onClick={handleNext}
          className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs"
        >
          {photo ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </motion.div>
  );

  const renderPreferences = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <StepIndicator current={3} total={5} />
      <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Style DNA</h2>
      <p className="text-on-surface-variant mb-12">Define your aesthetic preferences for better curation.</p>

      <div className="space-y-12 mb-12">
        <div>
          <label className="font-label text-xs uppercase tracking-widest font-bold opacity-60 mb-4 block">Occasions</label>
          <div className="flex flex-wrap gap-3">
            {OCCASIONS.map(v => (
              <button
                key={v}
                onClick={() => togglePreference('occasions', v)}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  preferences.occasions.includes(v)
                  ? 'bg-secondary text-on-primary shadow-lg'
                  : 'bg-surface-container-low hover:bg-surface-container-high'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest font-bold opacity-60 mb-4 block">Vibe</label>
          <div className="flex flex-wrap gap-3">
            {VIBES.map(v => (
              <button
                key={v}
                onClick={() => togglePreference('vibes', v)}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  preferences.vibes.includes(v)
                  ? 'bg-secondary text-on-primary shadow-lg'
                  : 'bg-surface-container-low hover:bg-surface-container-high'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Back</button>
        <button 
          onClick={handleNext}
          className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );

  const renderBudget = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <StepIndicator current={4} total={5} />
      <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Investment</h2>
      <p className="text-on-surface-variant mb-12">Define your budget horizon and preferred ateliers.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {BUDGET_TIERS.map(tier => (
          <button
            key={tier.id}
            onClick={() => setBudget({ ...budget, tier: tier.id, brands: [] })}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              budget.tier === tier.id 
              ? 'border-secondary bg-secondary/5' 
              : 'border-transparent bg-surface-container-low hover:bg-surface-container-high'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-black text-xl">{tier.label}</span>
              {budget.tier === tier.id && <Check size={20} className="text-secondary" />}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{tier.sub}</p>
            <p className="text-sm font-serif italic">{tier.range}</p>
          </button>
        ))}
      </div>

      <div className="mb-12">
        <label className="font-label text-xs uppercase tracking-widest font-bold opacity-60 mb-4 block">Preferred Brands</label>
        <div className="flex flex-wrap gap-3">
          {(BRANDS[budget.tier] ?? []).map(brand => (
            <button
              key={brand}
              onClick={() => {
                const brands = budget.brands.includes(brand)
                  ? budget.brands.filter((b: string) => b !== brand)
                  : [...budget.brands, brand];
                setBudget({ ...budget, brands });
              }}
              className={`px-5 py-2 rounded-lg border transition-all text-sm font-bold ${
                budget.brands.includes(brand)
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant/30 hover:border-primary'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Back</button>
        <button 
          onClick={handleNext}
          className="cta-gradient text-on-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl"
        >
          Generate Recommendations
        </button>
      </div>
    </motion.div>
  );

  const renderResults = () => (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div>
          <span className="font-label text-xs tracking-[0.3em] uppercase text-secondary font-bold mb-4 block">Curation Complete</span>
          <h2 className="text-6xl font-black tracking-tighter italic">Curated For You.</h2>
        </div>
        <p className="text-on-surface-variant max-w-sm border-l border-outline-variant pl-6 text-sm leading-relaxed">
          Our neural network has analyzed your profile and historical preferences to assemble this morning's sartorial selection.
        </p>
      </div>

      {loading ? (
        <div className="py-40 text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Sparkles size={48} className="text-secondary" />
          </motion.div>
          <p className="font-serif italic text-2xl">Crafting your bespoke wardrobe...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {recommendations.map(rec => (
            <motion.div 
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
              onClick={() => setSelectedRec(rec)}
            >
              <div className="aspect-[3/4] bg-surface-container-low rounded-3xl overflow-hidden mb-6 relative">
                <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-6 right-6 glass-panel px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  {rec.matchScore}% Match
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <button className="w-full bg-white text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-2xl">
                    View Details
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-xl mb-1">{rec.name}</h3>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">{rec.brand}</p>
                </div>
                <span className="font-serif italic text-lg">{rec.price}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRec && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRec(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={e => e.stopPropagation()}
            >
              <div className="md:w-1/2 aspect-[3/4] relative">
                {showTryOn && photo ? (
                  <div className="relative w-full h-full">
                    <img src={photo} alt="User" className="w-full h-full object-cover" />
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={selectedRec.imageUrl} 
                      alt="Overlay" 
                      className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2/3 h-1/2 object-contain mix-blend-multiply opacity-80"
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      AI Virtual Overlay
                    </div>
                  </div>
                ) : (
                  <img src={selectedRec.imageUrl} alt={selectedRec.name} className="w-full h-full object-cover" />
                )}
                
                {photo && (
                  <button 
                    onClick={() => setShowTryOn(!showTryOn)}
                    className="absolute top-6 left-6 bg-white/90 backdrop-blur px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"
                  >
                    <Sparkles size={14} /> {showTryOn ? 'Show Original' : 'Try On Me'}
                  </button>
                )}
              </div>
              <div className="md:w-1/2 p-12 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-secondary font-bold text-xs uppercase tracking-widest mb-2 block">{selectedRec.brand}</span>
                      <h2 className="text-4xl font-black tracking-tighter leading-none">{selectedRec.name}</h2>
                    </div>
                    <span className="font-serif italic text-2xl">{selectedRec.price}</span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed mb-8">
                    {selectedRec.description}
                  </p>
                  <div className="bg-surface-container-low p-6 rounded-2xl mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Info size={16} className="text-secondary" />
                      <span className="font-bold text-xs uppercase tracking-widest">Stylist Note</span>
                    </div>
                    <p className="text-sm italic opacity-80">
                      "This piece's architectural cut perfectly balances your {profile.bodyType} physique, while the tone aligns with your {preferences.vibes[0] || 'minimalist'} preference."
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <button className="cta-gradient text-on-primary w-full py-5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3">
                    <ShoppingBag size={18} /> Purchase Item
                  </button>
                  <div className="flex gap-4">
                    <button className="flex-1 bg-surface-container-high py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                      <Heart size={14} /> Save
                    </button>
                    <button className="flex-1 bg-surface-container-high py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 glass-panel border-b border-outline-variant/10">
        <div className="max-w-[1920px] mx-auto px-12 py-6 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <a href="/" className="font-serif text-2xl font-bold italic tracking-tighter">FitMe</a>
            <div className="hidden md:flex gap-8 items-center">
              <button onClick={() => setStep('profile')} className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Explore</button>
              <button className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Wardrobe</button>
              <button className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">AI Stylist</button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="opacity-60 hover:opacity-100 transition-opacity"><Heart size={20} /></button>
            {user ? (
              <button
                onClick={handleSignOut}
                disabled={authActionLoading}
                className="rounded-full border border-outline-variant/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest opacity-80 hover:opacity-100 disabled:opacity-50"
              >
                {authActionLoading ? "Working..." : `Sign Out ${user.email ?? ""}`}
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={authActionLoading}
                className="opacity-60 hover:opacity-100 transition-opacity disabled:opacity-40"
              >
                <UserIcon size={20} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32">
        {authLoading ? (
          <div className="py-40 text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Sparkles size={48} className="text-secondary" />
            </motion.div>
            <p className="font-serif italic text-2xl">Checking your session...</p>
          </div>
        ) : !session ? (
          renderAuthGate()
        ) : (
          <AnimatePresence mode="wait">
            {step === 'profile' && renderProfile()}
            {step === 'photo' && renderPhoto()}
            {step === 'preferences' && renderPreferences()}
            {step === 'budget' && renderBudget()}
            {step === 'results' && renderResults()}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-16 px-12 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <span className="font-serif text-lg italic">FitMe AI</span>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 opacity-40">© 2024 The Digital Atelier. All Rights Reserved.</p>
          </div>
          <div className="flex gap-12">
            <a href="#" className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100">Privacy</a>
            <a href="#" className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100">Terms</a>
            <a href="#" className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100">Contact</a>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      {step === 'results' && (
        <button 
          onClick={() => setStep('profile')}
          className="fixed bottom-12 right-12 bg-primary text-on-primary w-16 h-16 rounded-full shadow-2xl flex items-center justify-center group hover:bg-secondary transition-all z-50"
        >
          <Sparkles className="group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
}
