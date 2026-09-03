'use client';

import { 
  Utensils, 
  Plane, 
  Home, 
  Sparkles, 
  Receipt, 
  Coffee, 
  Users, 
  Wallet,
  ShoppingBag,
  Car
} from 'lucide-react';

export const ICON_MAP = {
  food: Utensils,
  '🍜': Utensils,
  '🍕': Utensils,
  '🍔': Utensils,
  trip: Plane,
  travel: Plane,
  '✈️': Plane,
  '🏖️': Plane,
  home: Home,
  household: Home,
  '🏠': Home,
  party: Sparkles,
  '🎉': Sparkles,
  '🎊': Sparkles,
  shopping: ShoppingBag,
  '🛍️': ShoppingBag,
  car: Car,
  '🚗': Car,
  other: Receipt,
  '🧾': Receipt,
};

export default function GroupIcon({ icon, size = 20, className = 'text-[#145C4B]' }) {
  if (typeof icon === 'string' && icon.startsWith('http')) {
    return (
      <img 
        src={icon} 
        alt="Group Icon" 
        style={{ width: size, height: size }} 
        className={`rounded-full object-cover ${className}`} 
      />
    );
  }
  const IconComponent = (icon && ICON_MAP[icon.toLowerCase ? icon.toLowerCase() : icon]) || Receipt;
  return <IconComponent size={size} className={className} />;
}
