import { Compass, Home, KeyRound, Mail, ShieldCheck, Users, Zap } from "lucide-react";

type IconProps = {
  size?: number;
  className?: string;
  color?: string;
};

export function ShieldIcon({ size = 18, className, color }: IconProps) {
  return <ShieldCheck size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}

export function BoltIcon({ size = 18, className, color }: IconProps) {
  return <Zap size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}

export function UsersIcon({ size = 18, className, color }: IconProps) {
  return <Users size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}

export function CompassIcon({ size = 18, className, color }: IconProps) {
  return <Compass size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}

export function MailIcon({ size = 18, className, color }: IconProps) {
  return <Mail size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}

export function KeyIcon({ size = 18, className, color }: IconProps) {
  return <KeyRound size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}

export function HomeIcon({ size = 18, className, color }: IconProps) {
  return <Home size={size} className={className} color={color} strokeWidth={1.9} aria-hidden="true" />;
}
