import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Building,
  Calendar,
  MapPin,
  FileText,
  RefreshCw
} from "lucide-react";

export default function StudentDashboard({ applications, opportunities, onRefresh }) {
  const [applicationsWithDetails, setApplicationsWithDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplicationDetails();
  }, [applications, opportunities]);

  const loadApplicationDetails = async () => {
    try {
      const users = await User.list();
      
      const enrichedApplications = applications.map(app => {
        const opportunity = opportunities.find(opp => opp.id === app.opportunity_id);
        const alumniPoster = users.find(user => user.id === opportunity?.posted_by);
        
        return {
          ...app,
          opportunity,
          alumniPoster
        };
      });
      
      setApplicationsWithDetails(enrichedApplications);
    } catch (error) {
      console.error("Error loading application details:", error);
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Referral Applications</h2>
          <Button variant="outline" size="icon" disabled>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Referral Applications</h2>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">
              {applicationsWithDetails.filter(app => app.status === 'pending').length}
            </div>
            <p className="text-xs opacity-80">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">
              {applicationsWithDetails.filter(app => app.status === 'approved').length}
            </div>
            <p className="text-xs opacity-80">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">
              {applicationsWithDetails.filter(app => app.status === 'rejected').length}
            </div>
            <p className="text-xs opacity-80">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applicationsWithDetails.length > 0 ? (
        <div className="grid gap-6">
          {applicationsWithDetails.map((application) => (
            <Card key={application.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                      {application.opportunity?.position || 'Position Not Found'}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-blue-600">
                        {application.opportunity?.company_name || 'Company Not Found'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(application.status)}
                    <Badge variant="secondary" className={`${getStatusColor(application.status)} border`}>
                      {getStatusText(application.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {application.opportunity?.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {application.opportunity.location}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Applied on {new Date(application.created_date).toLocaleDateString()}
                </div>

                {application.cover_note && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Your Cover Note:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {application.cover_note}
                    </p>
                  </div>
                )}

                {application.reviewer_notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Alumni Feedback:</p>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                      {application.reviewer_notes}
                    </p>
                  </div>
                )}

                {application.alumniPoster && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                          {application.alumniPoster.full_name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {application.alumniPoster.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Alumni Reviewer
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {application.resume_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-1" />
                            View Resume
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
          <p className="text-gray-500 mb-4">You haven't applied for any referrals yet</p>
          <Button variant="outline">
            Browse Opportunities
          </Button>
        </div>
      )}
    </div>
  );
}