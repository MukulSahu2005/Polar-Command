import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto text-cyan-600">
          <Compass className="w-7 h-7 animate-spin-slow" />
        </div>

        <div>
          <div className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-wider">
            HTTP 404 // VECTOR NOT FOUND
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Sector Telemetry Coordinates Lost</h1>
          <p className="text-xs text-slate-500 mt-2 font-mono leading-relaxed">
            The requested tactical radar quadrant or module route does not exist in the station directory.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="w-full font-mono text-xs flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Command Center
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;
