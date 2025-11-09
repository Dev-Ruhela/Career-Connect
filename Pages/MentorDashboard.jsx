import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MentorshipRequest } from "@/entities/MentorshipRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  GraduationCap,
  Building
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MentorDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    loadMentorData();
  }, []);

  const loadMentorData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const allRequests = await MentorshipRequest.list('-created_date');
      const userRequests = allRequests.filter(req => req.mentor_id === user.id);
      
      const pending = userRequests.filter(req => req.status === 'pending');
      const accepted = userRequests.filter(req => req.status === 'accepted');
      
      // Get student details
      const allUsers = await User.list();
      const userMap = allUsers.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {});

      const enrichedPending = pending.map(req => ({
        ...req,
        student: userMap[req.student_id] || {}
      }));

      const enrichedAccepted = accepted.map(req => ({
        ...req,
        student: userMap[req.student_id] || {}
      }));

      setIncomingRequests(enrichedPending);
      setActiveMentorships(enrichedAccepted);
    } catch (error) {
      console.error("Error loading mentor data:", error);
    }
    setIsLoading(false);
  };

  const handleRequestAction = async (request, action) => {
    try {
      await MentorshipRequest.update(request.id, { status: action });
      loadMentorData();
      setShowResponseDialog(false);
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  // Check if user is mentor
  if (!isLoading && currentUser && getUserRole(currentUser) !== 'mentor') {
    return (
      <div className="p-6 md:p-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mentor Access Only</h2>
            <p className="text-gray-600">This dashboard is only for mentors (Alumni and experienced seniors).</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserRole = (user) => {
    if (user?.role === 'admin') return 'admin';
    if (user?.year === 'Alumni' || user?.expertise_domains?.length > 0) return 'mentor';
    return 'user';
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Mentor Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your mentorship requests and active connections.
            </p>
          </div>
          <Button variant="outline" onClick={loadMentorData} className="mt-4 md:mt-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{incomingRequests.length}</div>
              <p className="text-sm opacity-80">Pending Requests</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{activeMentorships.length}</div>
              <p className="text-sm opacity-80">Active Mentorships</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{incomingRequests.length + activeMentorships.length}</div>
              <p className="text-sm opacity-80">Total Connections</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Pending Requests */}
          {incomingRequests.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Incoming Mentorship Requests ({incomingRequests.length})
              </h2>
              <div className="grid gap-6">
                {incomingRequests.map((request) => (
                  <Card key={request.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm border-l-4 border-l-yellow-400">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                              {request.student?.full_name?.slice(0, 2).toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{request.student?.full_name}</h3>
                            <p className="text-blue-600 font-medium">{request.student?.branch} • {request.student?.year}</p>
                            <div className="mt-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 mr-2">
                                {request.domain}
                              </Badge>
                              {request.student?.current_company && (
                                <Badge variant="outline">
                                  <Building className="w-3 h-3 mr-1" />
                                  {request.student.current_company}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {request.message}
                          </p>
                        </div>
                        {request.goals && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Goals:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {request.goals}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleRequestAction(request, 'rejected')}
                            className="text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button
                            onClick={() => handleRequestAction(request, 'accepted')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active Mentorships */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Active Mentorships ({activeMentorships.length})
            </h2>
            {activeMentorships.length > 0 ? (
              <div className="grid gap-4">
                {activeMentorships.map((mentorship) => (
                  <Card key={mentorship.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm border-l-4 border-l-green-400">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 ring-2 ring-green-200">
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold">
                              {mentorship.student?.full_name?.slice(0, 2).toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-gray-900">{mentorship.student?.full_name}</h3>
                            <p className="text-sm text-gray-600">{mentorship.domain}</p>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                        </div>
                        <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-500">
                          <Link to={createPageUrl(`MentorChat?request_id=${mentorship.id}`)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Mentorships</h3>
                  <p className="text-gray-500">Once you accept mentorship requests, they'll appear here</p>
                </CardContent>
              </Card>
            )}
          </div>

          {incomingRequests.length === 0 && activeMentorships.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Mentoring!</h3>
              <p className="text-gray-500 text-lg mb-4">
                You haven't received any mentorship requests yet
              </p>
              <p className="text-gray-400">
                Students will be able to find and connect with you through the "Find Mentors" page
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}