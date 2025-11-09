
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Community } from "@/entities/Community";
import { CommunityMember } from "@/entities/CommunityMember";
import { CommunityPost } from "@/entities/CommunityPost";
import { ReferralOpportunity } from "@/entities/ReferralOpportunity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  PlusCircle, 
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Briefcase,
  Send,
  PenSquare
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import OpportunityCard from "../components/referrals/OpportunityCard";

const PostCard = ({ post, author, opportunity, onReferralClick, suggestedMentors }) => {
  const [showMentorSuggestions, setShowMentorSuggestions] = useState(false);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 ring-2 ring-blue-200">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
              {author?.full_name?.slice(0, 2).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
            <p className="text-sm text-gray-600">
              Posted by <span className="font-medium text-blue-600">{author?.full_name}</span> on {new Date(post.created_date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">{post.post_type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
        
        {opportunity && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Linked Opportunity:</h4>
            <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-bold text-blue-700">{opportunity.position}</p>
                <p className="text-sm text-gray-600">{opportunity.company_name} - {opportunity.location}</p>
                <Button 
                  className="mt-3 w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600"
                  onClick={() => onReferralClick(opportunity)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Request Referral for this Opportunity
                </Button>
                
                {/* Mentor Suggestions for Job Posts */}
                {suggestedMentors && suggestedMentors.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-yellow-800">💡 Need Help Getting This Job?</h5>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowMentorSuggestions(!showMentorSuggestions)}
                        className="text-yellow-700 hover:text-yellow-800"
                      >
                        {showMentorSuggestions ? 'Hide' : 'Show'} Mentors
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-700 mb-3">Connect with these mentors who can guide you:</p>
                    
                    {showMentorSuggestions && (
                      <div className="space-y-2">
                        {suggestedMentors.slice(0, 3).map(mentor => (
                          <div key={mentor.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-blue-500 text-white text-xs">
                                  {mentor.full_name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-medium">{mentor.full_name}</p>
                                <p className="text-xs text-gray-500">{mentor.current_company}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={createPageUrl("Mentors")}>
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Chat
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm text-gray-500 border-t pt-3">
          <div className="flex gap-4">
            <button className="flex items-center gap-1 hover:text-blue-600">
              <ThumbsUp className="w-4 h-4" /> {post.likes_count}
            </button>
            <button className="flex items-center gap-1 hover:text-blue-600">
              <MessageSquare className="w-4 h-4" /> {post.comments_count}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {post.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CommunityPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [opportunities, setOpportunities] = useState({});
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadCommunityData = useCallback(async (id) => {
    const community = communities.find(c => c.id === id);
    if (!community) return;
    
    setSelectedCommunity(community);
    setIsLoading(true);
    
    try {
      const communityPosts = await CommunityPost.filter({ community_id: id }, '-created_date');
      setPosts(communityPosts);

      // Fetch authors and opportunities
      const authorIds = [...new Set(communityPosts.map(p => p.author_id))];
      const opportunityIds = [...new Set(communityPosts.map(p => p.opportunity_id).filter(Boolean))];
      
      const [allUsers, allOpportunities] = await Promise.all([
        User.list(),
        opportunityIds.length > 0 ? ReferralOpportunity.filter({ id: { $in: opportunityIds } }) : Promise.resolve([])
      ]);

      const authorMap = allUsers.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      setAuthors(authorMap);

      const opportunityMap = allOpportunities.reduce((acc, opp) => {
        acc[opp.id] = opp;
        return acc;
      }, {});
      setOpportunities(opportunityMap);

    } catch (error) {
      console.error("Error loading community posts:", error);
    }
    setIsLoading(false);
  }, [communities]); // communities is a dependency because it's used inside the function

  useEffect(() => {
    if (communityId) {
      loadCommunityData(communityId);
    } else {
      setSelectedCommunity(null);
      setPosts([]);
    }
  }, [communityId, communities, loadCommunityData]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [user, comms, membs, allUsers] = await Promise.all([
        User.me(),
        Community.list('-created_date'),
        CommunityMember.list(),
        User.list()
      ]);
      
      setCurrentUser(user);
      setCommunities(comms);
      setMemberships(membs.filter(m => m.user_id === user.id));
      
      // Get potential mentors
      const potentialMentors = allUsers.filter(u => 
        u.id !== user.id && 
        (u.year === 'Alumni' || (u.expertise_domains && u.expertise_domains.length > 0))
      );
      setMentors(potentialMentors);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
    setIsLoading(false);
  };
  
  const handleJoinCommunity = async (communityId) => {
    try {
      await CommunityMember.create({ community_id: communityId, user_id: currentUser.id });
      setMemberships([...memberships, { community_id: communityId, user_id: currentUser.id }]);
    } catch (error) {
      console.error("Error joining community", error);
    }
  };

  const handleReferralClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowApplicationDialog(true);
  };

  const getSuggestedMentorsForOpportunity = (opportunity) => {
    if (!opportunity) return [];
    
    // Find mentors from the same company or with relevant expertise
    return mentors.filter(mentor => 
      mentor.current_company === opportunity.company_name ||
      mentor.expertise_domains?.some(domain => 
        opportunity.required_skills?.some(skill => 
          skill.toLowerCase().includes(domain.toLowerCase())
        )
      )
    ).slice(0, 5);
  };

  if (isLoading && !selectedCommunity && communities.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Viewing a specific community's posts
  if (selectedCommunity) {
    return (
      <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link to={createPageUrl("Community")}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Communities
              </Button>
            </Link>
          </div>
          <Card className="mb-8 overflow-hidden shadow-xl border-0">
            <img src={selectedCommunity.cover_image_url || "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop"} alt={selectedCommunity.name} className="w-full h-48 object-cover" />
            <div className="p-6 bg-white/80 backdrop-blur-sm">
              <h1 className="text-3xl font-bold text-gray-900">{selectedCommunity.name}</h1>
              <p className="text-gray-600 mt-2">{selectedCommunity.description}</p>
            </div>
          </Card>

          <div className="space-y-6">
            {isLoading ? (
              <>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.id}
                  post={post}
                  author={authors[post.author_id]}
                  opportunity={opportunities[post.opportunity_id]}
                  onReferralClick={handleReferralClick}
                  suggestedMentors={post.post_type === 'Opportunity' ? getSuggestedMentorsForOpportunity(opportunities[post.opportunity_id]) : []}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
                <p className="text-gray-500">Be the first to post in this community!</p>
              </div>
            )}
          </div>

          {/* Re-use OpportunityCard's dialog for application */}
          {selectedOpportunity && (
              <OpportunityCard 
                opportunity={selectedOpportunity} 
                currentUser={currentUser}
                onApplicationSuccess={loadInitialData}
                _showApplicationDialog={showApplicationDialog}
                _setShowApplicationDialog={setShowApplicationDialog}
              />
            )}

        </div>
      </div>
    );
  }
  
  // Viewing list of all communities
  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Join a Community
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with peers, share knowledge, and find opportunities.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => {
            const isMember = memberships.some(m => m.community_id === community.id);
            return (
              <Card key={community.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group overflow-hidden flex flex-col">
                <div className="h-32 bg-cover bg-center" style={{backgroundImage: `url(${community.cover_image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop'})`}}></div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2 flex-grow line-clamp-3">
                    {community.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <Link to={createPageUrl(`Community?id=${community.id}`)} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Posts
                      </Button>
                    </Link>
                    {!isMember && (
                      <Button className="ml-2 w-full" onClick={() => handleJoinCommunity(community.id)}>
                        Join
                      </Button>
                    )}
                     {isMember && (
                      <Badge variant="secondary" className="ml-2 whitespace-nowrap bg-green-100 text-green-800">Joined</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
