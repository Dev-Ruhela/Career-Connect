import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MentorshipRequest } from "@/entities/MentorshipRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  MapPin, 
  Building, 
  Calendar,
  MessageSquare,
  Star,
  Users,
  Briefcase,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestDomain, setRequestDomain] = useState("");
  const [requestGoals, setRequestGoals] = useState("");

  useEffect(() => {
    loadMentorsAndUser();
  }, []);

  const loadMentorsAndUser = async () => {
    try {
      const [allUsers, user, requests] = await Promise.all([
        User.list('-created_date'),
        User.me(),
        MentorshipRequest.list()
      ]);
      
      // Filter to get potential mentors (alumni and seniors with expertise)
      const potentialMentors = allUsers.filter(u => 
        u.id !== user.id && 
        (u.year === 'Alumni' || (u.expertise_domains && u.expertise_domains.length > 0))
      );
      
      setMentors(potentialMentors);
      setCurrentUser(user);
      setMentorshipRequests(requests);
    } catch (error) {
      console.error("Error loading mentors:", error);
    }
    setIsLoading(false);
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.current_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise_domains?.some(domain => 
                           domain.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesBranch = filterBranch === "all" || mentor.branch === filterBranch;
    const matchesYear = filterYear === "all" || mentor.year === filterYear;
    
    return matchesSearch && matchesBranch && matchesYear;
  });

  const handleRequestMentorship = (mentor) => {
    setSelectedMentor(mentor);
    setShowRequestDialog(true);
    setRequestMessage("");
    setRequestDomain("");
    setRequestGoals("");
  };

  const submitMentorshipRequest = async () => {
    if (!requestMessage.trim() || !requestDomain.trim()) return;

    try {
      await MentorshipRequest.create({
        student_id: currentUser.id,
        mentor_id: selectedMentor.id,
        domain: requestDomain,
        message: requestMessage,
        goals: requestGoals,
        status: "pending"
      });

      setShowRequestDialog(false);
      loadMentorsAndUser();
    } catch (error) {
      console.error("Error submitting mentorship request:", error);
    }
  };

  const getMentorStatus = (mentorId) => {
    const request = mentorshipRequests.find(r => r.mentor_id === mentorId && r.student_id === currentUser.id);
    return request ? request : null;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Find Your Mentor 🎯
          </h1>
          <p className="text-gray-600 text-lg">
            Connect with experienced seniors and alumni for career guidance
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search mentors, companies, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="CSE">Computer Science</SelectItem>
                  <SelectItem value="IT">Information Technology</SelectItem>
                  <SelectItem value="ECE">Electronics & Communication</SelectItem>
                  <SelectItem value="ME">Mechanical Engineering</SelectItem>
                  <SelectItem value="CE">Civil Engineering</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{mentors.length}</div>
              <p className="text-xs opacity-80">Available Mentors</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Building className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">50+</div>
              <p className="text-xs opacity-80">Companies</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs opacity-80">Avg Rating</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">1.2k</div>
              <p className="text-xs opacity-80">Connections Made</p>
            </CardContent>
          </Card>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => {
            const requestStatus = getMentorStatus(mentor.id);
            return (
              <Card key={mentor.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 ring-2 ring-blue-200">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-lg">
                        {mentor.full_name?.slice(0, 2).toUpperCase() || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {mentor.full_name}
                      </h3>
                      <p className="text-blue-600 font-medium text-sm">{mentor.position}</p>
                      {mentor.current_company && (
                        <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                          <Building className="w-3 h-3" />
                          {mentor.current_company}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {mentor.branch} • Batch {mentor.batch} • {mentor.year}
                      </span>
                    </div>
                  </div>

                  {mentor.expertise_domains && mentor.expertise_domains.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Expertise Areas:</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise_domains.slice(0, 3).map((domain, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {domain}
                          </Badge>
                        ))}
                        {mentor.expertise_domains.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{mentor.expertise_domains.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {mentor.bio && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {mentor.bio}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!requestStatus ? (
                      <Button
                        onClick={() => handleRequestMentorship(mentor)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg transition-all duration-200"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Request Mentorship
                      </Button>
                    ) : requestStatus.status === 'pending' ? (
                      <Button
                        disabled
                        className="flex-1"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Request Pending
                      </Button>
                    ) : requestStatus.status === 'accepted' ? (
                      <Button
                        asChild
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg transition-all duration-200"
                      >
                        <Link to={createPageUrl(`MentorChat?request_id=${requestStatus.id}`)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Start Chat
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Request Rejected
                      </Button>
                    )}
                    {mentor.linkedin_url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No mentors found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters</p>
          </div>
        )}

        {/* Mentorship Request Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Mentorship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mentorship Domain</label>
                <Input
                  placeholder="e.g. Software Development, Career Guidance..."
                  value={requestDomain}
                  onChange={(e) => setRequestDomain(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Personal Message</label>
                <Textarea
                  placeholder="Introduce yourself and explain why you'd like mentorship from this person..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Your Goals (Optional)</label>
                <Textarea
                  placeholder="What do you hope to achieve through this mentorship?"
                  value={requestGoals}
                  onChange={(e) => setRequestGoals(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowRequestDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                  onClick={submitMentorshipRequest}
                  disabled={!requestMessage.trim() || !requestDomain.trim()}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}