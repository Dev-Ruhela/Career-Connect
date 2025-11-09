import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MentorshipRequest } from "@/entities/MentorshipRequest";
import { ReferralApplication } from "@/entities/ReferralApplication";
import { ReferralOpportunity } from "@/entities/ReferralOpportunity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Briefcase, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyConnectionsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [mentorships, setMentorships] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // 1. Fetch all users to map IDs to names/profiles
      const allUsers = await User.list();
      const userMap = allUsers.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {});
      
      // 2. Fetch Mentorships (where status is accepted)
      const allMentorshipRequests = await MentorshipRequest.list();
      const activeMentorships = allMentorshipRequests
        .filter(req => req.status === 'accepted' && (req.student_id === user.id || req.mentor_id === user.id))
        .map(req => {
          const otherPersonId = req.student_id === user.id ? req.mentor_id : req.student_id;
          return { ...req, otherPerson: userMap[otherPersonId] || {} };
        });
      setMentorships(activeMentorships);
      
      // 3. Fetch My Referral Applications
      const allReferralApps = await ReferralApplication.list();
      const opportunities = await ReferralOpportunity.list();
      const opportunityMap = opportunities.reduce((acc, opp) => {
          acc[opp.id] = opp;
          return acc;
      }, {});

      const myReferralApps = allReferralApps
        .filter(app => app.applicant_id === user.id)
        .map(app => ({
            ...app,
            opportunity: opportunityMap[app.opportunity_id] || {},
            alumni: userMap[(opportunityMap[app.opportunity_id] || {}).posted_by] || {}
        }));
      setReferrals(myReferralApps);

    } catch (error) {
      console.error("Error loading connections:", error);
    }
    setIsLoading(false);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="p-6 md:p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              My Connections
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your mentorships and track your referrals.
            </p>
          </div>
          <Button variant="outline" onClick={loadConnections} className="mt-4 md:mt-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="mentorships" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mentorships">
              <Users className="w-4 h-4 mr-2"/>Mentorships
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Briefcase className="w-4 h-4 mr-2"/>My Referrals
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="mentorships" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Active Mentorships ({mentorships.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentorships.length > 0 ? mentorships.map(mentorship => (
                  <div key={mentorship.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                          {mentorship.otherPerson?.full_name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{mentorship.otherPerson?.full_name}</h3>
                        <p className="text-sm text-gray-600">{mentorship.domain}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link to={createPageUrl(`MentorChat?request_id=${mentorship.id}`)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Chat
                      </Link>
                    </Button>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-8">No active mentorships. Go to the "Find Mentors" page to connect with someone!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>My Referral Applications ({referrals.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {referrals.length > 0 ? referrals.map(app => (
                  <div key={app.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.opportunity.position}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Building className="w-4 h-4" />{app.opportunity.company_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         {getStatusIcon(app.status)}
                        <Badge variant="secondary" className={`${getStatusColor(app.status)} border`}>
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                       <p className="text-xs text-gray-500">Applied on {new Date(app.created_date).toLocaleDateString()}</p>
                       <p className="text-xs text-gray-500 mt-1">Reviewed by: <span className="font-medium">{app.alumni.full_name || 'N/A'}</span></p>
                       {app.reviewer_notes && (
                         <p className="text-xs text-blue-700 bg-blue-50 p-2 mt-2 rounded">
                           Note: {app.reviewer_notes}
                         </p>
                       )}
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-8">You haven't applied for any referrals yet. Go to the "Job Referrals" page to find opportunities!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}