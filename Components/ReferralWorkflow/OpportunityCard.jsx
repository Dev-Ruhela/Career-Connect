
import React, { useState } from "react";
import { User } from "@/entities/User";
import { ReferralApplication } from "@/entities/ReferralApplication";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MapPin, 
  Calendar, 
  DollarSign,
  Upload,
  ExternalLink,
  Building,
  Briefcase,
  Clock,
  Send
} from "lucide-react";

export default function OpportunityCard({ opportunity, currentUser, onApplicationSuccess, _showApplicationDialog, _setShowApplicationDialog }) {
  const [isDialogControlledExternally] = useState(typeof _showApplicationDialog !== 'undefined');
  const [internalShowDialog, setInternalShowDialog] = useState(false);
  
  const showApplicationDialog = isDialogControlledExternally ? _showApplicationDialog : internalShowDialog;
  const setShowApplicationDialog = isDialogControlledExternally ? _setShowApplicationDialog : setInternalShowDialog;

  const [applicationData, setApplicationData] = useState({
    resume_file: null,
    linkedin_url: "",
    cover_note: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedBy, setPostedBy] = useState(null);

  React.useEffect(() => {
    loadPostedBy();
  }, [opportunity.posted_by]);

  const loadPostedBy = async () => {
    try {
      const users = await User.list();
      const poster = users.find(u => u.id === opportunity.posted_by);
      setPostedBy(poster);
    } catch (error) {
      console.error("Error loading poster:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setApplicationData(prev => ({ ...prev, resume_file: file }));
    } else {
      alert("Please select a PDF file for your resume");
    }
  };

  const handleSubmitApplication = async () => {
    if (!applicationData.resume_file || !applicationData.cover_note.trim()) {
      alert("Please upload your resume and write a cover note");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload resume
      const { file_url } = await UploadFile({ file: applicationData.resume_file });

      // Create application
      await ReferralApplication.create({
        opportunity_id: opportunity.id,
        applicant_id: currentUser.id,
        resume_url: file_url,
        cover_note: applicationData.cover_note,
        status: "pending"
      });

      setShowApplicationDialog(false);
      setApplicationData({ resume_file: null, linkedin_url: "", cover_note: "" });
      onApplicationSuccess();
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    }
    setIsSubmitting(false);
  };

  const getJobTypeColor = (type) => {
    switch (type) {
      case "Full-time": return "bg-green-100 text-green-800";
      case "Internship": return "bg-blue-100 text-blue-800";
      case "Part-time": return "bg-yellow-100 text-yellow-800";
      case "Contract": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                {opportunity.position}
              </CardTitle>
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-blue-600">{opportunity.company_name}</span>
                <Badge variant="secondary" className={getJobTypeColor(opportunity.job_type)}>
                  {opportunity.job_type}
                </Badge>
              </div>
            </div>
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
                <Calendar className="w-4 h-4" />
                Deadline: {new Date(opportunity.application_deadline).toLocaleDateString()}
              </div>
            )}
          </div>

          {postedBy && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                  {postedBy.full_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{postedBy.full_name}</p>
                <p className="text-xs text-gray-500">{postedBy.position} at {postedBy.current_company}</p>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowApplicationDialog(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-lg transition-all duration-200"
          >
            <Send className="w-4 h-4 mr-2" />
            Request Referral
          </Button>
        </CardContent>
      </Card>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Referral</DialogTitle>
            <p className="text-sm text-gray-600">
              {opportunity.position} at {opportunity.company_name}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Resume (PDF)</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {applicationData.resume_file ? applicationData.resume_file.name : "Click to upload PDF"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">LinkedIn Profile (Optional)</label>
              <Input
                placeholder="https://linkedin.com/in/yourprofile"
                value={applicationData.linkedin_url}
                onChange={(e) => setApplicationData(prev => ({ ...prev, linkedin_url: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cover Note</label>
              <Textarea
                placeholder="Write a brief note explaining your interest and why you'd be a good fit..."
                value={applicationData.cover_note}
                onChange={(e) => setApplicationData(prev => ({ ...prev, cover_note: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowApplicationDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                onClick={handleSubmitApplication}
                disabled={isSubmitting || !applicationData.resume_file || !applicationData.cover_note.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
