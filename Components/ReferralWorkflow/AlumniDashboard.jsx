import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { ReferralApplication } from "@/entities/ReferralApplication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  MessageSquare,
  FileText,
  User as UserIcon,
  Calendar,
  RefreshCw
} from "lucide-react";

export default function AlumniDashboard({ incomingRequests, opportunities, currentUser, onRefresh }) {
  const [requestsWithDetails, setRequestsWithDetails] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequestDetails();
  }, [incomingRequests, opportunities]);

  const loadRequestDetails = async () => {
    try {
      const users = await User.list();
      
      const enrichedRequests = incomingRequests.map(request => {
        const opportunity = opportunities.find(opp => opp.id === request.opportunity_id);
        const applicant = users.find(user => user.id === request.applicant_id);
        
        return {
          ...request,
          opportunity,
          applicant
        };
      });
      
      setRequestsWithDetails(enrichedRequests);
    } catch (error) {
      console.error("Error loading request details:", error);
    }
    setIsLoading(false);
  };

  const handleReviewRequest = (request, action) => {
    setSelectedRequest(request);
    setReviewDialog(true);
    setReviewNotes("");
  };

  const submitReview = async (status) => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      await ReferralApplication.update(selectedRequest.id, {
        status: status,
        reviewer_notes: reviewNotes.trim() || `Application ${status} by alumni`
      });

      setReviewDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
      onRefresh();
    } catch (error) {
      console.error("Error updating application:", error);
      alert("Error updating application. Please try again.");
    }
    setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Alumni Dashboard</h2>
        <div className="grid gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const pendingRequests = requestsWithDetails.filter(req => req.status === 'pending');
  const reviewedRequests = requestsWithDetails.filter(req => req.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Alumni Dashboard</h2>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs opacity-80">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">
              {reviewedRequests.filter(req => req.status === 'approved').length}
            </div>
            <p className="text-xs opacity-80">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <div className="text-2xl font-bold">{requestsWithDetails.length}</div>
            <p className="text-xs opacity-80">Total Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="grid gap-6">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm border-l-4 border-l-yellow-400">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        {request.opportunity?.position || 'Position Not Found'}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Applied {new Date(request.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {request.applicant && (
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                          {request.applicant.full_name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{request.applicant.full_name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{request.applicant.branch} • Batch {request.applicant.batch}</p>
                          {request.applicant.skills && request.applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {request.applicant.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {request.applicant.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{request.applicant.skills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {request.cover_note && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Cover Note:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {request.cover_note}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    {request.resume_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={request.resume_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-1" />
                          View Resume
                        </a>
                      </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewRequest(request, 'rejected')}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReviewRequest(request, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Previously Reviewed */}
      {reviewedRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Previously Reviewed ({reviewedRequests.length})
          </h3>
          <div className="grid gap-4">
            {reviewedRequests.slice(0, 5).map((request) => (
              <Card key={request.id} className="shadow-md border-0 bg-white/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs">
                          {request.applicant?.full_name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {request.applicant?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.opportunity?.position} • {new Date(request.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <Badge variant="secondary" className={`${getStatusColor(request.status)} border text-xs`}>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requestsWithDetails.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Referral Requests</h3>
          <p className="text-gray-500">You haven't received any referral requests yet</p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedRequest?.applicant?.full_name} • {selectedRequest?.opportunity?.position}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add feedback notes (optional)
              </label>
              <Textarea
                placeholder="Provide feedback to the student about their application..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                onClick={() => submitReview('rejected')}
                disabled={isSubmitting}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => submitReview('approved')}
                disabled={isSubmitting}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {isSubmitting ? "Processing..." : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}