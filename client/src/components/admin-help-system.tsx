import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle, Info, Users, Activity, Settings, Edit, Ban, Unlock, RefreshCw, Trash2, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

interface AdminHelpSystemProps {
  currentTab?: string;
}

export function AdminHelpSystem({ currentTab = 'users' }: AdminHelpSystemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = {
    users: {
      title: "User Management Guide",
      description: "Learn how to manage user accounts effectively",
      sections: [
        {
          title: "User Actions",
          icon: <Users className="h-4 w-4" />,
          items: [
            { action: "Edit", icon: <Edit className="h-3 w-3" />, description: "Modify user profile, role, and permissions. Use for updating user information or changing access levels." },
            { action: "Suspend", icon: <Ban className="h-3 w-3" />, description: "Temporarily disable user account. User cannot login but data is preserved. Use for policy violations or security concerns." },
            { action: "Unsuspend", icon: <Unlock className="h-3 w-3" />, description: "Restore access to suspended account. User can login again with existing credentials." },
            { action: "Reset Password", icon: <RefreshCw className="h-3 w-3" />, description: "Generate new password and send via email. Use when user forgets password or for security resets." },
            { action: "Delete", icon: <Trash2 className="h-3 w-3" />, description: "⚠️ PERMANENT deletion of user account and all associated data. Cannot be undone. Use only for serious violations." }
          ]
        },
        {
          title: "User Status Guide",
          icon: <Activity className="h-4 w-4" />,
          items: [
            { action: "Active", icon: <CheckCircle className="h-3 w-3 text-green-500" />, description: "User account is active and verified. Full platform access." },
            { action: "Suspended", icon: <Ban className="h-3 w-3 text-red-500" />, description: "Account temporarily disabled. User cannot access platform." },
            { action: "Inactive", icon: <Clock className="h-3 w-3 text-gray-500" />, description: "Account created but not yet activated by user." },
            { action: "Unverified", icon: <AlertTriangle className="h-3 w-3 text-yellow-500" />, description: "Email address not verified. Limited access to platform features." }
          ]
        }
      ]
    },
    activity: {
      title: "Activity Monitoring Guide",
      description: "Understanding admin activity logs and monitoring",
      sections: [
        {
          title: "Log Types",
          icon: <Activity className="h-4 w-4" />,
          items: [
            { action: "User Actions", icon: <Users className="h-3 w-3" />, description: "Track all user management actions including suspensions, role changes, and deletions." },
            { action: "System Changes", icon: <Settings className="h-3 w-3" />, description: "Monitor system configuration changes and administrative settings modifications." },
            { action: "Security Events", icon: <Shield className="h-3 w-3" />, description: "Log security-related events including failed logins, permission changes, and suspicious activity." }
          ]
        }
      ]
    },
    system: {
      title: "System Settings Guide",
      description: "Managing system-wide settings and maintenance",
      sections: [
        {
          title: "System Actions",
          icon: <Settings className="h-4 w-4" />,
          items: [
            { action: "Clean Sessions", icon: <RefreshCw className="h-3 w-3" />, description: "Remove expired user sessions from database. Improves performance and security." },
            { action: "Database Stats", icon: <Activity className="h-3 w-3" />, description: "Monitor database health and usage statistics. Track growth and performance metrics." }
          ]
        }
      ]
    }
  };

  const currentContent = helpContent[currentTab as keyof typeof helpContent];

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Help Guide
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open contextual help guide for admin dashboard</p>
            </TooltipContent>
          </Tooltip>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {currentContent.title}
            </DialogTitle>
            <DialogDescription>
              {currentContent.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {currentContent.sections.map((section, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.icon}
                          <Badge variant="outline" className="whitespace-nowrap">
                            {item.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Best Practices</h4>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Always verify user identity before performing account actions</li>
                <li>• Use suspension instead of deletion for policy violations</li>
                <li>• Monitor audit logs regularly for suspicious activity</li>
                <li>• Keep user data secure and follow privacy regulations</li>
                <li>• Document reasons for administrative actions</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export default AdminHelpSystem;