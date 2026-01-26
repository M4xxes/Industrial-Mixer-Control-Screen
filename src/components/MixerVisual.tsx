import { Mixer, MotorStatus } from '../types';
import { cn } from '../utils/cn';

interface MixerVisualProps {
  mixer: Mixer;
  size?: 'small' | 'medium' | 'large';
}

export default function MixerVisual({ mixer, size = 'medium' }: MixerVisualProps) {
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
  };

  const getMotorColor = (status: MotorStatus) => {
    switch (status) {
      case 'Marche':
        return 'bg-green-500 animate-pulse';
      case 'Défaut':
        return 'bg-red-500';
      case 'Maintenance':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusOverlay = (status: Mixer['status']) => {
    switch (status) {
      case 'Marche':
        return 'bg-green-500/20';
      case 'Erreur':
        return 'bg-red-500/20';
      case 'Maintenance':
        return 'bg-orange-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  return (
    <div className={cn('relative rounded-lg overflow-hidden', sizeClasses[size])}>
      {/* Image de fond du malaxeur */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={cn('absolute inset-0', getStatusOverlay(mixer.status))} />
      </div>

      {/* Indicateurs de moteurs - Retirés pour enlever les spams sur les images */}
      {/* <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-2 py-1">
          <div className={cn('w-3 h-3 rounded-full', getMotorColor(mixer.motorArm))} />
        </div>
        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-2 py-1">
          <div className={cn('w-3 h-3 rounded-full', getMotorColor(mixer.motorScrew))} />
        </div>
      </div> */}

      {/* Badge de statut - Retiré pour enlever les spams sur les images */}
      {/* <div className="absolute top-4 right-4">
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold',
          mixer.status === 'Marche' && 'bg-green-500 text-white',
          mixer.status === 'Erreur' && 'bg-red-500 text-white',
          mixer.status === 'Maintenance' && 'bg-orange-500 text-white',
          mixer.status === 'Arrêt' && 'bg-gray-500 text-white'
        )}>
          {mixer.status}
        </span>
      </div> */}

      {/* Informations en bas - Retiré pour enlever le texte en noir sur les images */}
      {/* <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
        <div className="text-white text-sm font-medium">{mixer.name}</div>
        {mixer.recipe && (
          <div className="text-white/80 text-xs">
            {mixer.recipe.name} - Étape {mixer.currentStep}/{mixer.recipe.steps.length}
          </div>
        )}
      </div> */}
    </div>
  );
}

