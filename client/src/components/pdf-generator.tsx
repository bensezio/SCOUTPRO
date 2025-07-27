import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Star, MapPin, Calendar, User, Trophy, Target, Zap, Shield, Heart, Users, Crown, Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Player, PlayerStats, ScoutingReport } from '@shared/schema';
import { getBrandingConfig, BrandingConfig } from '@/services/branding-service';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface PDFGeneratorProps {
  player: Player & {
    stats?: PlayerStats;
    latestReport?: ScoutingReport;
    currentClub?: { name: string };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlayerProfileData {
  personalInfo: {
    fullName: string;
    position: string;
    dateOfBirth: string;
    currentClub: string;
    nationality: string;
    shirtNumber?: string;
    height?: string;
    weight?: string;
    naturalFoot: string;
    rating: number;
    verdict: string;
  };
  attributes: {
    strengths: string[];
    weaknesses: string[];
  };
  analysis: {
    technical: string;
    psychological: string;
    physical: string;
    social: string;
    summary: string;
  };
  highlights: {
    videos: string[];
    documents: string[];
  };
  scout: {
    name: string;
    organization: string;
    status: string;
    createdTime: string;
    lastEdited: string;
  };
}

const ARK_SPORTS_BRANDING = {
  primaryColor: '#1a365d',
  secondaryColor: '#2d3748',
  accentColor: '#3182ce',
  textColor: '#2d3748',
  lightGray: '#f7fafc',
  gold: '#d69e2e'
};

export function PDFGenerator({ player, open, onOpenChange }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<PlayerProfileData | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch user's organization data for branding
  const { data: organizationData } = useQuery({
    queryKey: [`/api/organizations/${user?.organizationId}`],
    enabled: !!user?.organizationId && isAuthenticated,
  });
  
  // Get appropriate branding configuration
  const brandingConfig = getBrandingConfig(user?.organizationId, organizationData);
  
  // Check if user has access to PDF generation
  const canGeneratePDF = user && (
    user.role === 'admin' || 
    user.role === 'super_admin' ||
    user.subscriptionTier === 'club_professional' ||
    user.subscriptionTier === 'enterprise'
  );

  const generateProfileData = (): PlayerProfileData => {
    const age = player.dateOfBirth 
      ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()
      : null;

    return {
      personalInfo: {
        fullName: `${player.firstName} ${player.lastName}`,
        position: player.position,
        dateOfBirth: player.dateOfBirth || 'Not specified',
        currentClub: player.currentClub?.name || 'Free Agent',
        nationality: player.nationality || 'Not specified',
        shirtNumber: player.shirtNumber?.toString(),
        height: player.height ? `${player.height}cm` : undefined,
        weight: player.weight ? `${player.weight}kg` : undefined,
        naturalFoot: player.preferredFoot || 'Not specified',
        rating: player.latestReport?.overallRating || 0,
        verdict: player.latestReport?.overallRating >= 8 ? 'Elite' : 
                player.latestReport?.overallRating >= 6.5 ? 'Professional' : 'Developing'
      },
      attributes: {
        strengths: player.latestReport?.strengths?.split(',').map(s => s.trim()) || [
          'Composure', 'Passing', 'Defending', 'Dribbling'
        ],
        weaknesses: player.latestReport?.weaknesses?.split(',').map(w => w.trim()) || ['Speed']
      },
      analysis: {
        technical: player.latestReport?.technicalAnalysis || 'Technical analysis pending detailed scouting report.',
        psychological: player.latestReport?.mentalAnalysis || 'Psychological assessment pending detailed evaluation.',
        physical: player.latestReport?.physicalAnalysis || 'Physical attributes assessment in progress.',
        social: 'Team player with strong communication skills and leadership potential.',
        summary: player.latestReport?.summary || `${player.firstName} ${player.lastName} shows great potential and would be a valuable addition to any professional club.`
      },
      highlights: {
        videos: [],
        documents: []
      },
      scout: {
        name: 'Ark Sports Management',
        organization: 'arksportsmanagement.com',
        status: 'Active Assessment',
        createdTime: new Date().toLocaleDateString(),
        lastEdited: new Date().toLocaleDateString()
      }
    };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    const profileData = generateProfileData();
    setPreviewData(profileData);

    try {
      // Wait for preview to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page 1: Header and Basic Info
      await generatePage1(pdf, profileData);
      
      // Page 2: Detailed Analysis
      pdf.addPage();
      await generatePage2(pdf, profileData);
      
      // Page 3: Highlights and Contact
      pdf.addPage();
      await generatePage3(pdf, profileData);

      // Save the PDF
      const fileName = `${profileData.personalInfo.fullName.replace(/\s+/g, '_')}_Player_Profile.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePage1 = async (pdf: jsPDF, data: PlayerProfileData) => {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // Header with dynamic branding
    const headerColor = brandingConfig.primaryColor.replace('#', '');
    const r = parseInt(headerColor.substr(0, 2), 16);
    const g = parseInt(headerColor.substr(2, 2), 16);
    const b = parseInt(headerColor.substr(4, 2), 16);
    
    pdf.setFillColor(r, g, b);
    pdf.rect(0, 0, pageWidth, brandingConfig.layout.headerHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text(brandingConfig.companyName.toUpperCase(), 10, 15);
    pdf.setFontSize(10);
    pdf.text(brandingConfig.tagline || 'Professional Football Analytics', 10, 20);

    // Player name
    pdf.setTextColor(26, 54, 93);
    pdf.setFontSize(24);
    pdf.text(data.personalInfo.fullName, 20, 45);

    // Basic info section
    let yPos = 60;
    const leftCol = 20;
    const rightCol = 110;

    pdf.setFontSize(12);
    pdf.setTextColor(45, 55, 72);

    // Left column
    pdf.text('Position:', leftCol, yPos);
    pdf.text(data.personalInfo.position, leftCol + 30, yPos);

    yPos += 10;
    pdf.text('Date of Birth:', leftCol, yPos);
    pdf.text(data.personalInfo.dateOfBirth, leftCol + 30, yPos);

    yPos += 10;
    pdf.text('Current Club:', leftCol, yPos);
    pdf.text(data.personalInfo.currentClub, leftCol + 30, yPos);

    yPos += 10;
    pdf.text('Nationality:', leftCol, yPos);
    pdf.text(data.personalInfo.nationality, leftCol + 30, yPos);

    // Right column
    yPos = 60;
    if (data.personalInfo.height) {
      pdf.text('Height:', rightCol, yPos);
      pdf.text(data.personalInfo.height, rightCol + 25, yPos);
      yPos += 10;
    }

    pdf.text('Natural Foot:', rightCol, yPos);
    pdf.text(data.personalInfo.naturalFoot, rightCol + 25, yPos);

    yPos += 10;
    pdf.text('Rating (0-10):', rightCol, yPos);
    pdf.text(data.personalInfo.rating.toString(), rightCol + 25, yPos);

    yPos += 10;
    pdf.text('Verdict:', rightCol, yPos);
    pdf.text(data.personalInfo.verdict, rightCol + 25, yPos);

    // Strengths and Weaknesses
    yPos += 20;
    pdf.setFontSize(14);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Strengths:', leftCol, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    data.attributes.strengths.forEach((strength, index) => {
      if (index > 0 && index % 4 === 0) yPos += 8;
      pdf.text(strength, leftCol + (index % 4) * 35, yPos);
    });

    yPos += 20;
    pdf.setFontSize(14);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Weaknesses:', leftCol, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    data.attributes.weaknesses.forEach((weakness, index) => {
      pdf.text(weakness, leftCol + (index * 35), yPos);
    });

    // Scout info
    yPos += 30;
    pdf.setFontSize(12);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Scout Report By:', leftCol, yPos);
    
    yPos += 8;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    pdf.text(data.scout.name, leftCol, yPos);
    pdf.text(data.scout.organization, leftCol, yPos + 6);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`${data.personalInfo.fullName} - Player Profile`, 20, pageHeight - 10);
    pdf.text('Page 1', pageWidth - 20, pageHeight - 10);
  };

  const generatePage2 = async (pdf: jsPDF, data: PlayerProfileData) => {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 30;

    // Page header
    pdf.setFontSize(18);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Detailed Analysis', 20, yPos);

    yPos += 20;

    // Technical/Tactical section
    pdf.setFontSize(14);
    pdf.text('Technical / Tactical', 20, yPos);
    pdf.text('Psychological', 110, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    
    const technicalLines = pdf.splitTextToSize(data.analysis.technical, 80);
    const psychLines = pdf.splitTextToSize(data.analysis.psychological, 80);
    
    technicalLines.forEach((line: string, index: number) => {
      pdf.text(line, 20, yPos + (index * 5));
    });
    
    psychLines.forEach((line: string, index: number) => {
      pdf.text(line, 110, yPos + (index * 5));
    });

    yPos += Math.max(technicalLines.length, psychLines.length) * 5 + 20;

    // Physical and Social sections
    pdf.setFontSize(14);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Physical', 20, yPos);
    pdf.text('Social', 110, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    
    const physicalLines = pdf.splitTextToSize(data.analysis.physical, 80);
    const socialLines = pdf.splitTextToSize(data.analysis.social, 80);
    
    physicalLines.forEach((line: string, index: number) => {
      pdf.text(line, 20, yPos + (index * 5));
    });
    
    socialLines.forEach((line: string, index: number) => {
      pdf.text(line, 110, yPos + (index * 5));
    });

    yPos += Math.max(physicalLines.length, socialLines.length) * 5 + 20;

    // Summary section
    pdf.setFontSize(14);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Summary', 20, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    const summaryLines = pdf.splitTextToSize(data.analysis.summary, 160);
    summaryLines.forEach((line: string, index: number) => {
      pdf.text(line, 20, yPos + (index * 5));
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`${data.personalInfo.fullName} - Player Profile`, 20, pageHeight - 10);
    pdf.text('Page 2', pageWidth - 20, pageHeight - 10);
  };

  const generatePage3 = async (pdf: jsPDF, data: PlayerProfileData) => {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 30;

    // Page header
    pdf.setFontSize(18);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Player Highlights & Contact', 20, yPos);

    yPos += 20;

    // Video highlights section
    pdf.setFontSize(14);
    pdf.text('Player Highlights', 20, yPos);

    yPos += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    pdf.text('Video highlights and match footage available upon request.', 20, yPos);
    pdf.text(`Please contact ${brandingConfig.companyName} for access to:`, 20, yPos + 10);
    pdf.text('• Match footage and highlights', 30, yPos + 20);
    pdf.text('• Training session videos', 30, yPos + 25);
    pdf.text('• Skills demonstration reels', 30, yPos + 30);
    pdf.text('• Interview footage', 30, yPos + 35);

    yPos += 50;

    // CV/Resume section
    pdf.setFontSize(14);
    pdf.setTextColor(26, 54, 93);
    pdf.text('CV / Résumé', 20, yPos);

    yPos += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(45, 55, 72);
    pdf.text('Complete player CV and documentation package available on request.', 20, yPos);

    yPos += 30;

    // Contact information
    pdf.setFontSize(14);
    pdf.setTextColor(26, 54, 93);
    pdf.text('Contact Information', 20, yPos);

    yPos += 15;
    pdf.setFontSize(12);
    pdf.setTextColor(45, 55, 72);
    pdf.text(brandingConfig.companyName, 20, yPos);
    pdf.text(brandingConfig.tagline || 'Professional Football Analytics', 20, yPos + 8);
    
    if (brandingConfig.contactInfo.website) {
      pdf.text(`Website: ${brandingConfig.contactInfo.website}`, 20, yPos + 16);
    }
    if (brandingConfig.contactInfo.email) {
      pdf.text(`Email: ${brandingConfig.contactInfo.email}`, 20, yPos + 24);
    }
    if (brandingConfig.contactInfo.phone) {
      pdf.text(`Phone: ${brandingConfig.contactInfo.phone}`, 20, yPos + 32);
    }
    if (brandingConfig.contactInfo.address) {
      pdf.text(`Address: ${brandingConfig.contactInfo.address}`, 20, yPos + 40);
    }
    
    // License numbers
    if (brandingConfig.contactInfo.licenseNumbers && brandingConfig.contactInfo.licenseNumbers.length > 0) {
      let licenseYPos = yPos + 48;
      brandingConfig.contactInfo.licenseNumbers.forEach((license, index) => {
        pdf.text(license, 20, licenseYPos + (index * 6));
      });
    }

    yPos += 60; // Increased space for license numbers

    // Disclaimer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    const disclaimerText = brandingConfig.disclaimers.confidentiality;
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, 170);
    disclaimerLines.forEach((line: string, index: number) => {
      pdf.text(line, 20, yPos + (index * 4));
    });
    
    // Additional disclaimers if available
    if (brandingConfig.disclaimers.liability) {
      const liabilityLines = pdf.splitTextToSize(brandingConfig.disclaimers.liability, 170);
      liabilityLines.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPos + 20 + (index * 4));
      });
    }
    
    if (brandingConfig.disclaimers.dataProtection) {
      const dataProtectionLines = pdf.splitTextToSize(brandingConfig.disclaimers.dataProtection, 170);
      dataProtectionLines.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPos + 40 + (index * 4));
      });
    }

    // Footer
    pdf.text(`${data.personalInfo.fullName} - Player Profile`, 20, pageHeight - 10);
    pdf.text('Page 3', pageWidth - 20, pageHeight - 10);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional Player Profile Generator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate PDF Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Create a professional, branded PDF report for {player.firstName} {player.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{player.position}</Badge>
                    <Badge variant="outline">{player.nationality}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Report Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Star className="h-3 w-3" />
                      {brandingConfig.companyName} professional branding
                    </li>
                    <li className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      Complete player profile
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="h-3 w-3" />
                      Technical analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      Professional layout
                    </li>
                  </ul>
                </div>

                {canGeneratePDF ? (
                  <Button 
                    onClick={generatePDF} 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>Generating PDF...</>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Professional PDF
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
                        Professional PDF reports are available for Admin users and paid subscribers.
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
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {previewData ? (
                    <div className="space-y-6 p-4 bg-white rounded border" style={{ fontFamily: 'system-ui' }}>
                      {/* Header */}
                      <div className="text-white p-4 rounded" style={{ backgroundColor: brandingConfig.primaryColor }}>
                        <h1 className="text-xl font-bold">{brandingConfig.companyName.toUpperCase()}</h1>
                        <p className="text-sm opacity-90">{brandingConfig.tagline || 'Professional Football Analytics'}</p>
                      </div>

                      {/* Player Name */}
                      <h2 className="text-2xl font-bold" style={{ color: brandingConfig.primaryColor }}>
                        {previewData.personalInfo.fullName}
                      </h2>

                      {/* Basic Info Grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Position:</strong> {previewData.personalInfo.position}</p>
                          <p><strong>Date of Birth:</strong> {previewData.personalInfo.dateOfBirth}</p>
                          <p><strong>Current Club:</strong> {previewData.personalInfo.currentClub}</p>
                          <p><strong>Nationality:</strong> {previewData.personalInfo.nationality}</p>
                        </div>
                        <div>
                          {previewData.personalInfo.height && (
                            <p><strong>Height:</strong> {previewData.personalInfo.height}</p>
                          )}
                          <p><strong>Natural Foot:</strong> {previewData.personalInfo.naturalFoot}</p>
                          <p><strong>Rating:</strong> {previewData.personalInfo.rating}/10</p>
                          <p><strong>Verdict:</strong> {previewData.personalInfo.verdict}</p>
                        </div>
                      </div>

                      {/* Strengths */}
                      <div>
                        <h3 className="font-bold text-blue-900 mb-2">Strengths</h3>
                        <div className="flex flex-wrap gap-2">
                          {previewData.attributes.strengths.map((strength, index) => (
                            <Badge key={index} variant="secondary">{strength}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Analysis Preview */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-bold text-blue-900">Technical</h4>
                          <p className="text-xs">{previewData.analysis.technical.substring(0, 100)}...</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900">Physical</h4>
                          <p className="text-xs">{previewData.analysis.physical.substring(0, 100)}...</p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 border-t pt-4">
                        <p>Full 3-page report with complete analysis, highlights, and contact information</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Generate PDF to see preview
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