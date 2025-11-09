
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { MentorshipRequest } from "@/entities/MentorshipRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus,
  Eye,
  Edit,
  Building,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Shield
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMentorsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [promoteData, setPromoteData] = useState({
    expertise_domains: "",
    current_company: "",
    position: "",
    bio: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, users, requests] = await Promise.all([
        User.me(),
        User.list('-created_date'),
        MentorshipRequest.list('-created_date')
      ]);
      
      setCurrentUser(user);
      setAllUsers(users);
      
      // Filter mentors (alumni or users with expertise domains)
      const mentorUsers = users.filter(u => 
        u.year === 'Alumni' || (u.expertise_domains && u.expertise_domains.length > 0)
      );
      setMentors(mentorUsers);
      setMentorshipRequests(requests);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const getMentorStats = (mentorId) => {
    const requests = mentorshipRequests.filter(r => r.mentor_id === mentorId);
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      activeMentees: requests.filter(r => r.status === 'accepted').length,
      rejectedRequests: requests.filter(r => r.status === 'rejected').length
    };
  };

  const handlePromoteToMentor = (user) => {
    setSelectedUser(user);
    setPromoteData({
      expertise_domains: user.expertise_domains?.join(', ') || "",
      current_company: user.current_company || "",
      position: user.position || "",
      bio: user.bio || "",
      // If promoting a potential mentor, set their year/batch explicitly if needed
      year: user.year || "",
      batch: user.batch || ""
    });
    setShowPromoteDialog(true);
  };

  const submitPromoteToMentor = async () => {
    if (!selectedUser) return;

    try {
      // For real users from the backend, update their profile
      // For fake users, this logic would simulate their promotion, maybe by adding them to the mentors list if not already there
      const updateData = {
        expertise_domains: promoteData.expertise_domains.split(',').map(d => d.trim()).filter(Boolean),
        current_company: promoteData.current_company,
        position: promoteData.position,
        bio: promoteData.bio,
        year: promoteData.year || selectedUser.year, // Ensure year is passed, especially for "Alumni"
        batch: promoteData.batch || selectedUser.batch,
      };

      // If selectedUser has a real ID, we'd update. Otherwise, this is a simulated promotion.
      // For this example, we assume `User.update` handles real users.
      // For fake users, we might add them to the `mentors` state directly for display purposes,
      // but they wouldn't persist without a backend call.
      if (!selectedUser.id.startsWith("fake_")) { // Check if it's a real user from backend
        await User.update(selectedUser.id, updateData);
      } else {
        // Simulate promotion for fake user for immediate UI feedback (won't persist)
        // In a real app, this would involve creating a new user record or updating a mock DB
        console.log("Simulating promotion for fake user:", selectedUser.full_name, updateData);
        // You might add this simulated mentor to the `mentors` list here for temporary display
        // setMentors(prev => [...prev, { ...selectedUser, ...updateData }]);
      }

      setShowPromoteDialog(false);
      setSelectedUser(null);
      setPromoteData({ expertise_domains: "", current_company: "", position: "", bio: "" });
      loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error("Error promoting user to mentor:", error);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.current_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise_domains?.some(domain => 
                           domain.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    let matchesStatus = true;
    if (filterStatus !== "all") {
      const stats = getMentorStats(mentor.id);
      if (filterStatus === "active" && stats.activeMentees === 0) matchesStatus = false;
      if (filterStatus === "pending" && stats.pendingRequests === 0) matchesStatus = false;
      if (filterStatus === "inactive" && stats.totalRequests > 0) matchesStatus = false;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Check if user is admin
  if (!isLoading && currentUser?.role !== 'admin') {
    return (
      <div className="p-6 md:p-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalMentors = mentors.length;
  const activeMentors = mentors.filter(m => getMentorStats(m.id).activeMentees > 0).length;
  const pendingRequests = mentorshipRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Manage Mentors
            </h1>
            <p className="text-gray-600 text-lg">
              View and manage mentor profiles and their mentorship activities.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{totalMentors}</div>
              <p className="text-sm opacity-80">Total Mentors</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{activeMentors}</div>
              <p className="text-sm opacity-80">Active Mentors</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{pendingRequests}</div>
              <p className="text-sm opacity-80">Pending Requests</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{allUsers.filter(u => u.year !== 'Alumni' && (!u.expertise_domains || u.expertise_domains.length === 0)).length}</div>
              <p className="text-sm opacity-80">Potential Mentors</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search mentors, companies, expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mentors</SelectItem>
                  <SelectItem value="active">Active (Has Mentees)</SelectItem>
                  <SelectItem value="pending">Has Pending Requests</SelectItem>
                  <SelectItem value="inactive">No Active Mentorships</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredMentors.map((mentor) => {
            const stats = getMentorStats(mentor.id);
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
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>{mentor.branch} • Batch {mentor.batch} • {mentor.year}</span>
                  </div>

                  {mentor.expertise_domains && mentor.expertise_domains.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Expertise:</p>
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

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm bg-gray-50 rounded-lg p-3">
                    <div>
                      <div className="font-bold text-blue-600">{stats.activeMentees}</div>
                      <div className="text-xs text-gray-600">Active</div>
                    </div>
                    <div>
                      <div className="font-bold text-yellow-600">{stats.pendingRequests}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-600">{stats.totalRequests}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handlePromoteToMentor(mentor)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Potential Mentors Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Potential Mentors</CardTitle>
            <p className="text-gray-600">Students and alumni who could become mentors</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                {
                  id: "fake_1",
                  full_name: "Parth Dhokane",
                  branch: "IT",
                  year: "4th Year",
                  batch: "2025"
                },
                {
                  id: "fake_2", 
                  full_name: "Mukul Singhal",
                  branch: "IT",
                  year: "4th Year",
                  batch: "2025"
                },
                {
                  id: "fake_3",
                  full_name: "Shashank Arora", 
                  branch: "IT",
                  year: "4th Year",
                  batch: "2025"
                },
                {
                  id: "fake_4",
                  full_name: "Tejas Sharma",
                  branch: "IT", 
                  year: "4th Year",
                  batch: "2025"
                },
                {
                  id: "fake_5",
                  full_name: "Ansh Gupta",
                  branch: "CSE",
                  year: "Alumni",
                  batch: "2023"
                }
              ].map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {user.full_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-600">{user.branch} • {user.year}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handlePromoteToMentor(user)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Promote to Mentor
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Promote to Mentor Dialog */}
        <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Promote to Mentor</DialogTitle>
              <p className="text-sm text-gray-600">
                Set up {selectedUser?.full_name} as a mentor
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Expertise Domains (comma-separated)</label>
                <Input
                  placeholder="e.g. Software Development, Data Science, Product Management"
                  value={promoteData.expertise_domains}
                  onChange={(e) => setPromoteData(prev => ({ ...prev, expertise_domains: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Current Company</label>
                <Input
                  placeholder="e.g. Google, Microsoft, Amazon"
                  value={promoteData.current_company}
                  onChange={(e) => setPromoteData(prev => ({ ...prev, current_company: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Position</label>
                <Input
                  placeholder="e.g. Senior Software Engineer, Product Manager"
                  value={promoteData.position}
                  onChange={(e) => setPromoteData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Textarea
                  placeholder="Brief bio and background..."
                  value={promoteData.bio}
                  onChange={(e) => setPromoteData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowPromoteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={submitPromoteToMentor}
                  disabled={!promoteData.expertise_domains.trim()}
                >
                  Promote to Mentor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No mentors found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or promote some users to mentors</p>
          </div>
        )}
      </div>
    </div>
  );
}
