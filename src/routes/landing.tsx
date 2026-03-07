import { ArrowRight, Box, Layers, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex h-full flex-col px-4 py-12 lg:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-16 w-full">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center gap-6 text-center mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_15px_rgba(20,180,100,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            Internal System v2.0
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white lg:text-7xl max-w-4xl drop-shadow-sm">
            Streamline your <span className="text-primary bg-clip-text">Production</span> Workflows
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground leading-relaxed">
            Welcome to the AluGamma internal tool suite. Access calculators, DXF generators, and live
            live-previews for your sheet metal folding needs with perfectly optimized coordinate mappings.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
              <Link to="/sheet-metal">
                Start Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
              Documentation
            </Button>
          </div>
        </section>

        {/* Features Grids */}
        <section className="grid gap-6 md:grid-cols-3 mt-12">
          <FeatureCard 
            icon={<Layers className="h-6 w-6 text-sky-400" />}
            title="Auto-DXF Generation"
            description="Exports perfectly formatted, scale-accurate DXF geometry natively compatible with AutoCAD layers."
          />
          <FeatureCard 
            icon={<Box className="h-6 w-6 text-emerald-400" />}
            title="Live Canvas Previews"
            description="Visually see exactly where your flanges, cuts, and 45-degree relief corners map in real-time."
          />
          <FeatureCard 
            icon={<Zap className="h-6 w-6 text-amber-400" />}
            title="SOTA Build Tools"
            description="Built on makerjs for mathematically sound CAD coordinate geometry and boundary clipping."
          />
        </section>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-card/40 p-8 shadow-panel backdrop-blur hover:bg-card/60 transition-colors">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 border border-white/5 shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
