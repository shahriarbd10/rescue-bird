import { Compass, KeyRound, Mail, ShieldCheck, Users, Zap } from "lucide-react";

type IconProps = {
  size?: number;
  className?: string;
};

export function ShieldIcon({ size = 18, className }: IconProps) {
  return <ShieldCheck size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}

export function BoltIcon({ size = 18, className }: IconProps) {
  return <Zap size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}

export function UsersIcon({ size = 18, className }: IconProps) {
  return <Users size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}

export function CompassIcon({ size = 18, className }: IconProps) {
  return <Compass size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}

export function MailIcon({ size = 18, className }: IconProps) {
  return <Mail size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}

export function KeyIcon({ size = 18, className }: IconProps) {
  return <KeyRound size={size} className={className} strokeWidth={1.9} aria-hidden="true" />;
}
