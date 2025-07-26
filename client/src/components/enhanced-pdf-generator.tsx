import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Star, User, Trophy, Target, Shield, QrCode, Crown, Lock, Video } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { Player, PlayerStats, ScoutingReport } from '@shared/schema';
import { getBrandingConfig } from '@/services/branding-service';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface EnhancedPDFGeneratorProps {
  player: Player & {
    stats?: PlayerStats;
    latestReport?: ScoutingReport;
    currentClub?: { name: string };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnhancedPDFGenerator({ player, open, onOpenChange }: EnhancedPDFGeneratorProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewGenerated, setPreviewGenerated] = useState(false);

  // Check if user can generate PDF (Admin or paid subscription)
  const canGeneratePDF = user?.role === 'admin' || user?.role === 'super_admin' || 
    user?.subscriptionTier === 'club_professional' || user?.subscriptionTier === 'enterprise';

  // Get organization data for branding
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations'],
    enabled: open
  });

  const userOrganization = organizations.find((org: any) => org.id === user?.organizationId);
  const brandingConfig = getBrandingConfig(user?.organizationId, userOrganization);

  const generateEnhancedPDF = async () => {
    if (!canGeneratePDF) {
      toast({
        title: "Access Denied",
        description: "PDF generation is available for Admin users and paid subscribers only.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Calculate player data
      const birthDate = new Date(player.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const fullName = `${player.firstName} ${player.lastName}`;
      
      // Page 1: Enhanced Cover Page
      // Header with branding
      pdf.setFillColor(0, 0, 0); // Black background
      pdf.rect(0, 0, pageWidth, 80, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(brandingConfig.companyName.toUpperCase(), 25, 35);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(brandingConfig.tagline || 'Professional Football Analysis', 25, 50);

      // Player name and key info
      let yPos = 120;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.text(fullName, 25, yPos);

      yPos += 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${player.position} | ${player.nationality}`, 25, yPos);

      // Key stats box
      yPos += 40;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(25, yPos, pageWidth - 50, 80, 'F');
      
      yPos += 20;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Information', 35, yPos);
      
      yPos += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Age: ${age}`, 35, yPos);
      pdf.text(`Market Value: €250,000 - €400,000`, 35, yPos + 8);
      pdf.text(`Current Club: ${player.currentClub?.name || 'Free Agent'}`, 35, yPos + 16);
      pdf.text('Overall Rating: 8.5/10', 35, yPos + 24);

      // Status badge
      yPos += 60;
      pdf.setFillColor(34, 197, 94); // Green
      pdf.rect(25, yPos, 80, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECOMMENDED', 35, yPos + 16);

      // Footer
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.text('Confidential Player Assessment Report', 25, pageHeight - 30);
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, 25, pageHeight - 20);

      // Page 2: Player Details & Attributes
      pdf.addPage();
      yPos = 30;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Player Details & Attributes', 25, yPos);

      yPos += 30;

      // Personal Information Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Personal Information', 25, yPos);
      
      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const personalDetails = [
        ['Full Name:', fullName],
        ['Date of Birth:', birthDate.toLocaleDateString('en-GB')],
        ['Age:', age.toString()],
        ['Nationality:', player.nationality],
        ['Position:', player.position],
        ['Current Club:', player.currentClub?.name || 'Free Agent'],
        ['Height:', player.height ? `${player.height} cm` : 'N/A'],
        ['Weight:', player.weight ? `${player.weight} kg` : 'N/A'],
        ['Preferred Foot:', 'Right'],
        ['Market Value:', '€250,000 - €400,000']
      ];

      personalDetails.forEach(([label, value], index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const xPos = col === 0 ? 25 : 120;
        const currentY = yPos + (row * 12);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, xPos, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, xPos + 35, currentY);
      });

      yPos += 80;

      // Technical Attributes
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technical Attributes', 25, yPos);
      
      yPos += 15;
      const technicalAttributes = [
        ['Ball Control', 85],
        ['Passing', 78],
        ['Shooting', 82],
        ['Dribbling', 88],
        ['Crossing', 75],
        ['Free Kicks', 80]
      ];

      technicalAttributes.forEach(([attribute, value], index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const xPos = col === 0 ? 25 : 120;
        const currentY = yPos + (row * 15);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${attribute}:`, xPos, currentY);
        
        // Rating bar background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(xPos + 35, currentY - 4, 50, 6, 'F');
        
        // Rating bar fill
        const fillWidth = (value / 100) * 50;
        pdf.setFillColor(254, 207, 13); // Jonquil Yellow
        pdf.rect(xPos + 35, currentY - 4, fillWidth, 6, 'F');
        
        pdf.setFontSize(9);
        pdf.text(value.toString(), xPos + 88, currentY);
      });

      yPos += 80;

      // Physical Attributes
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Physical Attributes', 25, yPos);
      
      yPos += 15;
      const physicalAttributes = [
        ['Speed', 86],
        ['Acceleration', 89],
        ['Stamina', 82],
        ['Strength', 78],
        ['Jumping', 75],
        ['Balance', 83]
      ];

      physicalAttributes.forEach(([attribute, value], index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const xPos = col === 0 ? 25 : 120;
        const currentY = yPos + (row * 15);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${attribute}:`, xPos, currentY);
        
        // Rating bar background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(xPos + 35, currentY - 4, 50, 6, 'F');
        
        // Rating bar fill
        const fillWidth = (value / 100) * 50;
        pdf.setFillColor(248, 168, 0); // Gold
        pdf.rect(xPos + 35, currentY - 4, fillWidth, 6, 'F');
        
        pdf.setFontSize(9);
        pdf.text(value.toString(), xPos + 88, currentY);
      });

      // Page 3: Analysis & Media Links
      pdf.addPage();
      yPos = 30;

      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analysis & Media Content', 25, yPos);

      yPos += 30;

      // Technical Analysis
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technical Analysis', 25, yPos);
      
      yPos += 15;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const technicalAnalysis = `${player.firstName} demonstrates exceptional technical ability with the ball. His dribbling skills are particularly noteworthy, showing great close control and the ability to beat defenders in tight spaces. His passing range is developing well, with good short to medium range distribution.`;
      const technicalLines = pdf.splitTextToSize(technicalAnalysis, 160);
      technicalLines.forEach((line: string, index: number) => {
        pdf.text(line, 25, yPos + (index * 5));
      });

      yPos += (technicalLines.length * 5) + 20;

      // Video Links with QR Codes
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Video Content & Documentation', 25, yPos);
      
      yPos += 20;
      
      const videoLinks = [
        {
          title: 'Season Highlights 2024',
          url: `https://platform.com/players/${player.id}/highlights`,
          description: 'Best goals and assists from current season'
        },
        {
          title: 'Skills Compilation',
          url: `https://platform.com/players/${player.id}/skills`,
          description: 'Technical skills and dribbling showcase'
        },
        {
          title: 'Full Player CV',
          url: `https://platform.com/players/${player.id}/cv`,
          description: 'Complete playing history document'
        }
      ];

      for (const video of videoLinks) {
        try {
          // Generate QR code for video URL
          const qrCodeDataURL = await QRCode.toDataURL(video.url, {
            width: 60,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          // Add QR code image
          pdf.addImage(qrCodeDataURL, 'PNG', 25, yPos - 5, 20, 20);

          // Add video details
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(video.title, 55, yPos + 5);
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(video.description, 55, yPos + 12);
          
          pdf.setTextColor(0, 0, 255);
          pdf.text(video.url, 55, yPos + 18);
          pdf.setTextColor(0, 0, 0);

          yPos += 35;
        } catch (error) {
          console.error('Error generating QR code:', error);
          // Continue without QR code
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(video.title, 25, yPos + 5);
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(video.description, 25, yPos + 12);
          pdf.text(video.url, 25, yPos + 18);
          
          yPos += 25;
        }
      }

      // Summary Section
      yPos += 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Executive Summary', 25, yPos);
      
      yPos += 15;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const summary = `${player.firstName} ${player.lastName} is a highly promising talent with exceptional technical skills and strong mental attributes. His pace and dribbling ability make him a constant threat in attacking situations. With continued development, particularly in defensive aspects, he has the potential to play at the highest levels of professional football.`;
      const summaryLines = pdf.splitTextToSize(summary, 160);
      summaryLines.forEach((line: string, index: number) => {
        pdf.text(line, 25, yPos + (index * 6));
      });

      // Footer with contact information
      const footerY = pageHeight - 80;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(25, footerY, 160, 60, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scout Assessment', 35, footerY + 15);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Assessed by: ${user?.username || 'Professional Scout'}`, 35, footerY + 25);
      pdf.text(`Organization: ${brandingConfig.companyName}`, 35, footerY + 33);
      pdf.text('Status: RECOMMENDED', 35, footerY + 41);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 35, footerY + 49);

      // Final contact footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      if (brandingConfig.contactInfo.address) {
        pdf.text(`Address: ${brandingConfig.contactInfo.address}`, 25, pageHeight - 30);
      }
      if (brandingConfig.contactInfo.email) {
        pdf.text(`Email: ${brandingConfig.contactInfo.email}`, 25, pageHeight - 22);
      }
      if (brandingConfig.contactInfo.website) {
        pdf.text(`Web: ${brandingConfig.contactInfo.website}`, 25, pageHeight - 14);
      }
      
      // Save the PDF
      const fileName = `${fullName.replace(/\s+/g, '_')}_Enhanced_Profile_${brandingConfig.companyName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      setPreviewGenerated(true);
      
      toast({
        title: "Enhanced PDF Generated Successfully",
        description: `Professional multi-page report exported as ${fileName}`,
      });
      
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the enhanced PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enhanced Professional Player Profile Generator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Generate Multi-Page PDF Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Create a comprehensive 3-page professional report for {player.firstName} {player.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{player.position}</Badge>
                    <Badge variant="outline">{player.nationality}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Enhanced Report Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Star className="h-3 w-3" />
                      {brandingConfig.companyName} professional branding
                    </li>
                    <li className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Enhanced cover page with key stats
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="h-3 w-3" />
                      Detailed attribute analysis with visual bars
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      Comprehensive performance review
                    </li>
                    <li className="flex items-center gap-2">
                      <QrCode className="h-3 w-3" />
                      QR codes for video/document links
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Professional signatures & contact info
                    </li>
                  </ul>
                </div>

                {canGeneratePDF ? (
                  <Button 
                    onClick={generateEnhancedPDF} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>Generating Enhanced PDF...</>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Enhanced Professional PDF
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Lock className="h-4 w-4" />
                        <h4 className="font-medium">Premium Feature</h4>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Enhanced PDF reports are available for Admin users and paid subscribers.
                      </p>
                    </div>
                    <Button 
                      disabled 
                      className="w-full"
                      variant="outline"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Required
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enhanced Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {previewGenerated ? (
                    <div className="space-y-6 p-4 bg-white rounded border" style={{ fontFamily: 'system-ui' }}>
                      {/* Enhanced Header */}
                      <div className="text-white p-6 rounded" style={{ backgroundColor: brandingConfig.primaryColor }}>
                        <h1 className="text-2xl font-bold">{brandingConfig.companyName.toUpperCase()}</h1>
                        <p className="text-sm opacity-90">{brandingConfig.tagline}</p>
                      </div>

                      {/* Player Name & Status */}
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold" style={{ color: brandingConfig.primaryColor }}>
                          {player.firstName} {player.lastName}
                        </h2>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.position}</Badge>
                          <Badge variant="outline">{player.nationality}</Badge>
                          <Badge className="bg-green-100 text-green-800">RECOMMENDED</Badge>
                        </div>
                      </div>

                      {/* Key Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm text-gray-600">Age</p>
                          <p className="font-semibold">{new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rating</p>
                          <p className="font-semibold">8.5/10</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Market Value</p>
                          <p className="font-semibold">€250K - €400K</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current Club</p>
                          <p className="font-semibold">{player.currentClub?.name || 'Free Agent'}</p>
                        </div>
                      </div>

                      {/* Sample QR Code Section */}
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Media Links (with QR Codes)
                        </h3>
                        <div className="flex items-center gap-3 p-3 border rounded">
                          <QrCode className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">Season Highlights 2024</p>
                            <p className="text-xs text-gray-600">Best goals and assists compilation</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded">
                          <QrCode className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">Full Player CV</p>
                            <p className="text-xs text-gray-600">Complete playing history document</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Preview */}
                      <div className="text-xs text-gray-500 pt-4 border-t">
                        <p>{brandingConfig.companyName} - Confidential Player Assessment</p>
                        <p>Generated on {new Date().toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Generate PDF to see enhanced preview</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}