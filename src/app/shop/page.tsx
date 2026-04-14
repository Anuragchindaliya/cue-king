import { Shop } from '@/components/Shop';
import { Location } from '@/components/Location';

export default function ShopPage() {
  return (
    <div className="pt-24 min-h-screen relative z-10 flex flex-col">
      <div className="flex-1">
        <Shop />
      </div>
      <Location />
      <footer className="py-8 text-center text-white/40 text-sm border-t border-white/10 mt-auto bg-black/80">
        <p>&copy; {new Date().getFullYear()} Cue King Snooker. All rights reserved.</p>
      </footer>
    </div>
  );
}
