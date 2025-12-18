import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Search, 
  Database, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Building2,
  Filter,
  Share2
} from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/auth?mode=signup");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-stone-900" />
            <span className="font-semibold text-lg tracking-tight">BrokerLog</span>
          </div>
          <Button 
            onClick={handleSignUp}
            className="bg-stone-900 hover:bg-stone-800 text-white px-6"
          >
            Sign Up Free
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background cadastral map - left side */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/2 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23faf8f5'/%3E%3C!-- Grid lines --%3E%3Cg stroke='%23a8a29e' stroke-width='0.3'%3E%3Cline x1='0' y1='50' x2='600' y2='50'/%3E%3Cline x1='0' y1='100' x2='600' y2='100'/%3E%3Cline x1='0' y1='150' x2='600' y2='150'/%3E%3Cline x1='0' y1='200' x2='600' y2='200'/%3E%3Cline x1='0' y1='250' x2='600' y2='250'/%3E%3Cline x1='0' y1='300' x2='600' y2='300'/%3E%3Cline x1='0' y1='350' x2='600' y2='350'/%3E%3Cline x1='0' y1='400' x2='600' y2='400'/%3E%3Cline x1='0' y1='450' x2='600' y2='450'/%3E%3Cline x1='0' y1='500' x2='600' y2='500'/%3E%3Cline x1='0' y1='550' x2='600' y2='550'/%3E%3Cline x1='50' y1='0' x2='50' y2='600'/%3E%3Cline x1='100' y1='0' x2='100' y2='600'/%3E%3Cline x1='150' y1='0' x2='150' y2='600'/%3E%3Cline x1='200' y1='0' x2='200' y2='600'/%3E%3Cline x1='250' y1='0' x2='250' y2='600'/%3E%3Cline x1='300' y1='0' x2='300' y2='600'/%3E%3Cline x1='350' y1='0' x2='350' y2='600'/%3E%3Cline x1='400' y1='0' x2='400' y2='600'/%3E%3Cline x1='450' y1='0' x2='450' y2='600'/%3E%3Cline x1='500' y1='0' x2='500' y2='600'/%3E%3Cline x1='550' y1='0' x2='550' y2='600'/%3E%3C/g%3E%3C!-- Grid coordinates --%3E%3Cg font-size='7' fill='%2378716c' font-family='monospace'%3E%3Ctext x='48' y='595'%3E10.00%3C/text%3E%3Ctext x='148' y='595'%3E12.00%3C/text%3E%3Ctext x='248' y='595'%3E14.00%3C/text%3E%3Ctext x='348' y='595'%3E16.00%3C/text%3E%3Ctext x='448' y='595'%3E18.00%3C/text%3E%3Ctext x='548' y='595'%3E20.00%3C/text%3E%3Ctext x='5' y='53'%3E77.2%3C/text%3E%3Ctext x='5' y='153'%3E77.0%3C/text%3E%3Ctext x='5' y='253'%3E76.8%3C/text%3E%3Ctext x='5' y='353'%3E76.6%3C/text%3E%3Ctext x='5' y='453'%3E76.4%3C/text%3E%3Ctext x='5' y='553'%3E76.2%3C/text%3E%3C/g%3E%3C!-- Main roads --%3E%3Cpath d='M30 80 Q100 90 180 70 Q280 50 350 80 Q420 110 500 90 L520 100 Q450 130 380 110 Q300 80 220 100 Q140 120 60 100 Z' fill='none' stroke='%2357534e' stroke-width='2'/%3E%3Cpath d='M80 200 L80 400 Q90 450 150 480 L300 520 Q380 540 450 500 L500 450' fill='none' stroke='%2357534e' stroke-width='2'/%3E%3Cpath d='M200 150 L220 300 L180 400 L200 500' fill='none' stroke='%2357534e' stroke-width='1.5'/%3E%3Cpath d='M350 120 L380 250 Q400 350 350 450 L320 550' fill='none' stroke='%2357534e' stroke-width='1.5'/%3E%3C!-- Plot boundaries --%3E%3Cg fill='none' stroke='%2378716c' stroke-width='1'%3E%3Cpath d='M100 100 L170 95 L180 150 L160 180 L100 170 Z'/%3E%3Cpath d='M180 95 L260 85 L280 140 L270 190 L180 180 L180 150 Z'/%3E%3Cpath d='M270 85 L340 100 L350 180 L280 190 L280 140 Z'/%3E%3Cpath d='M100 180 L160 190 L150 270 L90 260 Z'/%3E%3Cpath d='M165 195 L270 200 L260 290 L150 280 Z'/%3E%3Cpath d='M280 200 L360 190 L380 280 L270 300 Z'/%3E%3Cpath d='M90 270 L145 285 L130 380 L80 360 Z'/%3E%3Cpath d='M155 290 L255 300 L240 400 L140 390 Z'/%3E%3Cpath d='M265 305 L375 290 L390 390 L250 410 Z'/%3E%3Cpath d='M395 200 L480 180 L500 270 L420 300 Z'/%3E%3Cpath d='M400 310 L490 280 L520 380 L430 420 Z'/%3E%3Cpath d='M100 400 L230 420 L210 520 L90 490 Z'/%3E%3Cpath d='M240 425 L380 400 L400 500 L250 530 Z'/%3E%3Cpath d='M390 410 L500 390 L530 490 L420 520 Z'/%3E%3C/g%3E%3C!-- Highlighted plots (darker) --%3E%3Cg fill='none' stroke='%2344403c' stroke-width='2'%3E%3Cpath d='M240 310 L340 295 L360 370 L250 390 Z'/%3E%3Cpath d='M250 400 L355 380 L375 460 L260 485 Z'/%3E%3Cpath d='M365 385 L450 360 L480 440 L390 470 Z'/%3E%3C/g%3E%3C!-- Plot numbers --%3E%3Cg font-size='12' fill='%2357534e' font-family='serif' font-weight='bold'%3E%3Ctext x='125' y='145'%3E1%3C/text%3E%3Ctext x='215' y='140'%3E2%3C/text%3E%3Ctext x='300' y='145'%3E3%3C/text%3E%3Ctext x='115' y='230'%3E4%3C/text%3E%3Ctext x='200' y='250'%3E5%3C/text%3E%3Ctext x='310' y='250'%3E6%3C/text%3E%3Ctext x='100' y='330'%3E7%3C/text%3E%3Ctext x='185' y='350'%3E8%3C/text%3E%3Ctext x='310' y='355'%3E9%3C/text%3E%3Ctext x='435' y='245'%3E10%3C/text%3E%3Ctext x='450' y='355'%3E11%3C/text%3E%3Ctext x='150' y='470'%3E12%3C/text%3E%3Ctext x='300' y='470'%3E13%3C/text%3E%3Ctext x='450' y='460'%3E14%3C/text%3E%3C/g%3E%3C!-- Area labels --%3E%3Cg font-size='6' fill='%2378716c' font-family='sans-serif'%3E%3Ctext x='110' y='155'%3E0.55%3C/text%3E%3Ctext x='200' y='150'%3E0.72%3C/text%3E%3Ctext x='285' y='155'%3E0.48%3C/text%3E%3Ctext x='100' y='240'%3E0.61%3C/text%3E%3Ctext x='185' y='260'%3E0.89%3C/text%3E%3Ctext x='295' y='260'%3E0.95%3C/text%3E%3Ctext x='85' y='340'%3E0.52%3C/text%3E%3Ctext x='170' y='360'%3E1.12%3C/text%3E%3Ctext x='295' y='365'%3E1.35%3C/text%3E%3Ctext x='420' y='255'%3E0.78%3C/text%3E%3Ctext x='435' y='365'%3E0.92%3C/text%3E%3Ctext x='135' y='480'%3E1.45%3C/text%3E%3Ctext x='285' y='480'%3E1.68%3C/text%3E%3Ctext x='435' y='470'%3E1.21%3C/text%3E%3C/g%3E%3C!-- Place names --%3E%3Cg font-size='8' fill='%2357534e' font-family='serif' font-style='italic'%3E%3Ctext x='60' y='65'%3EPlots%3C/text%3E%3Ctext x='420' y='150'%3ESector 7%3C/text%3E%3Ctext x='130' y='550'%3EMain Road%3C/text%3E%3C/g%3E%3C!-- Compass rose --%3E%3Cg transform='translate(530,80)'%3E%3Ccircle cx='0' cy='0' r='30' fill='none' stroke='%2378716c' stroke-width='1'/%3E%3Ccircle cx='0' cy='0' r='25' fill='none' stroke='%2378716c' stroke-width='0.5'/%3E%3Cpath d='M0 -28 L4 0 L0 -8 L-4 0 Z' fill='%2357534e'/%3E%3Cpath d='M0 28 L4 0 L0 8 L-4 0 Z' fill='%23a8a29e'/%3E%3Cpath d='M28 0 L0 4 L8 0 L0 -4 Z' fill='%23a8a29e'/%3E%3Cpath d='M-28 0 L0 4 L-8 0 L0 -4 Z' fill='%23a8a29e'/%3E%3Ctext x='0' y='-35' font-size='10' fill='%2357534e' text-anchor='middle' font-weight='bold'%3EN%3C/text%3E%3Ctext x='0' y='42' font-size='8' fill='%2378716c' text-anchor='middle'%3ES%3C/text%3E%3Ctext x='38' y='4' font-size='8' fill='%2378716c' text-anchor='middle'%3EE%3C/text%3E%3Ctext x='-38' y='4' font-size='8' fill='%2378716c' text-anchor='middle'%3EW%3C/text%3E%3C/g%3E%3C!-- Scale bar --%3E%3Cg transform='translate(40,560)'%3E%3Crect x='0' y='0' width='20' height='6' fill='%2357534e'/%3E%3Crect x='20' y='0' width='20' height='6' fill='white' stroke='%2357534e' stroke-width='0.5'/%3E%3Crect x='40' y='0' width='20' height='6' fill='%2357534e'/%3E%3Ctext x='0' y='15' font-size='6' fill='%2357534e'%3E0%3C/text%3E%3Ctext x='60' y='15' font-size='6' fill='%2357534e'%3E100m%3C/text%3E%3Ctext x='0' y='-5' font-size='5' fill='%2378716c'%3EF-18 001 Survey Map%3C/text%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '600px 600px',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
          }}
        />
        
        {/* Background cadastral map - right side */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23faf8f5'/%3E%3C!-- Grid lines --%3E%3Cg stroke='%23a8a29e' stroke-width='0.3'%3E%3Cline x1='0' y1='50' x2='600' y2='50'/%3E%3Cline x1='0' y1='100' x2='600' y2='100'/%3E%3Cline x1='0' y1='150' x2='600' y2='150'/%3E%3Cline x1='0' y1='200' x2='600' y2='200'/%3E%3Cline x1='0' y1='250' x2='600' y2='250'/%3E%3Cline x1='0' y1='300' x2='600' y2='300'/%3E%3Cline x1='0' y1='350' x2='600' y2='350'/%3E%3Cline x1='0' y1='400' x2='600' y2='400'/%3E%3Cline x1='0' y1='450' x2='600' y2='450'/%3E%3Cline x1='0' y1='500' x2='600' y2='500'/%3E%3Cline x1='0' y1='550' x2='600' y2='550'/%3E%3Cline x1='50' y1='0' x2='50' y2='600'/%3E%3Cline x1='100' y1='0' x2='100' y2='600'/%3E%3Cline x1='150' y1='0' x2='150' y2='600'/%3E%3Cline x1='200' y1='0' x2='200' y2='600'/%3E%3Cline x1='250' y1='0' x2='250' y2='600'/%3E%3Cline x1='300' y1='0' x2='300' y2='600'/%3E%3Cline x1='350' y1='0' x2='350' y2='600'/%3E%3Cline x1='400' y1='0' x2='400' y2='600'/%3E%3Cline x1='450' y1='0' x2='450' y2='600'/%3E%3Cline x1='500' y1='0' x2='500' y2='600'/%3E%3Cline x1='550' y1='0' x2='550' y2='600'/%3E%3C/g%3E%3C!-- Grid coordinates --%3E%3Cg font-size='7' fill='%2378716c' font-family='monospace'%3E%3Ctext x='48' y='595'%3E10.00%3C/text%3E%3Ctext x='148' y='595'%3E12.00%3C/text%3E%3Ctext x='248' y='595'%3E14.00%3C/text%3E%3Ctext x='348' y='595'%3E16.00%3C/text%3E%3Ctext x='448' y='595'%3E18.00%3C/text%3E%3Ctext x='548' y='595'%3E20.00%3C/text%3E%3Ctext x='5' y='53'%3E77.2%3C/text%3E%3Ctext x='5' y='153'%3E77.0%3C/text%3E%3Ctext x='5' y='253'%3E76.8%3C/text%3E%3Ctext x='5' y='353'%3E76.6%3C/text%3E%3Ctext x='5' y='453'%3E76.4%3C/text%3E%3Ctext x='5' y='553'%3E76.2%3C/text%3E%3C/g%3E%3C!-- Main roads --%3E%3Cpath d='M30 80 Q100 90 180 70 Q280 50 350 80 Q420 110 500 90 L520 100 Q450 130 380 110 Q300 80 220 100 Q140 120 60 100 Z' fill='none' stroke='%2357534e' stroke-width='2'/%3E%3Cpath d='M80 200 L80 400 Q90 450 150 480 L300 520 Q380 540 450 500 L500 450' fill='none' stroke='%2357534e' stroke-width='2'/%3E%3Cpath d='M200 150 L220 300 L180 400 L200 500' fill='none' stroke='%2357534e' stroke-width='1.5'/%3E%3Cpath d='M350 120 L380 250 Q400 350 350 450 L320 550' fill='none' stroke='%2357534e' stroke-width='1.5'/%3E%3C!-- Plot boundaries --%3E%3Cg fill='none' stroke='%2378716c' stroke-width='1'%3E%3Cpath d='M100 100 L170 95 L180 150 L160 180 L100 170 Z'/%3E%3Cpath d='M180 95 L260 85 L280 140 L270 190 L180 180 L180 150 Z'/%3E%3Cpath d='M270 85 L340 100 L350 180 L280 190 L280 140 Z'/%3E%3Cpath d='M100 180 L160 190 L150 270 L90 260 Z'/%3E%3Cpath d='M165 195 L270 200 L260 290 L150 280 Z'/%3E%3Cpath d='M280 200 L360 190 L380 280 L270 300 Z'/%3E%3Cpath d='M90 270 L145 285 L130 380 L80 360 Z'/%3E%3Cpath d='M155 290 L255 300 L240 400 L140 390 Z'/%3E%3Cpath d='M265 305 L375 290 L390 390 L250 410 Z'/%3E%3Cpath d='M395 200 L480 180 L500 270 L420 300 Z'/%3E%3Cpath d='M400 310 L490 280 L520 380 L430 420 Z'/%3E%3Cpath d='M100 400 L230 420 L210 520 L90 490 Z'/%3E%3Cpath d='M240 425 L380 400 L400 500 L250 530 Z'/%3E%3Cpath d='M390 410 L500 390 L530 490 L420 520 Z'/%3E%3C/g%3E%3C!-- Highlighted plots (darker) --%3E%3Cg fill='none' stroke='%2344403c' stroke-width='2'%3E%3Cpath d='M240 310 L340 295 L360 370 L250 390 Z'/%3E%3Cpath d='M250 400 L355 380 L375 460 L260 485 Z'/%3E%3Cpath d='M365 385 L450 360 L480 440 L390 470 Z'/%3E%3C/g%3E%3C!-- Plot numbers --%3E%3Cg font-size='12' fill='%2357534e' font-family='serif' font-weight='bold'%3E%3Ctext x='125' y='145'%3E1%3C/text%3E%3Ctext x='215' y='140'%3E2%3C/text%3E%3Ctext x='300' y='145'%3E3%3C/text%3E%3Ctext x='115' y='230'%3E4%3C/text%3E%3Ctext x='200' y='250'%3E5%3C/text%3E%3Ctext x='310' y='250'%3E6%3C/text%3E%3Ctext x='100' y='330'%3E7%3C/text%3E%3Ctext x='185' y='350'%3E8%3C/text%3E%3Ctext x='310' y='355'%3E9%3C/text%3E%3Ctext x='435' y='245'%3E10%3C/text%3E%3Ctext x='450' y='355'%3E11%3C/text%3E%3Ctext x='150' y='470'%3E12%3C/text%3E%3Ctext x='300' y='470'%3E13%3C/text%3E%3Ctext x='450' y='460'%3E14%3C/text%3E%3C/g%3E%3C!-- Area labels --%3E%3Cg font-size='6' fill='%2378716c' font-family='sans-serif'%3E%3Ctext x='110' y='155'%3E0.55%3C/text%3E%3Ctext x='200' y='150'%3E0.72%3C/text%3E%3Ctext x='285' y='155'%3E0.48%3C/text%3E%3Ctext x='100' y='240'%3E0.61%3C/text%3E%3Ctext x='185' y='260'%3E0.89%3C/text%3E%3Ctext x='295' y='260'%3E0.95%3C/text%3E%3Ctext x='85' y='340'%3E0.52%3C/text%3E%3Ctext x='170' y='360'%3E1.12%3C/text%3E%3Ctext x='295' y='365'%3E1.35%3C/text%3E%3Ctext x='420' y='255'%3E0.78%3C/text%3E%3Ctext x='435' y='365'%3E0.92%3C/text%3E%3Ctext x='135' y='480'%3E1.45%3C/text%3E%3Ctext x='285' y='480'%3E1.68%3C/text%3E%3Ctext x='435' y='470'%3E1.21%3C/text%3E%3C/g%3E%3C!-- Place names --%3E%3Cg font-size='8' fill='%2357534e' font-family='serif' font-style='italic'%3E%3Ctext x='60' y='65'%3EPlots%3C/text%3E%3Ctext x='420' y='150'%3ESector 7%3C/text%3E%3Ctext x='130' y='550'%3EMain Road%3C/text%3E%3C/g%3E%3C!-- Compass rose --%3E%3Cg transform='translate(530,80)'%3E%3Ccircle cx='0' cy='0' r='30' fill='none' stroke='%2378716c' stroke-width='1'/%3E%3Ccircle cx='0' cy='0' r='25' fill='none' stroke='%2378716c' stroke-width='0.5'/%3E%3Cpath d='M0 -28 L4 0 L0 -8 L-4 0 Z' fill='%2357534e'/%3E%3Cpath d='M0 28 L4 0 L0 8 L-4 0 Z' fill='%23a8a29e'/%3E%3Cpath d='M28 0 L0 4 L8 0 L0 -4 Z' fill='%23a8a29e'/%3E%3Cpath d='M-28 0 L0 4 L-8 0 L0 -4 Z' fill='%23a8a29e'/%3E%3Ctext x='0' y='-35' font-size='10' fill='%2357534e' text-anchor='middle' font-weight='bold'%3EN%3C/text%3E%3Ctext x='0' y='42' font-size='8' fill='%2378716c' text-anchor='middle'%3ES%3C/text%3E%3Ctext x='38' y='4' font-size='8' fill='%2378716c' text-anchor='middle'%3EE%3C/text%3E%3Ctext x='-38' y='4' font-size='8' fill='%2378716c' text-anchor='middle'%3EW%3C/text%3E%3C/g%3E%3C!-- Scale bar --%3E%3Cg transform='translate(40,560)'%3E%3Crect x='0' y='0' width='20' height='6' fill='%2357534e'/%3E%3Crect x='20' y='0' width='20' height='6' fill='white' stroke='%2357534e' stroke-width='0.5'/%3E%3Crect x='40' y='0' width='20' height='6' fill='%2357534e'/%3E%3Ctext x='0' y='15' font-size='6' fill='%2357534e'%3E0%3C/text%3E%3Ctext x='60' y='15' font-size='6' fill='%2357534e'%3E100m%3C/text%3E%3Ctext x='0' y='-5' font-size='5' fill='%2378716c'%3EF-18 001 Survey Map%3C/text%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '600px 600px',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-4">
            For serious real estate businessmen
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Your brain is for closing deals.
            <br />
            <span className="text-stone-400">Not remembering plots.</span>
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            A structured property inventory for real estate mediators who run their business systematically.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={handleSignUp}
              size="lg"
              className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-6 text-lg gap-2"
            >
              Start Free <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Built for a specific type of broker
            </h2>
            <p className="text-stone-600 text-lg">Not everyone. And that's intentional.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* This is for you */}
            <div className="bg-stone-50 rounded-2xl p-8 border border-stone-200">
              <h3 className="text-lg font-semibold text-green-700 mb-6 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                For you if you
              </h3>
              <ul className="space-y-4 text-stone-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Are a respected broker and deal in multiple property types</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">•</span>
                  <span>You value structured records over scattered thoughts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">•</span>
                  <span>You understand the value of having your property inventory in your pocket 24 × 7</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">•</span>
                  <span>You share property info on WhatsApp regularly</span>
                </li>
              </ul>
            </div>

            {/* This is NOT for you */}
            <div className="bg-white rounded-2xl p-8 border border-stone-200">
              <h3 className="text-lg font-semibold text-stone-400 mb-6">
                Not for you if you
              </h3>
              <ul className="space-y-4 text-stone-500">
                <li className="flex items-start gap-3">
                  <span className="mt-1">•</span>
                  <span>Prefer notebook and mental memory</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1">•</span>
                  <span>Are afraid of adapting to change and pursuing growth</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1">•</span>
                  <span>Are a small broker, 2-3 properties</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            The real problem
          </h2>
          <p className="text-xl text-stone-600 leading-relaxed mb-4">
            Client calls. Asks about "that plot near the highway."
          </p>
          <p className="text-lg text-stone-500">
            You hesitate. You scroll. You delay. <span className="text-red-600 font-semibold">Deal lost.</span>
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-6 bg-stone-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              What you're using today
            </h2>
            <p className="text-stone-500">None of these were built for your work.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* WhatsApp */}
            <div className="bg-white rounded-xl p-6 border border-stone-200">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="font-semibold text-stone-900 mb-3">WhatsApp Chats</h3>
              <ul className="text-sm text-stone-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Can't filter by type or area</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Photos scattered across chats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>No rate linked to images</span>
                </li>
              </ul>
            </div>

            {/* Google Sheets */}
            <div className="bg-white rounded-xl p-6 border border-stone-200">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-stone-900 mb-3">Google Sheets</h3>
              <ul className="text-sm text-stone-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Terrible on mobile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Can't attach photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Slow to navigate</span>
                </li>
              </ul>
            </div>

            {/* Notebooks */}
            <div className="bg-white rounded-xl p-6 border border-stone-200">
              <div className="text-3xl mb-4">📓</div>
              <h3 className="font-semibold text-stone-900 mb-3">Notebooks</h3>
              <ul className="text-sm text-stone-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Not portable on site visits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Can't search or sort</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>How many can you carry?</span>
                </li>
              </ul>
            </div>

            {/* Mind */}
            <div className="bg-white rounded-xl p-6 border border-stone-200">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-stone-900 mb-3">Your Memory</h3>
              <ul className="text-sm text-stone-500 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Forgets under pressure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Mixes up rates & sizes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>Not reliable at 50+ properties</span>
                </li>
              </ul>
            </div>
          </div>

          {/* BrokerLog comparison */}
          <div className="bg-stone-900 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-8 w-8" />
              <h3 className="text-xl font-semibold">BrokerLog</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-stone-300">Filter by type, search by area</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-stone-300">Photos linked to properties</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-stone-300">Built for mobile</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-stone-300">Always in your pocket</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution / Features */}
      <section className="py-20 px-6 bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              What BrokerLog does
            </h2>
            <p className="text-stone-400 text-lg">Simple. Structured. Fast.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Database className="h-8 w-8" />}
              title="Structured Inventory"
              description="Every property stored with address, rate, size, type, photos, and notes. No more mental gymnastics."
            />
            <FeatureCard 
              icon={<Filter className="h-8 w-8" />}
              title="Instant Filtering"
              description="Find any property in seconds. Filter by type, search by location. Pull up details while on call."
            />
            <FeatureCard 
              icon={<Share2 className="h-8 w-8" />}
              title="One-Tap Sharing"
              description="Share formatted property details to WhatsApp instantly. Professional. Clean. With your contact."
            />
            <FeatureCard 
              icon={<Smartphone className="h-8 w-8" />}
              title="Phone-First Design"
              description="Built for mobile from day one. Works offline. Fast. No learning curve."
            />
            <FeatureCard 
              icon={<Search className="h-8 w-8" />}
              title="Quick Search"
              description="Type any keyword. Address, area, landmark. Results appear as you type."
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8" />}
              title="Zero Setup"
              description="Sign up. Add property. Done. No configuration. No tutorials needed."
            />
          </div>
        </div>
      </section>

      {/* Differentiation */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Not another real estate app
            </h2>
          </div>

          <div className="space-y-6">
            <DiffRow 
              label="Other apps"
              value="Built for agencies, teams, marketing"
              highlight={false}
            />
            <DiffRow 
              label="BrokerLog"
              value="Built for individual brokers and mediators"
              highlight={true}
            />
            
            <div className="h-px bg-stone-200 my-8" />
            
            <DiffRow 
              label="Other apps"
              value="Desktop-first, mobile as afterthought"
              highlight={false}
            />
            <DiffRow 
              label="BrokerLog"
              value="Phone-first, because that's where you work"
              highlight={true}
            />
            
            <div className="h-px bg-stone-200 my-8" />
            
            <DiffRow 
              label="Other apps"
              value="Freemium with paywalls everywhere"
              highlight={false}
            />
            <DiffRow 
              label="BrokerLog"
              value="Start free. No card. No autopay."
              highlight={true}
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
            Honest product. No tricks.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-stone-600">
            <div>
              <p className="text-3xl font-bold text-stone-900 mb-2">Start Free</p>
              <p className="text-sm">No credit card. No autopay headache.</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-stone-900 mb-2">Private</p>
              <p className="text-sm">Your data stays yours. We don't sell leads.</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-stone-900 mb-2">Fast</p>
              <p className="text-sm">Built for speed. No bloat. No lag.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-stone-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Stop memorizing. Start closing.
          </h2>
          <p className="text-stone-400 text-lg mb-10">
            Your property inventory, structured and accessible in 30 seconds.
          </p>
          <Button 
            onClick={handleSignUp}
            size="lg"
            className="bg-white hover:bg-stone-100 text-stone-900 px-10 py-6 text-lg gap-2"
          >
            Create Free Account <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-sm text-stone-500 mt-4">
            Takes 10 seconds. No card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-stone-950 text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span className="font-medium text-stone-400">BrokerLog</span>
          </div>
          <p className="text-sm">
            Built for serious real estate businessmen.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="bg-stone-800/50 rounded-xl p-6 border border-stone-700">
    <div className="text-stone-400 mb-4">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-stone-400 text-sm leading-relaxed">{description}</p>
  </div>
);

// Differentiation Row Component
const DiffRow = ({ 
  label, 
  value, 
  highlight 
}: { 
  label: string; 
  value: string; 
  highlight: boolean;
}) => (
  <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 p-4 rounded-lg ${
    highlight ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
  }`}>
    <span className={`text-sm font-medium w-24 flex-shrink-0 ${
      highlight ? 'text-stone-400' : 'text-stone-400'
    }`}>
      {label}
    </span>
    <span className={highlight ? 'font-medium' : ''}>{value}</span>
  </div>
);

export default Landing;

