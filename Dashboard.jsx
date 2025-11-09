
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MentorshipRequest } from "@/entities/MentorshipRequest";
import { ReferralApplication } from "@/entities/ReferralApplication";
import { ReferralOpportunity } from "@/entities/ReferralOpportunity";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Briefcase, 
  BookOpen, 
  MessageCircle,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    mentorshipRequests: 0,
    applications: 0,
    opportunities: 0,
    resources: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getUserRole = (user) => {
    if (user?.role === 'admin') return 'admin';
    if (user?.year === 'Alumni' || (user?.expertise_domains && user.expertise_domains.length > 0)) {
      return 'mentor';
    }
    return 'user';
  };

  const loadDashboardData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const userRole = getUserRole(user);

      if (userRole === 'user') {
        // Load student-specific data
        let [mentorshipRequests, applications, opportunities] = await Promise.all([
          MentorshipRequest.filter({ student_id: user.id }),
          ReferralApplication.filter({ applicant_id: user.id }),
          ReferralOpportunity.list('-created_date', 5)
        ]);

        // Add safeguards to prevent crash if data is not returned as an array
        mentorshipRequests = mentorshipRequests || [];
        applications = applications || [];
        opportunities = opportunities || [];

        setStats({
          mentorshipRequests: mentorshipRequests.length,
          applications: applications.length,
          opportunities: opportunities.length,
          resources: 45 // Placeholder
        });

        // Create recent activities
        const activities = [
          ...applications.slice(0, 3).map(app => ({
            type: 'application',
            status: app.status,
            createdDate: app.created_date,
            description: `Applied for referral opportunity`
          })),
          ...mentorshipRequests.slice(0, 2).map(req => ({
            type: 'mentorship',
            status: req.status,
            createdDate: req.created_date,
            description: `Requested mentorship in ${req.domain}`
          }))
        ].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

        setRecentActivities(activities);
      } else if (userRole === 'mentor') {
        // Load mentor-specific data
        let [incomingRequests, referralRequests] = await Promise.all([
          MentorshipRequest.filter({ mentor_id: user.id }),
          ReferralApplication.list() // You might want to filter by mentor's opportunities
        ]);
        
        // Add safeguards
        incomingRequests = incomingRequests || [];
        referralRequests = referralRequests || [];

        setStats({
          mentorshipRequests: incomingRequests.filter(r => r.status === 'pending').length,
          activeMentees: incomingRequests.filter(r => r.status === 'accepted').length,
          referralRequests: referralRequests.length,
          totalConnections: incomingRequests.length
        });
      } else if (userRole === 'admin') {
        // Load admin-specific data
        let [allUsers, communities, opportunities] = await Promise.all([
          User.list(),
          // Community.list(), // Uncomment when Community entity is ready
          ReferralOpportunity.list()
        ]);
        
        // Add safeguards
        allUsers = allUsers || [];
        opportunities = opportunities || [];

        setStats({
          totalUsers: allUsers.length,
          communities: 12, // Placeholder
          opportunities: opportunities.length,
          activeConnections: 150 // Placeholder
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userRole = getUserRole(currentUser);

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            {userRole === 'admin' 
              ? 'Manage the platform and help students succeed' 
              : userRole === 'mentor' 
                ? 'Guide the next generation of professionals'
                : 'Ready to advance your career journey today?'
            }
          </p>
        </div>

        {/* Role-specific Stats Cards */}
        {userRole === 'user' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Mentorship Requests
                  </CardTitle>
                  <Users className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.mentorshipRequests}</div>
                  <p className="text-xs opacity-80 mt-1">Active connections</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Referral Applications
                  </CardTitle>
                  <Briefcase className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.applications}</div>
                  <p className="text-xs opacity-80 mt-1">Opportunities applied</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Available Opportunities
                  </CardTitle>
                  <TrendingUp className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.opportunities}</div>
                  <p className="text-xs opacity-80 mt-1">New this week</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Career Resources
                  </CardTitle>
                  <BookOpen className="w-5 h-5 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.resources}</div>
                  <p className="text-xs opacity-80 mt-1">Available guides</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link to={createPageUrl("Mentors")}>
                      <Button className="w-full justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200">
                        Find Mentors
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Referrals")}>
                      <Button className="w-full justify-between bg-green-50 hover:bg-green-100 text-green-700 border border-green-200">
                        Browse Referrals
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Resources")}>
                      <Button className="w-full justify-between bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200">
                        Career Resources
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("AIChat")}>
                      <Button className="w-full justify-between bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200">
                        AI Assistant
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Profile Completion */}
                <Card className="mt-6 shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      Profile Strength
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">85% Complete</span>
                      <span className="text-sm text-indigo-600 font-semibold">Strong</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Add your LinkedIn profile to reach 100%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivities.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(activity.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={getStatusColor(activity.status)}>
                                  {activity.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(activity.createdDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">No recent activities yet</p>
                        <p className="text-sm text-gray-400">
                          Start by finding mentors or applying for referrals
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {userRole === 'mentor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.mentorshipRequests}</div>
                <p className="text-sm opacity-80">Pending Requests</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.activeMentees}</div>
                <p className="text-sm opacity-80">Active Mentees</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.referralRequests}</div>
                <p className="text-sm opacity-80">Referral Requests</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.totalConnections}</div>
                <p className="text-sm opacity-80">Total Connections</p>
              </CardContent>
            </Card>
          </div>
        )}

        {userRole === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-sm opacity-80">Total Users</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.communities}</div>
                <p className="text-sm opacity-80">Active Communities</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.opportunities}</div>
                <p className="text-sm opacity-80">Job Opportunities</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stats.activeConnections}</div>
                <p className="text-sm opacity-80">Active Connections</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
