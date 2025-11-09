import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { ReferralOpportunity } from "@/entities/ReferralOpportunity";
import { ReferralApplication } from "@/entities/ReferralApplication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  Briefcase, 
  PlusCircle,
  Building,
  MapPin,
  DollarSign,
  Calendar as CalendarIcon,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Shield
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOpportunitiesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [alumniUsers, setAlumniUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);

  const [opportunityData, setOpportunityData] = useState({
    posted_by: "",
    company_name: "",
    position: "",
    job_type: "Full-time",
    location: "",
    required_skills: "",
    description: "",
    salary_range: "",
    application_deadline: null,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, opps, apps, users] = await Promise.all([
        User.me(),
        ReferralOpportunity.list('-created_date'),
        ReferralApplication.list('-created_date'),
        User.list()
      ]);
      
      setCurrentUser(user);
      setOpportunities(opps);
      setApplications(apps);
      
      // Filter alumni users for posting opportunities on behalf
      const alumni = users.filter(u => u.year === 'Alumni');
      setAlumniUsers(alumni);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const getOpportunityStats = (opportunityId) => {
    const opportunityApps = applications.filter(app => app.opportunity_id === opportunityId);
    return {
      totalApplications: opportunityApps.length,
      pendingApplications: opportunityApps.filter(app => app.status === 'pending').length,
      approvedApplications: opportunityApps.filter(app => app.status === 'approved').length,
      rejectedApplications: opportunityApps.filter(app => app.status === 'rejected').length
    };
  };

  const handleCreateOpportunity = () => {
    setEditingOpportunity(null);
    setOpportunityData({
      posted_by: currentUser.id,
      company_name: "",
      position: "",
      job_type: "Full-time",
      location: "",
      required_skills: "",
      description: "",
      salary_range: "",
      application_deadline: null,
      is_active: true
    });
    setShowCreateDialog(true);
  };

  const handleEditOpportunity = (opportunity) => {
    setEditingOpportunity(opportunity);
    setOpportunityData({
      posted_by: opportunity.posted_by,
      company_name: opportunity.company_name,
      position: opportunity.position,
      job_type: opportunity.job_type,
      location: opportunity.location,
      required_skills: opportunity.required_skills?.join(', ') || "",
      description: opportunity.description,
      salary_range: opportunity.salary_range || "",
      application_deadline: opportunity.application_deadline ? new Date(opportunity.application_deadline) : null,
      is_active: opportunity.is_active
    });
    setShowCreateDialog(true);
  };

  const submitOpportunity = async () => {
    if (!opportunityData.company_name.trim() || !opportunityData.position.trim() || !opportunityData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const submissionData = {
        ...opportunityData,
        required_skills: opportunityData.required_skills.split(',').map(skill => skill.trim()).filter(Boolean),
        application_deadline: opportunityData.application_deadline ? opportunityData.application_deadline.toISOString().split('T')[0] : null
      };

      if (editingOpportunity) {
        await ReferralOpportunity.update(editingOpportunity.id, submissionData);
      } else {
        await ReferralOpportunity.create(submissionData);
      }

      setShowCreateDialog(false);
      setEditingOpportunity(null);
      loadData();
    } catch (error) {
      console.error("Error submitting opportunity:", error);
      alert("Error saving opportunity. Please try again.");
    }
  };

  const toggleOpportunityStatus = async (opportunity) => {
    try {
      await ReferralOpportunity.update(opportunity.id, { is_active: !opportunity.is_active });
      loadData();
    } catch (error) {
      console.error("Error toggling opportunity status:", error);
    }
  };

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

  const totalOpportunities = opportunities.length;
  const activeOpportunities = opportunities.filter(opp => opp.is_active).length;
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Post Opportunities
            </h1>
            <p className="text-gray-600 text-lg">
              Create and manage job and internship opportunities for students.
            </p>
          </div>
          <Button onClick={handleCreateOpportunity}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Post New Opportunity
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{totalOpportunities}</div>
              <p className="text-sm opacity-80">Total Opportunities</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{activeOpportunities}</div>
              <p className="text-sm opacity-80">Active Opportunities</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{totalApplications}</div>
              <p className="text-sm opacity-80">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold">{pendingApplications}</div>
              <p className="text-sm opacity-80">Pending Reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {opportunities.map((opportunity) => {
            const stats = getOpportunityStats(opportunity.id);
            const poster = alumniUsers.find(u => u.id === opportunity.posted_by) || currentUser;

            return (
              <Card key={opportunity.id} className={`shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm ${!opportunity.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        {opportunity.position}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-blue-600">{opportunity.company_name}</span>
                        <Badge variant="secondary" className={`${opportunity.job_type === 'Full-time' ? 'bg-green-100 text-green-800' : opportunity.job_type === 'Internship' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {opportunity.job_type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOpportunityStatus(opportunity)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {opportunity.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-red-500" />}
                    </Button>
                  </div>
                  
                  {opportunity.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {opportunity.location}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {opportunity.description}
                  </p>

                  {opportunity.required_skills && opportunity.required_skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {opportunity.required_skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {opportunity.required_skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{opportunity.required_skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    {opportunity.salary_range && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="w-4 h-4" />
                        {opportunity.salary_range}
                      </div>
                    )}
                    {opportunity.application_deadline && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <CalendarIcon className="w-4 h-4" />
                        Deadline: {new Date(opportunity.application_deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Application Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center text-sm bg-gray-50 rounded-lg p-3">
                    <div>
                      <div className="font-bold text-gray-600">{stats.totalApplications}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="font-bold text-yellow-600">{stats.pendingApplications}</div>
                      <div className="text-xs text-gray-500">Pending</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{stats.approvedApplications}</div>
                      <div className="text-xs text-gray-500">Approved</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-600">{stats.rejectedApplications}</div>
                      <div className="text-xs text-gray-500">Rejected</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Posted by {poster?.full_name}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditOpportunity(opportunity)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {opportunities.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No opportunities posted yet</h3>
            <p className="text-gray-500">Create your first job or internship opportunity for students</p>
            <Button onClick={handleCreateOpportunity} className="mt-4">
              <PlusCircle className="w-4 h-4 mr-2" />
              Post Your First Opportunity
            </Button>
          </div>
        )}

        {/* Create/Edit Opportunity Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOpportunity ? 'Edit Opportunity' : 'Post New Opportunity'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Company Name *</Label>
                  <Input
                    placeholder="e.g. Google, Microsoft, Amazon"
                    value={opportunityData.company_name}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Position *</Label>
                  <Input
                    placeholder="e.g. Software Engineer Intern"
                    value={opportunityData.position}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Job Type</Label>
                  <Select value={opportunityData.job_type} onValueChange={(value) => setOpportunityData(prev => ({ ...prev, job_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Location</Label>
                  <Input
                    placeholder="e.g. San Francisco, Remote, Hybrid"
                    value={opportunityData.location}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Required Skills (comma-separated)</Label>
                <Input
                  placeholder="e.g. React, Node.js, Python, Machine Learning"
                  value={opportunityData.required_skills}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, required_skills: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Description *</Label>
                <Textarea
                  placeholder="Detailed job description, responsibilities, and requirements..."
                  value={opportunityData.description}
                  onChange={(e) => setOpportunityData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Salary Range (optional)</Label>
                  <Input
                    placeholder="e.g. $80,000 - $120,000, ₹15-25 LPA"
                    value={opportunityData.salary_range}
                    onChange={(e) => setOpportunityData(prev => ({ ...prev, salary_range: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Application Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {opportunityData.application_deadline ? format(opportunityData.application_deadline, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={opportunityData.application_deadline}
                        onSelect={(date) => setOpportunityData(prev => ({ ...prev, application_deadline: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Posted By</Label>
                <Select value={opportunityData.posted_by} onValueChange={(value) => setOpportunityData(prev => ({ ...prev, posted_by: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select poster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={currentUser.id}>Me (Admin)</SelectItem>
                    {alumniUsers.map(alumni => (
                      <SelectItem key={alumni.id} value={alumni.id}>
                        {alumni.full_name} - {alumni.current_company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={submitOpportunity}
                  disabled={!opportunityData.company_name.trim() || !opportunityData.position.trim() || !opportunityData.description.trim()}
                >
                  {editingOpportunity ? 'Update Opportunity' : 'Post Opportunity'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}