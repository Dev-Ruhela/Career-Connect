import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Community } from "@/entities/Community";
import { CommunityPost } from "@/entities/CommunityPost";
import { ReferralOpportunity } from "@/entities/ReferralOpportunity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { 
  PlusCircle, 
  Users as UsersIcon,
  MessageSquare,
  Settings,
  Globe,
  Briefcase,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCommunitiesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    cover_image_url: ""
  });

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    post_type: "General",
    opportunity_id: "",
    tags: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, comms, opps] = await Promise.all([
        User.me(),
        Community.list('-created_date'),
        ReferralOpportunity.list('-created_date')
      ]);
      setCurrentUser(user);
      setCommunities(comms);
      setOpportunities(opps);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim() || !newCommunity.description.trim()) return;

    try {
      await Community.create(newCommunity);
      setShowCreateDialog(false);
      setNewCommunity({ name: "", description: "", cover_image_url: "" });
      loadData();
    } catch (error) {
      console.error("Error creating community:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !selectedCommunity) return;

    try {
      const postData = {
        community_id: selectedCommunity.id,
        author_id: currentUser.id,
        title: newPost.title,
        content: newPost.content,
        post_type: newPost.post_type,
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (newPost.opportunity_id) {
        postData.opportunity_id = newPost.opportunity_id;
      }

      await CommunityPost.create(postData);
      setShowPostDialog(false);
      setNewPost({ title: "", content: "", post_type: "General", opportunity_id: "", tags: "" });
      setSelectedCommunity(null);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // Check if user is admin
  if (!isLoading && currentUser?.role !== 'admin') {
    return (
      <div className="p-6 md:p-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
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
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Manage Communities
            </h1>
            <p className="text-gray-600 text-lg">
              Create and manage communities for students and alumni.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-4 md:mt-0">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Community
          </Button>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card key={community.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group overflow-hidden">
              <div className="h-32 bg-cover bg-center" style={{backgroundImage: `url(${community.cover_image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop'})`}}></div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{community.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{community.description}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(createPageUrl(`Community?id=${community.id}`), '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowPostDialog(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Post
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Community Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Community Name</label>
                <Input
                  placeholder="e.g. Software Development Club"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe the community's purpose and goals..."
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image URL (Optional)</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={newCommunity.cover_image_url}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, cover_image_url: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleCreateCommunity}
                  disabled={!newCommunity.name.trim() || !newCommunity.description.trim()}
                >
                  Create Community
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Post Dialog */}
        <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Post in {selectedCommunity?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Post Type</label>
                <Select value={newPost.post_type} onValueChange={(value) => setNewPost(prev => ({ ...prev, post_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Opportunity">Job/Internship Opportunity</SelectItem>
                    <SelectItem value="Career Journey">Career Journey</SelectItem>
                    <SelectItem value="Success Story">Success Story</SelectItem>
                    <SelectItem value="Tips & Advice">Tips & Advice</SelectItem>
                    <SelectItem value="Industry Update">Industry Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPost.post_type === "Opportunity" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Link to Referral Opportunity</label>
                  <Select value={newPost.opportunity_id} onValueChange={(value) => setNewPost(prev => ({ ...prev, opportunity_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an opportunity" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunities.map(opp => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.position} at {opp.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Post title..."
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  placeholder="Write your post content..."
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g. internship, microsoft, sde"
                  value={newPost.tags}
                  onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowPostDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                >
                  Create Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}